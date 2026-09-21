import { Emblem96 } from '../Emblem96'
import { useTheme } from '../../theme/themeContext'
import { useImageAsset } from '../ThemedBackground/useImageAsset'

/** Small Najdi triangles marching along one edge. */
function triangleBand(y: number, pointing: 'down' | 'up'): string {
  const height = pointing === 'down' ? 11 : -11
  const segments: string[] = []
  for (let x = 34; x < 266; x += 14) {
    segments.push(`M${x} ${y}l7 ${height}l7 ${-height}z`)
  }
  return segments.join('')
}

const topBand = triangleBand(34, 'down')
const bottomBand = triangleBand(366, 'up')

/**
 * The reverse of every card, filling its parent.
 *
 * Drawn in code: a deep-green ground under a tone-on-tone Najdi lattice,
 * a double gold frame with a triangle border, and the 96 emblem at the
 * centre. If a theme supplies `cardBack` artwork that file wins instead.
 */
export function CardBack() {
  const theme = useTheme()
  const status = useImageAsset(theme.cardBack)

  return (
    <div className="absolute inset-0 overflow-hidden rounded-2xl border border-accent/40">
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background: `radial-gradient(90% 70% at 50% 40%, ${theme.palette.primaryBright} 0%, ${theme.palette.primary} 42%, ${theme.palette.primaryDeep} 100%)`,
        }}
      />

      {status === 'ready' ? (
        <img src={theme.cardBack} alt="" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <svg
          aria-hidden
          viewBox="0 0 300 400"
          preserveAspectRatio="xMidYMid slice"
          className="absolute inset-0 h-full w-full"
        >
          <defs>
            <pattern id="card-back-lattice" width="30" height="30" patternUnits="userSpaceOnUse">
              <path
                d="M15 2l13 13-13 13L2 15z"
                fill="none"
                stroke="var(--color-accent)"
                strokeWidth="0.8"
                opacity="0.16"
              />
            </pattern>
          </defs>

          <rect width="300" height="400" fill="url(#card-back-lattice)" />

          <rect
            x="12"
            y="12"
            width="276"
            height="376"
            rx="18"
            fill="none"
            stroke="var(--color-accent)"
            strokeWidth="3"
          />
          <rect
            x="22"
            y="22"
            width="256"
            height="356"
            rx="12"
            fill="none"
            stroke="var(--color-accent)"
            strokeWidth="1"
            opacity="0.55"
          />

          <path d={topBand} fill="var(--color-accent)" opacity="0.7" />
          <path d={bottomBand} fill="var(--color-accent)" opacity="0.7" />

          <Emblem96 x="62" y="112" width="176" height="176" />
        </svg>
      )}
    </div>
  )
}
