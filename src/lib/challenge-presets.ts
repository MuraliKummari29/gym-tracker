/**
 * Challenge presets. "75 HARD" is a registered trademark of 44Seven Media,
 * so presets use their own names and only describe themselves as "inspired by".
 */
export type TaskKind = 'workout' | 'water' | 'read' | 'photo' | 'diet' | 'custom';
export type FailPolicy = 'restart' | 'continue';

export interface PresetTask {
  key: string;
  title: string;
  kind: TaskKind;
  targetValue?: number;
  targetUnit?: string;
  detail?: string;
}

export interface ChallengePreset {
  id: string;
  name: string;
  tagline: string;
  durationDays: number;
  failPolicy: FailPolicy;
  tasks: PresetTask[];
}

export const CHALLENGE_PRESETS: ChallengePreset[] = [
  {
    id: 'hard75',
    name: '75-Day Hard Mode',
    tagline: 'Inspired by the 75 Hard challenge. Miss a task, start over.',
    durationDays: 75,
    failPolicy: 'restart',
    tasks: [
      { key: 'diet', title: 'Follow the diet', kind: 'diet', detail: 'No cheat meals, no alcohol' },
      { key: 'workout1', title: 'Workout 1 · 45 min', kind: 'workout', targetValue: 45, targetUnit: 'min' },
      { key: 'workout2', title: 'Workout 2 · 45 min outdoors', kind: 'workout', targetValue: 45, targetUnit: 'min', detail: 'At least 3 h after workout 1' },
      { key: 'water', title: 'Drink 3.8 L water', kind: 'water', targetValue: 3800, targetUnit: 'ml' },
      { key: 'read', title: 'Read 10 pages non-fiction', kind: 'read', targetValue: 10, targetUnit: 'pages' },
      { key: 'photo', title: 'Progress photo', kind: 'photo' },
    ],
  },
  {
    id: 'soft75',
    name: '75-Day Soft Mode',
    tagline: 'Sustainable version. One workout a day, one rest day a week.',
    durationDays: 75,
    failPolicy: 'continue',
    tasks: [
      { key: 'diet', title: 'Eat well (alcohol only socially)', kind: 'diet' },
      { key: 'workout1', title: 'Workout · 45 min', kind: 'workout', targetValue: 45, targetUnit: 'min', detail: 'Active recovery one day a week' },
      { key: 'water', title: 'Drink 3 L water', kind: 'water', targetValue: 3000, targetUnit: 'ml' },
      { key: 'read', title: 'Read 10 pages', kind: 'read', targetValue: 10, targetUnit: 'pages' },
    ],
  },
  {
    id: 'medium75',
    name: '75-Day Medium Mode',
    tagline: 'Hard rules, but a missed day is logged instead of a restart.',
    durationDays: 75,
    failPolicy: 'continue',
    tasks: [
      { key: 'diet', title: 'Follow the diet 90% of the time', kind: 'diet' },
      { key: 'workout1', title: 'Workout · 45 min', kind: 'workout', targetValue: 45, targetUnit: 'min' },
      { key: 'water', title: 'Drink 3 L water', kind: 'water', targetValue: 3000, targetUnit: 'ml' },
      { key: 'read', title: 'Read 10 pages', kind: 'read', targetValue: 10, targetUnit: 'pages' },
      { key: 'growth', title: '10 min personal development', kind: 'custom', targetValue: 10, targetUnit: 'min' },
    ],
  },
];
