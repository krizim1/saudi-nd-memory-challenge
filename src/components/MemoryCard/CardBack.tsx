import { useTheme } from '../../theme/themeContext'
import { useImageAsset } from '../ThemedBackground/useImageAsset'

const W = 300
const H = 400
const CELL = 20

/** Checkerboard of the logo's inner field: two teals, alternating. */
const checker = (() => {
  const cells: string[] = []
  for (let y = 0; y < H; y += CELL) {
    for (let x = (y / CELL) % 2 === 0 ? 0 : CELL; x < W; x += CELL * 2) {
      cells.push(`M${x} ${y}h${CELL}v${CELL}h-${CELL}z`)
    }
  }
  return cells.join('')
})()

/** The logo frame's notched edge: small squares stepping along each side. */
const notches = (() => {
  const marks: string[] = []
  for (let x = 20; x < W - 20; x += 16) marks.push(`M${x} 14h6v6h-6z`, `M${x} ${H - 20}h6v6h-6z`)
  for (let y = 20; y < H - 20; y += 16) marks.push(`M14 ${y}h6v6h-6z`, `M${W - 20} ${y}h6v6h-6z`)
  return marks.join('')
})()

/** A stepped diamond of green squares — the logo's corner motif, centred. */
const diamond = (() => {
  const marks: string[] = []
  const size = 4
  for (let row = -size; row <= size; row += 1) {
    const span = size - Math.abs(row)
    for (let col = -span; col <= span; col += 2) {
      marks.push(`M${150 + col * CELL - CELL / 2} ${200 + row * CELL - CELL / 2}h${CELL}v${CELL}h-${CELL}z`)
    }
  }
  return marks.join('')
})()

/**
 * The reverse of every card, filling its parent.
 *
 * Built from the «عزّنا بطبعنا» logo's own vocabulary — the dark teal
 * checker field, the green notched frame, and its stepped green squares —
 * so the board reads as part of the identity without reusing the logo
 * itself on every card. A `cardBack` image in the theme overrides it.
 */
export function CardBack() {
  const theme = useTheme()
  const status = useImageAsset(theme.cardBack)

  return (
    <div className="absolute inset-0 overflow-hidden rounded-2xl bg-background">
      {status === 'ready' ? (
        <img src={theme.cardBack} alt="" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <svg
          aria-hidden
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="xMidYMid slice"
          className="absolute inset-0 h-full w-full"
        >
          <rect width={W} height={H} fill="var(--color-background)" />
          <path d={checker} fill="var(--color-primary-deep)" />
          <path d={diamond} fill="var(--color-primary)" />
          <rect x="4" y="4" width={W - 8} height={H - 8} rx="14" fill="none" stroke="var(--color-primary)" strokeWidth="8" />
          <path d={notches} fill="var(--color-primary)" />
        </svg>
      )}
    </div>
  )
}
