/**
 * The hidden operator gesture: a burst of taps on the event logo.
 *
 * The counting rule is a pure function so the "five taps within three
 * seconds" behaviour — including the part that matters, that a slow
 * curious visitor never trips it — can be tested without a DOM.
 */

export interface TapResult {
  /** Timestamps still inside the window, to carry into the next tap. */
  taps: number[]
  /** True when this tap completed the gesture. */
  triggered: boolean
}

export function registerTap(
  previous: readonly number[],
  now: number,
  windowMs: number,
  required: number,
): TapResult {
  // Anything older than the window is no longer part of this burst.
  const recent = [...previous, now].filter((time) => now - time <= windowMs)

  if (recent.length >= required) {
    // Cleared on success, so the next burst has to be made from scratch.
    return { taps: [], triggered: true }
  }

  return { taps: recent, triggered: false }
}
