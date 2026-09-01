// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { config } from '../app/config'
import type { EngineState } from '../game/engine'
import type { CardFace, LevelConfig } from '../game/types'
import { useLevelEngine } from './useLevelEngine'

const level: LevelConfig = { id: 1, rows: 2, columns: 2, pairs: 2, timeLimit: 30 }

const faces: CardFace[] = [
  { id: 'palm', alt: 'نخلة' },
  { id: 'falcon', alt: 'صقر' },
  { id: 'dates', alt: 'تمر' },
  { id: 'swords', alt: 'سيفان' },
]

function advance(ms: number) {
  act(() => {
    vi.advanceTimersByTime(ms)
  })
}

/**
 * Advances the clock the way a browser does: in small steps, so React
 * re-renders and effects re-run *between* ticks.
 *
 * A single large `advance` fires every timer inside one `act`, which lets
 * an effect that is being cancelled and re-armed on each render look as
 * though it fired. This is what a real 200 ms game clock does to it.
 */
function advanceRealistically(ms: number, stepMs = 50) {
  for (let elapsed = 0; elapsed < ms; elapsed += stepMs) {
    advance(stepMs)
  }
}

/** Instance ids of the two cards sharing the nth dealt face. */
function pairIds(state: EngineState, faceIndex: number): [string, string] {
  const pairId = [...new Set(state.cards.map((c) => c.pairId))][faceIndex]!
  const ids = state.cards.filter((c) => c.pairId === pairId).map((c) => c.instanceId)
  return [ids[0]!, ids[1]!]
}

function mismatchIds(state: EngineState): [string, string] {
  const hidden = state.cards.filter((c) => c.state === 'hidden')
  const first = hidden[0]!
  return [first.instanceId, hidden.find((c) => c.pairId !== first.pairId)!.instanceId]
}

