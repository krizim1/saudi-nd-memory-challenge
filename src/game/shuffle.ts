/**
 * Shuffling primitives.
 *
 * The randomness source is injectable so every test can pin a sequence
 * and assert on an exact board, while production uses `Math.random`.
 */

/** Returns a float in [0, 1). */
export type RandomSource = () => number

export const defaultRandom: RandomSource = Math.random

/**
 * Fisher–Yates, on a copy. Every permutation is equally likely, and the
 * input array is never touched — the caller's deck order is theirs.
 */
export function shuffle<T>(items: readonly T[], random: RandomSource = defaultRandom): T[] {
  const result = [...items]

  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1))
    const a = result[i]!
    const b = result[j]!
    result[i] = b
    result[j] = a
  }

  return result
}

/**
 * Picks `count` distinct items at random.
 *
 * When the pool is smaller than `count` it cycles through the pool again
 * rather than throwing: a theme short of card faces should degrade to
 * repeated artwork, not take the event offline.
 */
export function pickDistinct<T>(
  pool: readonly T[],
  count: number,
  random: RandomSource = defaultRandom,
): T[] {
  if (count <= 0 || pool.length === 0) return []

  const shuffled = shuffle(pool, random)
  if (count <= shuffled.length) return shuffled.slice(0, count)

  const picked: T[] = []
  for (let i = 0; i < count; i += 1) {
    picked.push(shuffled[i % shuffled.length]!)
  }
  return picked
}
