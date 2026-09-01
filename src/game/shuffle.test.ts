import { describe, expect, it } from 'vitest'

import { pickDistinct, shuffle, type RandomSource } from './shuffle'

/** Deterministic source that walks a fixed list of values, then repeats. */
function sequence(values: number[]): RandomSource {
  let index = 0
  return () => values[index++ % values.length]!
}

describe('shuffle', () => {
  const deck = ['a', 'b', 'c', 'd', 'e', 'f']

  it('never loses, duplicates, or invents an item', () => {
    const result = shuffle(deck, sequence([0.1, 0.9, 0.4, 0.7, 0.2]))

    expect(result).toHaveLength(deck.length)
    expect([...result].sort()).toEqual([...deck].sort())
  })

  it('leaves the input array untouched', () => {
    const original = [...deck]
    shuffle(deck, sequence([0.5]))
    expect(deck).toEqual(original)
  })

  it('is deterministic for a given random source', () => {
    const a = shuffle(deck, sequence([0.1, 0.9, 0.4, 0.7, 0.2]))
    const b = shuffle(deck, sequence([0.1, 0.9, 0.4, 0.7, 0.2]))
    expect(a).toEqual(b)
  })

  it('actually reorders rather than returning the input order', () => {
    const result = shuffle(deck, sequence([0.99, 0.01, 0.87, 0.33, 0.55]))
    expect(result).not.toEqual(deck)
  })

  it('handles empty and single-item arrays', () => {
    expect(shuffle([])).toEqual([])
    expect(shuffle(['only'])).toEqual(['only'])
  })

  it('survives a random source that returns exactly 0 or nearly 1', () => {
    expect([...shuffle(deck, () => 0)].sort()).toEqual([...deck].sort())
    expect([...shuffle(deck, () => 0.999999)].sort()).toEqual([...deck].sort())
  })
})

describe('pickDistinct', () => {
  const pool = ['a', 'b', 'c', 'd']

  it('returns the requested count with no repeats when the pool is big enough', () => {
    const picked = pickDistinct(pool, 3, sequence([0.3, 0.8, 0.1]))
    expect(picked).toHaveLength(3)
    expect(new Set(picked).size).toBe(3)
  })

  it('cycles the pool instead of failing when it is too small', () => {
    const picked = pickDistinct(['a', 'b'], 5, sequence([0.5]))
    expect(picked).toHaveLength(5)
    expect(new Set(picked)).toEqual(new Set(['a', 'b']))
  })

  it('returns nothing for a non-positive count or an empty pool', () => {
    expect(pickDistinct(pool, 0)).toEqual([])
    expect(pickDistinct(pool, -2)).toEqual([])
    expect(pickDistinct([], 4)).toEqual([])
  })
})
