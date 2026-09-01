import { useTheme } from '../../theme/themeContext'
import { useImageAsset } from '../ThemedBackground/useImageAsset'

/**
 * The reverse of every card, filling its parent.
 *
 * Falls back to a drawn Najdi-inspired motif when `theme.cardBack` is not
 * on disk, so the board is presentable before any artwork is delivered.
 */
export function CardBack() {
  const theme = useTheme()
  const status = useImageAsset(theme.cardBack)

  return (
    <div className="absolute inset-0 overflow-hidden rounded-2xl border border-white/12">
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background: `linear-gradient(150deg, ${theme.palette.primaryBright} 0%, ${theme.palette.primary} 45%, ${theme.palette.primaryDeep} 100%)`,
        }}
      />

      {status === 'ready' ? (
        <img src={theme.cardBack} alt="" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <svg
          aria-hidden
          viewBox="0 0 100 100"
          preserveAspectRatio="xMidYMid slice"
          className="absolute inset-0 h-full w-full text-accent opacity-60"
        >
          <g fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round">
            <path d="M50 18l18 18-18 18-18-18z" />
            <path d="M50 46l18 18-18 18-18-18z" />
            <path d="M22 46h12M66 46h12" />
          </g>
        </svg>
      )}
    </div>
  )
}
