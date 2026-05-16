import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format swim time from milliseconds.
 * Locale-independent — always M:SS.hh or SS.hh.
 *  29_870  -> "29.87"
 *  65_230  -> "1:05.23"
 *  944_900 -> "15:44.90"
 */
export function formatTime(ms: number | null | undefined): string {
  if (ms == null) return "—";
  const totalSec = ms / 1000;
  const minutes = Math.floor(totalSec / 60);
  const seconds = totalSec - minutes * 60;
  if (minutes === 0) {
    return seconds.toFixed(2);
  }
  return `${minutes}:${seconds.toFixed(2).padStart(5, "0")}`;
}

/** Difference in seconds, signed. Used for "+0.42s" / "-1.02s". */
export function formatDelta(ms: number): string {
  const s = ms / 1000;
  const sign = s > 0 ? "+" : "";
  return `${sign}${s.toFixed(2)}s`;
}
