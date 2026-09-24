/**
 * Minimal spaced-repetition intervals (days).
 * Wrong answers reset toward earlier intervals in Phase 4.
 */
export const SRS_INTERVALS_DAYS = [1, 3, 7, 14, 30, 60] as const;

export function nextReviewDate(
  correctStreak: number,
  from: Date = new Date(),
): Date {
  const index = Math.min(
    Math.max(correctStreak, 0),
    SRS_INTERVALS_DAYS.length - 1,
  );
  const days = SRS_INTERVALS_DAYS[index] ?? 1;
  const next = new Date(from);
  next.setDate(next.getDate() + days);
  return next;
}
