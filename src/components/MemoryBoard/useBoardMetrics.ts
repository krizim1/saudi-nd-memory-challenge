import { useLayoutEffect, useState, type RefObject } from 'react'

import { computeBoardMetrics, type BoardMetrics } from './boardMetrics'

/**
 * Tracks the container's size and returns the grid metrics that fit it.
 *
 * The arithmetic lives in `boardMetrics.ts`; this hook only supplies the
 * measurements, which is what keeps the sizing rules testable at real
 * screen dimensions.
 */
export function useBoardMetrics(
  containerRef: RefObject<HTMLElement | null>,
  rows: number,
  columns: number,
): BoardMetrics {
  const [metrics, setMetrics] = useState<BoardMetrics>(() =>
    computeBoardMetrics(0, 0, rows, columns),
  )

  useLayoutEffect(() => {
    const element = containerRef.current
    if (!element) return

    const measure = (width: number, height: number) => {
      setMetrics(computeBoardMetrics(width, height, rows, columns))
    }

    const observer = new ResizeObserver((entries) => {
      const box = entries[0]?.contentRect
      if (box) measure(box.width, box.height)
    })

    observer.observe(element)
    measure(element.clientWidth, element.clientHeight)

    return () => observer.disconnect()
  }, [containerRef, rows, columns])

  return metrics
}
