import { useEventTitle } from '../../client/clientContext'
import { useSettingsStore } from '../../store/settingsStore'
import { useTheme } from '../../theme/themeContext'
import { useImageAsset } from '../ThemedBackground/useImageAsset'

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  /** Taps are forwarded so the operator gesture can be attached in Phase 6. */
  onPress?: () => void
  /**
   * Show the game title when no logo file is supplied. The attract screen
   * turns this off because it sets the title in large type itself.
   */
  showTitle?: boolean
}

const sizeClass = {
  sm: 'h-14 text-xl',
  md: 'h-20 text-3xl',
  lg: 'h-44 text-5xl',
} as const

/**
 * The event mark. It shows the official logo file at `theme.logo` and
 * nothing else: no mark is invented here. Until that file is supplied it
 * falls back to the plain game title, so a screen never carries a look-alike
 * of an official identity.
 */
export function BrandLogo({ size = 'md', className = '', onPress, showTitle = true }: BrandLogoProps) {
  const theme = useTheme()
  const status = useImageAsset(theme.logo)
  const gameTitle = useSettingsStore((state) => state.gameTitle)
  const eventTitle = useEventTitle()
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

  if (!showTitle) return null

  return (
    <div
      onClick={onPress}
      aria-label={label}
      className={`text-display flex items-center ${sizeClass[size]} ${className}`}
    >
      <span className="leading-none text-text-primary">{gameTitle}</span>
    </div>
  )
}
