import { useCallback, useRef } from 'react'

import { config } from '../app/config'
import { useGameStore } from '../store/gameStore'
import { registerTap } from './adminGesture'

/**
 * Returns the tap handler that opens the operator panel.
 *
 * Attach it to the event logo; taps are counted in a ref so a partial
 * burst never re-renders anything, and so a visitor prodding the logo
 * sees no hint that the gesture exists.
 */
export function useAdminGesture(): () => void {
  const setAdminOpen = useGameStore((state) => state.setAdminOpen)
  const taps = useRef<number[]>([])

  return useCallback(() => {
    const result = registerTap(
      taps.current,
      Date.now(),
      config.kiosk.adminTapWindowMs,
      config.kiosk.adminTapCount,
    )

    taps.current = result.taps
    if (result.triggered) setAdminOpen(true)
  }, [setAdminOpen])
}
