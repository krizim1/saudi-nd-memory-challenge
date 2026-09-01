import { describe, expect, it } from 'vitest'

import { buildDeck, findCard, isMatchingPair } from './cards'
import { levels } from './levels'
import type { CardFace, LevelConfig } from './types'

const faces: CardFace[] = Array.from({ length: 12 }, (_, i) => ({
  id: `face-${i}`,
  alt: `وجه ${i}`,
}))

const level: LevelConfig = { id: 1, rows: 3, columns: 4, pairs: 6, timeLimit: 45 }

describe('buildDeck', () => {
  it('deals exactly two cards per pair', () => {
    const deck = buildDeck(level, faces, () => 0.5)
    expect(deck).toHaveLength(level.pairs * 2)
  })

  it('gives every face in the deck exactly one twin', () => {
    const deck = buildDeck(level, faces, () => 0.5)

    const counts = new Map<string, number>()
    for (const card of deck) {
      counts.set(card.pairId, (counts.get(card.pairId) ?? 0) + 1)
    }

    expect(counts.size).toBe(level.pairs)
    for (const count of counts.values()) {
      expect(count).toBe(2)
    }
  })

  it('gives every card a unique instance id', () => {
    const deck = buildDeck(level, faces, () => 0.5)
    expect(new Set(deck.map((c) => c.instanceId)).size).toBe(deck.length)
  })

  it('starts every card hidden', () => {
    const deck = buildDeck(level, faces, () => 0.5)
    expect(deck.every((card) => card.state === 'hidden')).toBe(true)
  })

  it('fills every configured level exactly, with no empty slot', () => {
    for (const configured of levels) {
      const deck = buildDeck(configured, faces, () => 0.5)
      expect(deck).toHaveLength(configured.rows * configured.columns)
    }
  })

  it('still fills the board when the theme has too few faces', () => {
    const deck = buildDeck(level, faces.slice(0, 3), () => 0.5)

    expect(deck).toHaveLength(level.pairs * 2)
    expect(new Set(deck.map((c) => c.instanceId)).size).toBe(deck.length)
  })

  it('keeps pairs separate when a short theme repeats a face', () => {
    // Three faces for six pairs: some artwork is dealt more than once.
    const deck = buildDeck(level, faces.slice(0, 3), () => 0.5)

    const counts = new Map<string, number>()
    for (const card of deck) {
      counts.set(card.pairId, (counts.get(card.pairId) ?? 0) + 1)
    }

    // Repeated artwork must still be exactly `pairs` two-card pairs.
    expect(counts.size).toBe(level.pairs)
    for (const count of counts.values()) {
      expect(count).toBe(2)
    }
  })

  it('refuses to match two cards that merely share repeated artwork', () => {
    const deck = buildDeck(level, faces.slice(0, 3), () => 0.5)

    const first = deck[0]!
    const lookalike = deck.find(
      (card) => card.face.id === first.face.id && card.pairId !== first.pairId,
    )

    // The short theme guarantees a duplicate face exists to test against.
    expect(lookalike).toBeDefined()
    expect(isMatchingPair(first, lookalike!)).toBe(false)
  })

  it('varies the layout between rounds', () => {
    let seed = 0
    const drifting = () => ((seed += 0.137) % 1)

    const first = buildDeck(level, faces, drifting).map((c) => c.instanceId)
    const second = buildDeck(level, faces, drifting).map((c) => c.instanceId)

    expect(first).not.toEqual(second)
  })
})

describe('isMatchingPair', () => {
  const deck = buildDeck(level, faces, () => 0.5)

  it('matches the two halves of a pair', () => {
    const [first] = deck
    const twin = deck.find((c) => c.pairId === first!.pairId && c !== first)
    expect(isMatchingPair(first!, twin!)).toBe(true)
  })

  it('refuses to match a card with itself', () => {
    expect(isMatchingPair(deck[0]!, deck[0]!)).toBe(false)
  })

  it('rejects cards from different pairs', () => {
    const [first] = deck
    const other = deck.find((c) => c.pairId !== first!.pairId)
    expect(isMatchingPair(first!, other!)).toBe(false)
  })
})

describe('findCard', () => {
  it('returns undefined for an unknown id rather than throwing', () => {
    expect(findCard(buildDeck(level, faces, () => 0.5), 'nope')).toBeUndefined()
  })
})
