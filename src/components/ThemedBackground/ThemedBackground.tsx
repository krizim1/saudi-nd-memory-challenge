import type { ReactNode } from 'react'

import { useTheme } from '../../theme/themeContext'
import type { ThemeBackgrounds } from '../../theme/theme.types'
import { useImageAsset } from './useImageAsset'

interface ThemedBackgroundProps {
  /** Which background slot this screen occupies. */
  slot: keyof ThemeBackgrounds
  children: ReactNode
  /** Dims the artwork so foreground copy keeps its contrast. */
  scrim?: 'none' | 'soft' | 'strong'
}

const scrimClass: Record<NonNullable<ThemedBackgroundProps['scrim']>, string> = {
  none: '',
  soft: 'bg-black/35',
  strong: 'bg-black/60',
}

/**
 * Full-bleed screen ground: a depth gradient, the cultural pattern, and
 * the themed photograph once it loads. The gradient is not a fallback
 * that swaps in — it is always painted underneath, so a missing or
 * slow-loading image degrades to a designed surface instead of a flash
 * of black.
 */
export function ThemedBackground({ slot, children, scrim = 'soft' }: ThemedBackgroundProps) {
  const theme = useTheme()
  const src = theme.backgrounds[slot]
  const status = useImageAsset(src)

  return (
    <div className="relative h-full w-full overflow-hidden bg-background">
      {/* Layer 1 — architectural depth gradient, always present. */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background: `radial-gradient(120% 80% at 50% 0%, ${theme.palette.primary} 0%, ${theme.palette.primaryDeep} 55%, ${theme.palette.background} 100%)`,
        }}
      />

      {/* Layer 2 — cultural pattern, faint enough to read as texture. */}
      <div aria-hidden className="pattern-overlay absolute inset-0 opacity-[0.07]" />

      {/* Layer 3 — themed artwork, only once it is known to load. */}
      {status === 'ready' && (
        <div
          aria-hidden
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url("${src}")` }}
        />
      )}

      {scrim !== 'none' && <div aria-hidden className={`absolute inset-0 ${scrimClass[scrim]}`} />}

      <div className="relative h-full w-full">{children}</div>
    </div>
  )
}
