/**
 * Swim time helpers (mirrors frontend lib/utils.ts).
 * Times are integer milliseconds throughout the system (PDR §11.1).
 */

export function formatTime(ms: number | null | undefined): string {
  if (ms == null) return "—";
  const totalSec = ms / 1000;
  const minutes = Math.floor(totalSec / 60);
  const seconds = totalSec - minutes * 60;
  if (minutes === 0) return seconds.toFixed(2);
  return `${minutes}:${seconds.toFixed(2).padStart(5, "0")}`;
}

/**
 * Compute age category for an athlete given DOB and season start year.
 * Per ΚΟΕΚ rule: age = competition year minus birth year, calculated at Dec 31.
 *
 * Returns the birth year so callers can map to a category in DB.
 */
export function birthYear(dob: string | Date): number {
  return new Date(dob).getUTCFullYear();
}
