/** Presentation helpers. Western numerals are kept inside RTL copy on purpose. */

/** Thousands-separated score, e.g. `8420` → `8,420`. */
export function formatScore(value: number): string {
  return value.toLocaleString('en-US')
}

/** Seconds as `m:ss`, e.g. `95` → `1:35`. */
export function formatDuration(totalSeconds: number): string {
  const safe = Math.max(0, Math.round(totalSeconds))
  const minutes = Math.floor(safe / 60)
  const seconds = safe % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}
