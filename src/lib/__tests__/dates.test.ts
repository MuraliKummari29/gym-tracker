import { addDays, daysBetween, todayKey } from '../dates';

describe('todayKey', () => {
  it('formats a local date as YYYY-MM-DD with zero padding', () => {
    expect(todayKey(new Date(2026, 0, 5, 23, 30))).toBe('2026-01-05');
  });
});

describe('addDays', () => {
  it('crosses month and year boundaries', () => {
    expect(addDays('2026-01-30', 3)).toBe('2026-02-02');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });
});

describe('daysBetween', () => {
  it('is zero on the same day and counts whole days otherwise', () => {
    expect(daysBetween('2026-09-23', '2026-09-23')).toBe(0);
    expect(daysBetween('2026-09-23', '2026-09-24')).toBe(1);
    expect(daysBetween('2026-01-01', '2026-03-17')).toBe(75);
  });

  it('is symmetric with addDays across a DST change', () => {
    const start = '2026-03-01';
    expect(daysBetween(start, addDays(start, 74))).toBe(74);
  });
});
