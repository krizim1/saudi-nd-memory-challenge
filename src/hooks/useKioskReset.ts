import { useCallback, useEffect, useRef } from 'react'

import { useGameStore } from '../store/gameStore'
import { idleResetPhases } from '../store/phaseMachine'
import { useSettingsStore } from '../store/settingsStore'

/** Interactions that count as someone still being at the screen. */
const ACTIVITY_EVENTS = ['pointerdown', 'keydown', 'touchstart'] as const

/**
 * Returns an idle end screen to the attract loop.
 *
 * Only the end-of-game screens are armed — a mid-game timeout would take
 * a level away from a player who paused to think. The countdown restarts
 * on any touch, so a group still reading their result keeps the screen,
 * and it is suspended entirely while the operator panel is open.
 *
 * The reset clears players and flow state; leaderboard records are held
 * in their own store and are untouched by it.
 */
export function useKioskReset(): void {
  const phase = useGameStore((state) => state.phase)
  const adminOpen = useGameStore((state) => state.adminOpen)
  const resetGame = useGameStore((state) => state.resetGame)
  const autoResetMs = useSettingsStore((state) => state.autoResetMs)

  const timerRef = useRef<number | null>(null)
  const armed = idleResetPhases.has(phase) && !adminOpen

  const clear = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!armed) {
      clear()
      return
    }

    const restart = () => {
      clear()
      timerRef.current = window.setTimeout(resetGame, autoResetMs)
    }

    restart()
    for (const event of ACTIVITY_EVENTS) {
      window.addEventListener(event, restart, { passive: true })
    }

    return () => {
      clear()
      for (const event of ACTIVITY_EVENTS) {
        window.removeEventListener(event, restart)
      }
    }
  }, [armed, autoResetMs, resetGame, clear])
}
