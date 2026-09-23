import { CHALLENGE_PRESETS } from '../challenge-presets';

describe('CHALLENGE_PRESETS', () => {
  it('has unique preset ids and unique task keys within each preset', () => {
    const ids = CHALLENGE_PRESETS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const p of CHALLENGE_PRESETS) {
      const keys = p.tasks.map((t) => t.key);
      expect(new Set(keys).size).toBe(keys.length);
    }
  });

  it('hard mode has the six classic daily tasks and a restart rule', () => {
    const hard = CHALLENGE_PRESETS.find((p) => p.id === 'hard75');
    expect(hard).toBeDefined();
    expect(hard!.durationDays).toBe(75);
    expect(hard!.failPolicy).toBe('restart');
    expect(hard!.tasks.map((t) => t.kind).sort()).toEqual(
      ['diet', 'photo', 'read', 'water', 'workout', 'workout'],
    );
  });

  it('does not use the trademarked name in preset titles', () => {
    for (const p of CHALLENGE_PRESETS) {
      expect(p.name.toLowerCase()).not.toContain('75 hard');
    }
  });
});
