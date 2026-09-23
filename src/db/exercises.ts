import type { SQLiteDatabase } from 'expo-sqlite';

export interface Exercise {
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
  mediaUrl: string | null;
}

type Row = {
  id: string;
  name: string;
  force: string | null;
  level: string | null;
  mechanic: string | null;
  equipment: string;
  category: string | null;
  primary_muscles: string;
  secondary_muscles: string;
  instructions: string;
  images: string;
  media_url: string | null;
};

const IMAGE_BASE = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/';

export function imageUrl(path: string): string {
  return IMAGE_BASE + path;
}

function fromRow(r: Row): Exercise {
  return {
    id: r.id,
    name: r.name,
    force: r.force,
    level: r.level,
    mechanic: r.mechanic,
    equipment: r.equipment,
    category: r.category,
    primaryMuscles: JSON.parse(r.primary_muscles),
    secondaryMuscles: JSON.parse(r.secondary_muscles),
    instructions: JSON.parse(r.instructions),
    images: JSON.parse(r.images),
    mediaUrl: r.media_url,
  };
}

export const EQUIPMENT_ORDER = [
  'barbell',
  'dumbbell',
  'cable',
  'machine',
  'body only',
  'kettlebells',
  'bands',
  'e-z curl bar',
  'medicine ball',
  'exercise ball',
  'foam roll',
  'other',
];

export async function listEquipment(db: SQLiteDatabase): Promise<string[]> {
  const rows = await db.getAllAsync<{ equipment: string }>(
    'SELECT DISTINCT equipment FROM exercises',
  );
  const set = new Set(rows.map((r) => r.equipment));
  return EQUIPMENT_ORDER.filter((e) => set.has(e));
}

export async function searchExercises(
  db: SQLiteDatabase,
  opts: { query?: string; equipment?: string | null; limit?: number },
): Promise<Exercise[]> {
  const where: string[] = [];
  const params: (string | number)[] = [];
  if (opts.query?.trim()) {
    where.push('name LIKE ?');
    params.push(`%${opts.query.trim()}%`);
  }
  if (opts.equipment) {
    where.push('equipment = ?');
    params.push(opts.equipment);
  }
  const sql = `SELECT * FROM exercises ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
               ORDER BY name LIMIT ?`;
  params.push(opts.limit ?? 300);
  const rows = await db.getAllAsync<Row>(sql, params);
  return rows.map(fromRow);
}

export async function getExercise(db: SQLiteDatabase, id: string): Promise<Exercise | null> {
  const row = await db.getFirstAsync<Row>('SELECT * FROM exercises WHERE id = ?', [id]);
  return row ? fromRow(row) : null;
}
