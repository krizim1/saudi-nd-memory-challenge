import { useCallback, useEffect, useReducer, useRef } from 'react'

import { config } from '../app/config'
import { useAudio } from '../audio/audioContext'
import {
  createEngineState,
  flipCard,
  isFinished,
  resolvePending,
  tick,
  type EngineState,
  type PendingOutcome,
} from '../game/engine'
import type { CardFace, LevelConfig } from '../game/types'

type Action =
  | { type: 'flip'; instanceId: string }
  | { type: 'resolve' }
  | { type: 'tick'; delta: number }

function reducer(state: EngineState, action: Action): EngineState {
  switch (action.type) {
    case 'flip':
      return flipCard(state, action.instanceId)
    case 'resolve':
      return resolvePending(state)
    case 'tick':
      return tick(state, action.delta)
  }
}

/** How long the finished pair stays as it is before the board reacts. */
function revealDelayMs(pending: PendingOutcome): number {
  return pending === 'mismatch' ? config.timing.mismatchRevealMs : config.timing.inputLockMs
}

/** Interval between clock samples. Fine enough for a smooth bar, coarse
 *  enough not to re-render the board on every frame. */
const TICK_INTERVAL_MS = 200

export interface LevelEngine {
  state: EngineState
  flip: (instanceId: string) => void
}

/**
 * Drives the pure engine from React.
 *
 * This hook owns all the *timing* — the clock, the reveal delay, the
 * end-of-level beat — and nothing else. Each concern gets exactly one
 * effect with its own teardown, which is what guarantees a level can
 * never end up with two clocks running against each other, however
 * abruptly a player abandons the screen.
 */
export function useLevelEngine(
  level: LevelConfig,
  faces: readonly CardFace[],
  onFinish: (state: EngineState) => void,
): LevelEngine {
  const [state, dispatch] = useReducer(reducer, { level, faces }, ({ level: l, faces: f }) =>
    createEngineState(l, f),
  )

  // Held in a ref so a caller that re-creates its callback each render
  // does not restart the end-of-level timer.
  const onFinishRef = useRef(onFinish)
  useEffect(() => {
    onFinishRef.current = onFinish
  }, [onFinish])

  const { play } = useAudio()
  const finished = isFinished(state)

  // Sound is derived from state transitions here rather than fired from
  // the card component, so a flip triggered by any route — a tap, a
  // future replay, an operator tool — sounds the same.
  const previous = useRef(state)
  useEffect(() => {
    const before = previous.current
    previous.current = state
    if (before === state) return

    if (state.revealed.length > before.revealed.length) {
      play('cardFlip')
    }

    if (before.pending === null && state.pending === 'match') {
      play(state.streak >= 2 ? 'streak' : 'matchSuccess')
    }

    if (before.pending === null && state.pending === 'mismatch') {
      play('matchWrong')
    }

    if (before.status === 'running' && state.status === 'cleared') {
      play('levelComplete')
    }
  }, [state, play])

  // The clock. Elapsed time is measured, not counted, so a throttled
  // background tab or a slow frame cannot hand a player free seconds.
  useEffect(() => {
    if (finished) return

    let last = performance.now()
    const interval = window.setInterval(() => {
      const now = performance.now()
      const delta = (now - last) / 1000
      last = now
      dispatch({ type: 'tick', delta })
    }, TICK_INTERVAL_MS)

    return () => window.clearInterval(interval)
  }, [finished])

  // The reveal delay for whichever pair was just judged.
  //
  // This depends on `pending` alone, never on the whole state. The clock
  // hands back a new state object every tick, so depending on `state`
  // would tear this timer down and re-arm it five times a second — and a
  // 900 ms delay that restarts every 200 ms never fires. The board would
  // stay locked with two cards face up for the rest of the level.
  const pending = state.pending
  useEffect(() => {
    if (pending === null) return

    const timer = window.setTimeout(() => dispatch({ type: 'resolve' }), revealDelayMs(pending))
    return () => window.clearTimeout(timer)
  }, [pending])

  // The beat between the level ending and the screen changing.
  useEffect(() => {
    if (!finished) return

    const timer = window.setTimeout(
      () => onFinishRef.current(state),
      config.timing.levelEndDelayMs,
    )
    return () => window.clearTimeout(timer)
    // `state` is intentionally read once, when the level finishes; it no
    // longer changes in any way that matters afterwards.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished])

  const flip = useCallback((instanceId: string) => {
    dispatch({ type: 'flip', instanceId })
  }, [])

  return { state, flip }
}
