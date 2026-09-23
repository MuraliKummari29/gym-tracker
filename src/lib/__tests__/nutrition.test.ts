import { ACTIVITY_MULTIPLIER, computeTargets, mifflinStJeor } from '../nutrition';

describe('mifflinStJeor', () => {
  it('matches the published equation for men', () => {
    // 10*80 + 6.25*180 - 5*30 + 5 = 800 + 1125 - 150 + 5
    expect(mifflinStJeor('male', 80, 180, 30)).toBe(1780);
  });

  it('matches the published equation for women', () => {
    // 10*60 + 6.25*165 - 5*28 - 161
    expect(mifflinStJeor('female', 60, 165, 28)).toBeCloseTo(1330.25, 2);
  });
});

describe('computeTargets', () => {
  const base = { sex: 'male' as const, age: 30, heightCm: 180, weightKg: 80, activity: 'moderate' as const };

  it('applies the activity multiplier to get maintenance calories', () => {
    const t = computeTargets({ ...base, goal: 'maintain' });
    expect(t.tdee).toBe(Math.round(1780 * ACTIVITY_MULTIPLIER.moderate));
    expect(t.calories).toBe(t.tdee);
  });

  it('cuts 20% for fat loss and adds 10% for a lean bulk', () => {
    const cut = computeTargets({ ...base, goal: 'cut' });
    const bulk = computeTargets({ ...base, goal: 'lean_bulk' });
    const tdee = computeTargets({ ...base, goal: 'maintain' }).tdee;
    expect(cut.calories).toBe(Math.round(tdee * 0.8));
    expect(bulk.calories).toBe(Math.round(tdee * 1.1));
  });

  it('uses a higher protein target when cutting', () => {
    expect(computeTargets({ ...base, goal: 'cut' }).proteinG).toBe(Math.round(2.2 * 80));
    expect(computeTargets({ ...base, goal: 'maintain' }).proteinG).toBe(Math.round(1.8 * 80));
  });

  it('macros add back up to the calorie target within rounding', () => {
    const t = computeTargets({ ...base, goal: 'maintain' });
    const kcal = t.proteinG * 4 + t.carbsG * 4 + t.fatG * 9;
    expect(Math.abs(kcal - t.calories)).toBeLessThanOrEqual(12);
  });

  it('never goes below the safety floor', () => {
    const t = computeTargets({ sex: 'female', age: 60, heightCm: 150, weightKg: 45, activity: 'sedentary', goal: 'cut' });
    expect(t.calories).toBeGreaterThanOrEqual(1200);
  });

  it('enforces the fat floor of 0.6 g per kg', () => {
    const t = computeTargets({ ...base, goal: 'cut', fatFraction: 0.05 });
    expect(t.fatG).toBe(Math.round(0.6 * 80));
  });
});
