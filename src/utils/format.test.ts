import { describe, expect, it } from 'vitest'

import { formatDuration, formatScore } from './format'

describe('formatScore', () => {
  it('separates thousands', () => {
    expect(formatScore(8420)).toBe('8,420')
    expect(formatScore(0)).toBe('0')
  })
})

describe('formatDuration', () => {
  it('renders minutes and zero-padded seconds', () => {
    expect(formatDuration(95)).toBe('1:35')
    expect(formatDuration(9)).toBe('0:09')
    expect(formatDuration(600)).toBe('10:00')
  })

  it('clamps negatives to zero rather than rendering "-1:-1"', () => {
    expect(formatDuration(-5)).toBe('0:00')
  })
})
