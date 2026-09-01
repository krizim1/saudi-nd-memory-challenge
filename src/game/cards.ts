/**
 * Deck construction.
 *
 * Card faces arrive from the theme as pure data, so this module never
 * touches a file path or an image — it only decides which faces appear,
 * how many times, and in what order.
 */

import { pickDistinct, shuffle, type RandomSource } from './shuffle'
import type { Card, CardFace, LevelConfig } from './types'

/**
 * Builds a shuffled deck for `level`: `pairs` faces chosen from `faces`,
 * each dealt twice.
 *
 * Instance ids are derived from the face id and the copy number, which
 * keeps them stable and readable in tests without a random component.
 */
export function buildDeck(
  level: LevelConfig,
  faces: readonly CardFace[],
  random: RandomSource = Math.random,
): Card[] {
  const chosen = pickDistinct(faces, level.pairs, random)

  const dealt: Card[] = []
  chosen.forEach((face, index) => {
    // Keyed by position in the deal, not by face: if the theme is short
    // of artwork the same face is dealt more than once, and those must
    // still be two separate pairs.
    const pairId = `${face.id}-${index}`

    for (let copy = 0; copy < 2; copy += 1) {
      dealt.push({
        instanceId: `${pairId}-${copy}`,
        pairId,
        face,
        state: 'hidden',
      })
    }
  })

  return shuffle(dealt, random)
}

/** True when the two cards are different halves of the same pair. */
export function isMatchingPair(first: Card, second: Card): boolean {
  return first.instanceId !== second.instanceId && first.pairId === second.pairId
}

export function findCard(cards: readonly Card[], instanceId: string): Card | undefined {
  return cards.find((card) => card.instanceId === instanceId)
}
