import type { SVGProps } from 'react'

/**
 * The 96th National Day mark: an eight-point Najdi star around a
 * medallion carrying the number.
 *
 * Drawn in code rather than shipped as an image so it stays crisp at any
 * size — the same component is the badge in the header, the crest on the
 * attract screen and the centrepiece of every card back. Colours come
 * from the theme's CSS variables, so it follows the active palette.
 *
 * This is the game's own mark, not the official National Day logo. To use
 * the official artwork, drop it at `theme.logo`; `BrandLogo` prefers it.
 */

const OUTER = 47
const INNER = 33
const POINTS = 8

/** Vertices of an eight-point star, alternating outer and inner radius. */
function starPoints(): string {
  const vertices: string[] = []
  for (let i = 0; i < POINTS * 2; i += 1) {
    const radius = i % 2 === 0 ? OUTER : INNER
    const angle = (Math.PI * i) / POINTS - Math.PI / 2
    vertices.push(`${(50 + radius * Math.cos(angle)).toFixed(2)},${(50 + radius * Math.sin(angle)).toFixed(2)}`)
  }
  return vertices.join(' ')
}

const star = starPoints()

export function Emblem96(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 100 100" role="img" aria-label="٩٦" {...props}>
      <defs>
        <radialGradient id="emblem96-core" cx="50%" cy="38%" r="70%">
          <stop offset="0%" stopColor="var(--color-primary-bright)" />
          <stop offset="100%" stopColor="var(--color-primary-deep)" />
        </radialGradient>
      </defs>

      <polygon
        points={star}
        fill="url(#emblem96-core)"
        stroke="var(--color-accent)"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <circle cx="50" cy="50" r="25" fill="none" stroke="var(--color-accent)" strokeWidth="1.4" opacity="0.85" />
      <circle cx="50" cy="50" r="22" fill="var(--color-primary-deep)" opacity="0.55" />

      <text
        x="50"
        y="50"
        textAnchor="middle"
        dominantBaseline="central"
        fill="var(--color-accent)"
        style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}
        fontSize="27"
      >
        ٩٦
      </text>
    </svg>
  )
}
