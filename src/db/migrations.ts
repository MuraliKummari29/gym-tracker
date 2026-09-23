import type { SQLiteDatabase } from 'expo-sqlite';

import seed from '@/assets/data/exercises.json';

const SCHEMA_V1 = `
PRAGMA journal_mode = 'wal';

CREATE TABLE IF NOT EXISTS exercises (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  force TEXT,
  level TEXT,
  mechanic TEXT,
  equipment TEXT NOT NULL,
  category TEXT,
  primary_muscles TEXT NOT NULL,
  secondary_muscles TEXT NOT NULL,
  instructions TEXT NOT NULL,
  images TEXT NOT NULL,
  media_url TEXT
);
CREATE INDEX IF NOT EXISTS idx_exercises_equipment ON exercises(equipment);

CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  started_at TEXT NOT NULL,
  ended_at TEXT,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS set_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  exercise_id TEXT NOT NULL REFERENCES exercises(id),
  set_index INTEGER NOT NULL,
  set_type TEXT NOT NULL DEFAULT 'normal',
  weight_kg REAL,
  reps INTEGER,
  rpe REAL,
  completed_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_set_logs_session ON set_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_set_logs_exercise ON set_logs(exercise_id);

CREATE TABLE IF NOT EXISTS challenges (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  preset_id TEXT NOT NULL,
  name TEXT NOT NULL,
  duration_days INTEGER NOT NULL,
  fail_policy TEXT NOT NULL,
  started_on TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  attempt INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS challenge_tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  challenge_id INTEGER NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  title TEXT NOT NULL,
  kind TEXT NOT NULL,
  target_value REAL,
  target_unit TEXT,
  detail TEXT,
  sort INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS challenge_task_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id INTEGER NOT NULL REFERENCES challenge_tasks(id) ON DELETE CASCADE,
  day_key TEXT NOT NULL,
  done INTEGER NOT NULL DEFAULT 0,
  UNIQUE(task_id, day_key)
);

CREATE TABLE IF NOT EXISTS profile (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  sex TEXT NOT NULL,
  age INTEGER NOT NULL,
  height_cm REAL NOT NULL,
  weight_kg REAL NOT NULL,
  activity TEXT NOT NULL,
  goal TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
`;

type SeedExercise = {
  id: string;
  name: string;
  force: string | null;
  level: string | null;
  mechanic: string | null;
  equipment: string;
  category: string | null;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  instructions: string[];
  images: string[];
};

async function seedExercises(db: SQLiteDatabase) {
  const row = await db.getFirstAsync<{ n: number }>('SELECT COUNT(*) AS n FROM exercises');
  if ((row?.n ?? 0) > 0) return;

  const stmt = await db.prepareAsync(
    `INSERT INTO exercises
      (id, name, force, level, mechanic, equipment, category, primary_muscles, secondary_muscles, instructions, images)
     VALUES ($id, $name, $force, $level, $mechanic, $equipment, $category, $pm, $sm, $ins, $img)`,
  );
  try {
    await db.withTransactionAsync(async () => {
      for (const e of seed as SeedExercise[]) {
        await stmt.executeAsync({
          $id: e.id,
          $name: e.name,
          $force: e.force,
          $level: e.level,
          $mechanic: e.mechanic,
          $equipment: e.equipment,
          $category: e.category,
          $pm: JSON.stringify(e.primaryMuscles),
          $sm: JSON.stringify(e.secondaryMuscles),
          $ins: JSON.stringify(e.instructions),
          $img: JSON.stringify(e.images),
        });
      }
    });
  } finally {
    await stmt.finalizeAsync();
  }
}

export async function migrate(db: SQLiteDatabase) {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  let version = row?.user_version ?? 0;

  if (version < 1) {
    await db.execAsync(SCHEMA_V1);
    await db.execAsync('PRAGMA user_version = 1');
    version = 1;
  }

  await db.execAsync('PRAGMA foreign_keys = ON');
  await seedExercises(db);
}
