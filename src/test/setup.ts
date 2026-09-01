/**
 * Test environment shims.
 *
 * Two things jsdom cannot provide on its own:
 *
 * 1. `ResizeObserver` and real layout. The board hook measures its
 *    container, so without a stub every element reports a zero box.
 *
 * 2. A running animation frame loop. Framer Motion captures
 *    `requestAnimationFrame` when it is imported — before fake timers are
 *    installed — so its animations never advance under `vi.useFakeTimers`
 *    and every element would sit at its `initial` values. Skipping
 *    animations lands them on their target state immediately.
 */

import { MotionGlobalConfig } from 'framer-motion'

MotionGlobalConfig.skipAnimations = true

if (typeof globalThis.ResizeObserver === 'undefined') {
  class StubResizeObserver implements ResizeObserver {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  }

  globalThis.ResizeObserver = StubResizeObserver
}
