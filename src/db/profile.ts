import type { SQLiteDatabase } from 'expo-sqlite';

import { nowIso } from '@/lib/dates';
import type { Activity, Goal, ProfileInput, Sex } from '@/lib/nutrition';

type Row = {
  sex: Sex;
  age: number;
  height_cm: number;
  weight_kg: number;
  activity: Activity;
  goal: Goal;
};

export async function getProfile(db: SQLiteDatabase): Promise<ProfileInput | null> {
  const r = await db.getFirstAsync<Row>('SELECT * FROM profile WHERE id = 1');
  if (!r) return null;
  return { sex: r.sex, age: r.age, heightCm: r.height_cm, weightKg: r.weight_kg, activity: r.activity, goal: r.goal };
}

export async function saveProfile(db: SQLiteDatabase, p: ProfileInput): Promise<void> {
  await db.runAsync(
    `INSERT INTO profile (id, sex, age, height_cm, weight_kg, activity, goal, updated_at)
     VALUES (1, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       sex = excluded.sex, age = excluded.age, height_cm = excluded.height_cm,
       weight_kg = excluded.weight_kg, activity = excluded.activity, goal = excluded.goal,
       updated_at = excluded.updated_at`,
    [p.sex, p.age, p.heightCm, p.weightKg, p.activity, p.goal, nowIso()],
  );
}
