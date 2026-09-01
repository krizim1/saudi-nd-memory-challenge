import { useEffect, useState } from 'react'

export type AssetStatus = 'loading' | 'ready' | 'missing'

interface Probe {
  src: string | undefined
  status: AssetStatus
}

function initialProbe(src: string | undefined): Probe {
  return { src, status: src ? 'loading' : 'missing' }
}

/**
 * Probes a theme image and reports whether it can actually be shown.
 *
 * Phase 1 ships with no real artwork on disk, and during an event an
 * asset may simply be missing. Callers use the returned status to fall
 * back to a gradient or an SVG placeholder, which is what keeps a broken
 * path from becoming a broken screen.
 */
export function useImageAsset(src: string | undefined): AssetStatus {
  const [probe, setProbe] = useState<Probe>(() => initialProbe(src))

  // A changed src resets to "loading" during render rather than in an
  // effect, so a stale status is never painted for a frame first.
  if (probe.src !== src) {
    setProbe(initialProbe(src))
  }

  useEffect(() => {
    if (!src) return

    let cancelled = false
    const image = new Image()

    image.onload = () => {
      if (!cancelled) setProbe({ src, status: 'ready' })
    }
    image.onerror = () => {
      if (!cancelled) setProbe({ src, status: 'missing' })
    }
    image.src = src

    return () => {
      cancelled = true
      image.onload = null
      image.onerror = null
    }
  }, [src])

  return probe.src === src ? probe.status : src ? 'loading' : 'missing'
}
