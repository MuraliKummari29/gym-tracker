import type { SQLiteDatabase } from 'expo-sqlite';

import type { ChallengePreset, FailPolicy } from '@/lib/challenge-presets';
import { addDays, daysBetween, todayKey } from '@/lib/dates';

export interface Challenge {
  id: number;
  presetId: string;
  name: string;
  durationDays: number;
  failPolicy: FailPolicy;
  startedOn: string;
  status: 'active' | 'completed' | 'failed';
  attempt: number;
}

export interface ChallengeTask {
  id: number;
  challengeId: number;
  key: string;
  title: string;
  kind: string;
  targetValue: number | null;
  targetUnit: string | null;
  detail: string | null;
  sort: number;
  doneToday: boolean;
}

export type DayStatus = 'complete' | 'partial' | 'missed' | 'today' | 'future';

type ChallengeRow = {
  id: number;
  preset_id: string;
  name: string;
  duration_days: number;
  fail_policy: FailPolicy;
  started_on: string;
  status: Challenge['status'];
  attempt: number;
};

function fromRow(r: ChallengeRow): Challenge {
  return {
    id: r.id,
    presetId: r.preset_id,
    name: r.name,
    durationDays: r.duration_days,
    failPolicy: r.fail_policy,
    startedOn: r.started_on,
    status: r.status,
    attempt: r.attempt,
  };
}

export async function getActiveChallenge(db: SQLiteDatabase): Promise<Challenge | null> {
  const row = await db.getFirstAsync<ChallengeRow>(
    `SELECT * FROM challenges WHERE status = 'active' ORDER BY id DESC LIMIT 1`,
  );
  return row ? fromRow(row) : null;
}

export async function startChallenge(db: SQLiteDatabase, preset: ChallengePreset, attempt = 1): Promise<number> {
  let id = 0;
  await db.withTransactionAsync(async () => {
    const res = await db.runAsync(
      `INSERT INTO challenges (preset_id, name, duration_days, fail_policy, started_on, attempt)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [preset.id, preset.name, preset.durationDays, preset.failPolicy, todayKey(), attempt],
    );
    id = res.lastInsertRowId;
    for (const [i, t] of preset.tasks.entries()) {
      await db.runAsync(
        `INSERT INTO challenge_tasks (challenge_id, key, title, kind, target_value, target_unit, detail, sort)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, t.key, t.title, t.kind, t.targetValue ?? null, t.targetUnit ?? null, t.detail ?? null, i],
      );
    }
  });
  return id;
}

export async function listTasks(db: SQLiteDatabase, challengeId: number, dayKey = todayKey()): Promise<ChallengeTask[]> {
  const rows = await db.getAllAsync<{
    id: number; challenge_id: number; key: string; title: string; kind: string;
    target_value: number | null; target_unit: string | null; detail: string | null; sort: number; done: number | null;
  }>(
    `SELECT t.*, l.done
     FROM challenge_tasks t
     LEFT JOIN challenge_task_logs l ON l.task_id = t.id AND l.day_key = ?
     WHERE t.challenge_id = ? ORDER BY t.sort`,
    [dayKey, challengeId],
  );
  return rows.map((r) => ({
    id: r.id,
    challengeId: r.challenge_id,
    key: r.key,
    title: r.title,
    kind: r.kind,
    targetValue: r.target_value,
    targetUnit: r.target_unit,
    detail: r.detail,
    sort: r.sort,
    doneToday: r.done === 1,
  }));
}

export async function setTaskDone(db: SQLiteDatabase, taskId: number, done: boolean, dayKey = todayKey()): Promise<void> {
  await db.runAsync(
    `INSERT INTO challenge_task_logs (task_id, day_key, done) VALUES (?, ?, ?)
     ON CONFLICT(task_id, day_key) DO UPDATE SET done = excluded.done`,
    [taskId, dayKey, done ? 1 : 0],
  );
}

/** One status per calendar day of the challenge, for the progress grid. */
export async function dayStatuses(db: SQLiteDatabase, c: Challenge): Promise<DayStatus[]> {
  const taskCount = (await db.getFirstAsync<{ n: number }>(
    'SELECT COUNT(*) AS n FROM challenge_tasks WHERE challenge_id = ?', [c.id],
  ))?.n ?? 0;
  const rows = await db.getAllAsync<{ day_key: string; n: number }>(
    `SELECT l.day_key, COUNT(*) AS n
     FROM challenge_task_logs l JOIN challenge_tasks t ON t.id = l.task_id
     WHERE t.challenge_id = ? AND l.done = 1 GROUP BY l.day_key`,
    [c.id],
  );
  const doneByDay = new Map(rows.map((r) => [r.day_key, r.n]));
  const today = todayKey();
  const out: DayStatus[] = [];
  for (let i = 0; i < c.durationDays; i++) {
    const key = addDays(c.startedOn, i);
    const done = doneByDay.get(key) ?? 0;
    if (key > today) out.push('future');
    else if (done >= taskCount && taskCount > 0) out.push('complete');
    else if (key === today) out.push('today');
    else if (done > 0) out.push('partial');
    else out.push('missed');
  }
  return out;
}

export function currentDayNumber(c: Challenge): number {
  return Math.min(c.durationDays, daysBetween(c.startedOn, todayKey()) + 1);
}

export async function setChallengeStatus(db: SQLiteDatabase, id: number, status: Challenge['status']): Promise<void> {
  await db.runAsync('UPDATE challenges SET status = ? WHERE id = ?', [status, id]);
}

/** Restart policy: mark the current run failed and start a fresh attempt from today. */
export async function restartChallenge(db: SQLiteDatabase, c: Challenge, preset: ChallengePreset): Promise<number> {
  await setChallengeStatus(db, c.id, 'failed');
  return startChallenge(db, preset, c.attempt + 1);
}
