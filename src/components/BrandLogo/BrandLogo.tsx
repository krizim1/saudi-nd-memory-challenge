import { useSettingsStore } from '../../store/settingsStore'
import { useTheme } from '../../theme/themeContext'
import { useImageAsset } from '../ThemedBackground/useImageAsset'

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  /** Taps are forwarded so the operator gesture can be attached in Phase 6. */
  onPress?: () => void
}

const sizeClass = {
  sm: 'h-14 text-xl',
  md: 'h-20 text-3xl',
  lg: 'h-28 text-5xl',
} as const

/**
 * The event mark. Until a real logo file exists it renders a typographic
 * lockup built from the configured branding, which is a deliberate
 * fallback rather than an empty box — the attract screen must look
 * finished even on a machine with no assets deployed.
 */
export function BrandLogo({ size = 'md', className = '', onPress }: BrandLogoProps) {
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
      className={`text-display flex items-center gap-3 ${sizeClass[size]} ${className}`}
    >
      <span
        aria-hidden
        className="inline-block h-[0.9em] w-[0.9em] rounded-md border-2 border-accent"
        style={{ borderStyle: 'solid', transform: 'rotate(45deg)' }}
      />
      <span className="leading-none text-text-primary">{gameTitle}</span>
    </div>
  )
}
