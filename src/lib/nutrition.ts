/**
 * Deterministic diet targets. Numbers are computed here, never by an LLM.
 * BMR: Mifflin-St Jeor (1990). Protein guidance: ISSN position stand (2017).
 */
export type Sex = 'male' | 'female';
export type Activity = 'sedentary' | 'light' | 'moderate' | 'very' | 'extra';
export type Goal = 'cut' | 'maintain' | 'lean_bulk';

export interface ProfileInput {
  sex: Sex;
  age: number;
  heightCm: number;
  weightKg: number;
  activity: Activity;
  goal: Goal;
  /** grams of protein per kg bodyweight; default 1.8 */
  proteinPerKg?: number;
  /** fraction of calories from fat; default 0.28 */
  fatFraction?: number;
}

export interface Targets {
  bmr: number;
  tdee: number;
  calories: number;
  proteinG: number;
  fatG: number;
  carbsG: number;
  waterMl: number;
}

export const ACTIVITY_MULTIPLIER: Record<Activity, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  very: 1.725,
  extra: 1.9,
};

export const ACTIVITY_LABEL: Record<Activity, string> = {
  sedentary: 'Sedentary (desk job, no training)',
  light: 'Light (1–3 sessions / week)',
  moderate: 'Moderate (3–5 sessions / week)',
  very: 'Very active (6–7 sessions / week)',
  extra: 'Extra (2× a day or physical job)',
};

export const GOAL_LABEL: Record<Goal, string> = {
  cut: 'Fat loss (−20%)',
  maintain: 'Maintain',
  lean_bulk: 'Lean bulk (+10%)',
};

const GOAL_FACTOR: Record<Goal, number> = { cut: 0.8, maintain: 1, lean_bulk: 1.1 };

export function mifflinStJeor(sex: Sex, weightKg: number, heightCm: number, age: number): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return sex === 'male' ? base + 5 : base - 161;
}

export function computeTargets(p: ProfileInput): Targets {
  const bmr = mifflinStJeor(p.sex, p.weightKg, p.heightCm, p.age);
  const tdee = bmr * ACTIVITY_MULTIPLIER[p.activity];
  const floor = p.sex === 'male' ? 1500 : 1200; // safety floor without clinician input
  const calories = Math.max(floor, Math.round(tdee * GOAL_FACTOR[p.goal]));

  const proteinPerKg = p.proteinPerKg ?? (p.goal === 'cut' ? 2.2 : 1.8);
  const proteinG = Math.round(proteinPerKg * p.weightKg);
  const fatFraction = p.fatFraction ?? 0.28;
  const minFatG = Math.round(0.6 * p.weightKg); // fat floor
  const fatG = Math.max(minFatG, Math.round((calories * fatFraction) / 9));
  const carbsG = Math.max(0, Math.round((calories - proteinG * 4 - fatG * 9) / 4));
  const waterMl = Math.round(35 * p.weightKg);

  return { bmr: Math.round(bmr), tdee: Math.round(tdee), calories, proteinG, fatG, carbsG, waterMl };
}
