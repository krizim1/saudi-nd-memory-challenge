import { useEffect } from 'react'

/**
 * Runs `action` once, `delayMs` after mount, when `enabled`.
 *
 * Every unattended screen transition goes through this hook so there is
 * exactly one place where a timeout is registered and cleared — the
 * pattern that stops an event kiosk accumulating stray timers over a
 * long day.
 */
export function useAutoAdvance(action: () => void, delayMs: number, enabled = true): void {
  useEffect(() => {
    if (!enabled) return

    const timer = window.setTimeout(action, delayMs)
    return () => window.clearTimeout(timer)
  }, [action, delayMs, enabled])
}
