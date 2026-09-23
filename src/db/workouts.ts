import type { SQLiteDatabase } from 'expo-sqlite';

import { nowIso } from '@/lib/dates';

export interface Session {
  id: number;
  startedAt: string;
  endedAt: string | null;
  notes: string | null;
  setCount: number;
  exerciseCount: number;
  volumeKg: number;
}

export interface SetLog {
  id: number;
  sessionId: number;
  exerciseId: string;
  exerciseName: string;
  setIndex: number;
  setType: string;
  weightKg: number | null;
  reps: number | null;
  rpe: number | null;
  completedAt: string | null;
}

type SessionRow = {
  id: number;
  started_at: string;
  ended_at: string | null;
  notes: string | null;
  set_count: number;
  exercise_count: number;
  volume_kg: number | null;
};

const SESSION_SELECT = `
  SELECT s.id, s.started_at, s.ended_at, s.notes,
         COUNT(l.id) AS set_count,
         COUNT(DISTINCT l.exercise_id) AS exercise_count,
         SUM(COALESCE(l.weight_kg, 0) * COALESCE(l.reps, 0)) AS volume_kg
  FROM sessions s LEFT JOIN set_logs l ON l.session_id = s.id`;

function sessionFromRow(r: SessionRow): Session {
  return {
    id: r.id,
    startedAt: r.started_at,
    endedAt: r.ended_at,
    notes: r.notes,
    setCount: r.set_count,
    exerciseCount: r.exercise_count,
    volumeKg: r.volume_kg ?? 0,
  };
}

export async function listSessions(db: SQLiteDatabase, limit = 50): Promise<Session[]> {
  const rows = await db.getAllAsync<SessionRow>(
    `${SESSION_SELECT} GROUP BY s.id ORDER BY s.started_at DESC LIMIT ?`,
    [limit],
  );
  return rows.map(sessionFromRow);
}

export async function getSession(db: SQLiteDatabase, id: number): Promise<Session | null> {
  const row = await db.getFirstAsync<SessionRow>(`${SESSION_SELECT} WHERE s.id = ? GROUP BY s.id`, [id]);
  return row ? sessionFromRow(row) : null;
}

export async function getActiveSession(db: SQLiteDatabase): Promise<Session | null> {
  const row = await db.getFirstAsync<SessionRow>(
    `${SESSION_SELECT} WHERE s.ended_at IS NULL GROUP BY s.id ORDER BY s.started_at DESC LIMIT 1`,
  );
  return row ? sessionFromRow(row) : null;
}

export async function startSession(db: SQLiteDatabase): Promise<number> {
  const res = await db.runAsync('INSERT INTO sessions (started_at) VALUES (?)', [nowIso()]);
  return res.lastInsertRowId;
}

export async function finishSession(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync('UPDATE sessions SET ended_at = ? WHERE id = ?', [nowIso(), id]);
}

export async function deleteSession(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync('DELETE FROM sessions WHERE id = ?', [id]);
}

type SetRow = {
  id: number;
  session_id: number;
  exercise_id: string;
  exercise_name: string;
  set_index: number;
  set_type: string;
  weight_kg: number | null;
  reps: number | null;
  rpe: number | null;
  completed_at: string | null;
};

export async function listSets(db: SQLiteDatabase, sessionId: number): Promise<SetLog[]> {
  const rows = await db.getAllAsync<SetRow>(
    `SELECT l.*, e.name AS exercise_name
     FROM set_logs l JOIN exercises e ON e.id = l.exercise_id
     WHERE l.session_id = ? ORDER BY l.id`,
    [sessionId],
  );
  return rows.map((r) => ({
    id: r.id,
    sessionId: r.session_id,
    exerciseId: r.exercise_id,
    exerciseName: r.exercise_name,
    setIndex: r.set_index,
    setType: r.set_type,
    weightKg: r.weight_kg,
    reps: r.reps,
    rpe: r.rpe,
    completedAt: r.completed_at,
  }));
}

/** Adds a set for an exercise, pre-filled from the last set of that exercise in this session
 *  or, failing that, from the most recent set of that exercise ever logged. */
export async function addSet(db: SQLiteDatabase, sessionId: number, exerciseId: string): Promise<number> {
  const last = await db.getFirstAsync<{ set_index: number; weight_kg: number | null; reps: number | null }>(
    `SELECT set_index, weight_kg, reps FROM set_logs
     WHERE session_id = ? AND exercise_id = ? ORDER BY set_index DESC LIMIT 1`,
    [sessionId, exerciseId],
  );
  const previous =
    last ??
    (await db.getFirstAsync<{ set_index: number; weight_kg: number | null; reps: number | null }>(
      `SELECT 0 AS set_index, weight_kg, reps FROM set_logs
       WHERE exercise_id = ? AND completed_at IS NOT NULL ORDER BY id DESC LIMIT 1`,
      [exerciseId],
    ));
  const res = await db.runAsync(
    `INSERT INTO set_logs (session_id, exercise_id, set_index, weight_kg, reps)
     VALUES (?, ?, ?, ?, ?)`,
    [sessionId, exerciseId, (last?.set_index ?? 0) + 1, previous?.weight_kg ?? null, previous?.reps ?? null],
  );
  return res.lastInsertRowId;
}

export async function updateSet(
  db: SQLiteDatabase,
  id: number,
  patch: { weightKg?: number | null; reps?: number | null; rpe?: number | null; completed?: boolean },
): Promise<void> {
  const sets: string[] = [];
  const params: (number | string | null)[] = [];
  if ('weightKg' in patch) { sets.push('weight_kg = ?'); params.push(patch.weightKg ?? null); }
  if ('reps' in patch) { sets.push('reps = ?'); params.push(patch.reps ?? null); }
  if ('rpe' in patch) { sets.push('rpe = ?'); params.push(patch.rpe ?? null); }
  if ('completed' in patch) { sets.push('completed_at = ?'); params.push(patch.completed ? nowIso() : null); }
  if (!sets.length) return;
  params.push(id);
  await db.runAsync(`UPDATE set_logs SET ${sets.join(', ')} WHERE id = ?`, params);
}

export async function deleteSet(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync('DELETE FROM set_logs WHERE id = ?', [id]);
}

export interface ExerciseBest {
  maxWeightKg: number | null;
  bestE1rm: number | null;
  lastPerformed: string | null;
}

/** Epley estimated 1RM from the best completed set. */
export async function exerciseBest(db: SQLiteDatabase, exerciseId: string): Promise<ExerciseBest> {
  const row = await db.getFirstAsync<{ max_w: number | null; e1rm: number | null; last: string | null }>(
    `SELECT MAX(weight_kg) AS max_w,
            MAX(weight_kg * (1 + reps / 30.0)) AS e1rm,
            MAX(completed_at) AS last
     FROM set_logs WHERE exercise_id = ? AND completed_at IS NOT NULL AND reps > 0`,
    [exerciseId],
  );
  return {
    maxWeightKg: row?.max_w ?? null,
    bestE1rm: row?.e1rm ? Math.round(row.e1rm) : null,
    lastPerformed: row?.last ?? null,
  };
}
