import { describe, expect, it } from 'vitest'

import { registerTap } from './adminGesture'

const WINDOW = 3000
const REQUIRED = 5

/** Replays a series of tap timestamps through the counter. */
function tapAt(times: number[]) {
  let taps: number[] = []
  let triggered = false

  for (const time of times) {
    const result = registerTap(taps, time, WINDOW, REQUIRED)
    taps = result.taps
    triggered = result.triggered
  }

  return { taps, triggered }
}

describe('registerTap', () => {
  it('opens on the fifth tap inside the window', () => {
    expect(tapAt([0, 200, 400, 600, 800]).triggered).toBe(true)
  })

  it('does not open on four taps', () => {
    const result = tapAt([0, 200, 400, 600])

    expect(result.triggered).toBe(false)
    expect(result.taps).toHaveLength(4)
  })

  it('ignores taps that have aged out of the window', () => {
    // Four early taps, then a fifth long after: not a burst.
    expect(tapAt([0, 100, 200, 300, 9000]).triggered).toBe(false)
  })

  it('lets a visitor prod the logo all day without opening the panel', () => {
    const slowTaps = Array.from({ length: 40 }, (_, i) => i * 2000)
    expect(tapAt(slowTaps).triggered).toBe(false)
  })

  it('opens on a burst that follows a long idle period', () => {
    expect(tapAt([0, 5000, 20_000, 20_100, 20_200, 20_300, 20_400]).triggered).toBe(true)
  })

  it('clears the count on success, so the next burst starts fresh', () => {
    const opened = registerTap([0, 100, 200, 300], 400, WINDOW, REQUIRED)

    expect(opened.triggered).toBe(true)
    expect(opened.taps).toEqual([])
  })

  it('counts a tap right on the window boundary as inside it', () => {
    expect(tapAt([0, 100, 200, 300, WINDOW]).triggered).toBe(true)
  })
})