describe('useLevelEngine', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('deals a full board and starts the clock at the level limit', () => {
    const { result } = renderHook(() => useLevelEngine(level, faces, () => {}))

    expect(result.current.state.cards).toHaveLength(level.pairs * 2)
    expect(result.current.state.timeRemaining).toBe(level.timeLimit)
  })

  it('counts real elapsed time down', () => {
    const { result } = renderHook(() => useLevelEngine(level, faces, () => {}))

    advance(5000)

    expect(result.current.state.timeRemaining).toBeCloseTo(25, 5)
  })

  it('flips a mismatched pair back after the reveal delay', () => {
    const { result } = renderHook(() => useLevelEngine(level, faces, () => {}))
    const [a, b] = mismatchIds(result.current.state)

    act(() => {
      result.current.flip(a)
      result.current.flip(b)
    })
    expect(result.current.state.locked).toBe(true)
    expect(result.current.state.cards.filter((c) => c.state === 'revealed')).toHaveLength(2)

    advance(config.timing.mismatchRevealMs)

    expect(result.current.state.cards.every((c) => c.state === 'hidden')).toBe(true)
    expect(result.current.state.locked).toBe(false)
  })

  it('flips a mismatched pair back while the game clock is running', () => {
    const { result } = renderHook(() => useLevelEngine(level, faces, () => {}))
    const [a, b] = mismatchIds(result.current.state)

    act(() => {
      result.current.flip(a)
      result.current.flip(b)
    })

    // The clock ticks throughout the reveal delay, exactly as it does in
    // a real level.
    advanceRealistically(config.timing.mismatchRevealMs + 200)

    expect(result.current.state.cards.every((c) => c.state === 'hidden')).toBe(true)
    expect(result.current.state.locked).toBe(false)
    expect(result.current.state.revealed).toEqual([])
  })

  it('settles a matched pair while the game clock is running', () => {
    const { result } = renderHook(() => useLevelEngine(level, faces, () => {}))
    const [a, b] = pairIds(result.current.state, 0)

    act(() => {
      result.current.flip(a)
      result.current.flip(b)
    })

    advanceRealistically(config.timing.inputLockMs + 200)

    expect(result.current.state.pending).toBeNull()
    expect(result.current.state.locked).toBe(false)
  })

  it('lets a player keep playing after a mismatch resolves under a live clock', () => {
    const { result } = renderHook(() => useLevelEngine(level, faces, () => {}))
    const [a, b] = mismatchIds(result.current.state)

    act(() => {
      result.current.flip(a)
      result.current.flip(b)
    })
    advanceRealistically(config.timing.mismatchRevealMs + 200)

    const [c, d] = pairIds(result.current.state, 0)
    act(() => {
      result.current.flip(c)
      result.current.flip(d)
    })

    expect(result.current.state.matches).toBe(1)
  })

  it('ignores taps while a pair is being judged', () => {
    const { result } = renderHook(() => useLevelEngine(level, faces, () => {}))
    const [a, b] = mismatchIds(result.current.state)
    const third = result.current.state.cards.find(
      (c) => c.instanceId !== a && c.instanceId !== b,
    )!

    act(() => {
      result.current.flip(a)
      result.current.flip(b)
      result.current.flip(third.instanceId)
    })

    expect(result.current.state.attempts).toBe(1)
    expect(
      result.current.state.cards.find((c) => c.instanceId === third.instanceId)!.state,
    ).toBe('hidden')
  })

  it('keeps a matched pair face-up and unlocks for the next turn', () => {
    const { result } = renderHook(() => useLevelEngine(level, faces, () => {}))
    const [a, b] = pairIds(result.current.state, 0)

    act(() => {
      result.current.flip(a)
      result.current.flip(b)
    })
    advance(config.timing.inputLockMs)

    expect(result.current.state.matches).toBe(1)
    expect(result.current.state.cards.filter((c) => c.state === 'matched')).toHaveLength(2)
    expect(result.current.state.locked).toBe(false)
  })

  it('reports the finished level once every pair is found', () => {
    const onFinish = vi.fn()
    const { result } = renderHook(() => useLevelEngine(level, faces, onFinish))

    const [a, b] = pairIds(result.current.state, 0)
    act(() => {
      result.current.flip(a)
      result.current.flip(b)
    })
    advance(config.timing.inputLockMs)

    const [c, d] = pairIds(result.current.state, 1)
    act(() => {
      result.current.flip(c)
      result.current.flip(d)
    })

    expect(onFinish).not.toHaveBeenCalled()
    advance(config.timing.levelEndDelayMs)

    expect(onFinish).toHaveBeenCalledOnce()
    expect(onFinish.mock.calls[0]![0].status).toBe('cleared')
    expect(onFinish.mock.calls[0]![0].matches).toBe(level.pairs)
  })

  it('stops the clock the moment the level is cleared', () => {
    const { result } = renderHook(() => useLevelEngine(level, faces, () => {}))

    const [a, b] = pairIds(result.current.state, 0)
    act(() => {
      result.current.flip(a)
      result.current.flip(b)
    })
    advance(config.timing.inputLockMs)

    const [c, d] = pairIds(result.current.state, 1)
    act(() => {
      result.current.flip(c)
      result.current.flip(d)
    })

    const atClear = result.current.state.timeRemaining
    advance(10_000)

    expect(result.current.state.timeRemaining).toBe(atClear)
  })

  it('reports a timeout when the clock runs out', () => {
    const onFinish = vi.fn()
    const { result } = renderHook(() => useLevelEngine(level, faces, onFinish))

    advance(level.timeLimit * 1000)

    expect(result.current.state.status).toBe('timeout')
    expect(result.current.state.locked).toBe(true)

    advance(config.timing.levelEndDelayMs)
    expect(onFinish).toHaveBeenCalledOnce()
    expect(onFinish.mock.calls[0]![0].status).toBe('timeout')
  })

  it('reports the finished level exactly once, however long the screen lingers', () => {
    const onFinish = vi.fn()
    renderHook(() => useLevelEngine(level, faces, onFinish))

    advance(level.timeLimit * 1000 + config.timing.levelEndDelayMs)
    advance(60_000)

    expect(onFinish).toHaveBeenCalledOnce()
  })

  it('tears every timer down on unmount', () => {
    const onFinish = vi.fn()
    const { unmount } = renderHook(() => useLevelEngine(level, faces, onFinish))

    unmount()
    advance(level.timeLimit * 1000 + config.timing.levelEndDelayMs + 10_000)

    expect(onFinish).not.toHaveBeenCalled()
    expect(vi.getTimerCount()).toBe(0)
  })
})
