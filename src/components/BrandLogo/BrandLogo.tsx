import { useSettingsStore } from '../../store/settingsStore'
import { useTheme } from '../../theme/themeContext'
import { Emblem96 } from '../Emblem96'
import { useImageAsset } from '../ThemedBackground/useImageAsset'

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  /** Taps are forwarded so the operator gesture can be attached in Phase 6. */
  onPress?: () => void
  /**
   * Show the game title beside the emblem. The attract screen turns this
   * off because it sets the title in large type right beneath the mark.
   */
  showTitle?: boolean
}

const sizeClass = {
  sm: 'h-14 text-xl',
  md: 'h-20 text-3xl',
  lg: 'h-48 text-5xl',
} as const

/**
 * The event mark. A real logo file at `theme.logo` wins; until one is
 * supplied it renders the 96 emblem with the game title beside it, which
 * is a deliberate designed fallback rather than an empty box — the attract
 * screen must look finished on a machine with no assets deployed.
 */
export function BrandLogo({ size = 'md', className = '', onPress, showTitle = true }: BrandLogoProps) {
  const theme = useTheme()
  const status = useImageAsset(theme.logo)
  const gameTitle = useSettingsStore((state) => state.gameTitle)
  const eventTitle = useSettingsStore((state) => state.eventTitle)
  const label = `${gameTitle} — ${eventTitle}`

  if (status === 'ready') {
    return (
      <img
        src={theme.logo}
        alt={label}
        onClick={onPress}
        className={`${sizeClass[size]} w-auto object-contain ${className}`}
      />
    )
  }

  return (
    <div
      onClick={onPress}
      aria-label={label}
      className={`text-display flex items-center gap-4 ${sizeClass[size]} ${className}`}
    >
      <Emblem96 aria-hidden role="presentation" className="h-full w-auto shrink-0 drop-shadow-[0_2px_10px_rgba(216,178,94,0.35)]" />
      {showTitle && <span className="leading-none text-text-primary">{gameTitle}</span>}
    </div>
  )
}
