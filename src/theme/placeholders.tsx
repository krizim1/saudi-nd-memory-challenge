/**
 * The card icon set.
 *
 * These are the cards' actual faces until commissioned artwork arrives —
 * a theme entry with no `image` renders its `symbol` from here.
 *
 * Every symbol draws inside a 100×100 viewBox using `currentColor`, so
 * the card controls size and tint. They are flat and architectural
 * rather than illustrative — closer to signage than to clip art.
 *
 * The design constraint that matters is not beauty but *distinctness*:
 * in a memory game a player has to tell two revealed cards apart in a
 * fraction of a second, so each icon is built on a different dominant
 * form — vertical, crossed, arched, round, stepped — rather than on fine
 * detail that disappears at card size.
 */

import type { ReactElement } from 'react'

const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 5,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const

const symbols: Record<string, ReactElement> = {
  // Fanning fronds over a single trunk.
  palm: (
    <g {...stroke}>
      <path d="M50 90V48" />
      <path d="M50 48C36 36 24 34 14 40" />
      <path d="M50 48C64 36 76 34 86 40" />
      <path d="M50 48C42 30 34 22 24 18" />
      <path d="M50 48C58 30 66 22 76 18" />
      <circle cx="50" cy="46" r="3.5" fill="currentColor" stroke="none" />
    </g>
  ),

  // Two blades crossing, with hilts.
  swords: (
    <g {...stroke}>
      <path d="M20 82L74 20" />
      <path d="M80 82L26 20" />
      <path d="M66 14l12 12M34 14L22 26" />
      <path d="M26 86h18M56 86h18" />
    </g>
  ),

  // A walled silhouette with stepped parapets.
  diriyah: (
    <g {...stroke}>
      <path d="M14 86V46l36-24 36 24v40" />
      <path d="M14 46h72" />
      <path d="M40 86V62h20v24" />
      <path d="M20 38l7-9 7 9M66 38l7-9 7 9" />
    </g>
  ),

  // A tall arched door, panelled.
  door: (
    <g {...stroke}>
      <path d="M26 88V38a24 24 0 0148 0v50z" />
      <path d="M50 22v66" />
      <path d="M32 48h36M32 66h36" />
    </g>
  ),

  // Wings spread wide, head above.
  falcon: (
    <g {...stroke}>
      <path d="M12 42c18-8 30 0 38 14" />
      <path d="M88 42c-18-8-30 0-38 14" />
      <path d="M50 56v18" />
      <path d="M42 88l8-14 8 14z" />
      <circle cx="50" cy="30" r="9" />
    </g>
  ),

  // Two overlapping crests under a low sun.
  dunes: (
    <g {...stroke}>
      <path d="M8 78c16-24 30-24 44 0" />
      <path d="M42 78c14-16 28-16 50 0" />
      <circle cx="68" cy="30" r="11" />
    </g>
  ),

  // The dallah: tapered body, long spout, domed lid.
  coffee: (
    <g {...stroke}>
      <path d="M34 86h32l7-38H27z" />
      <path d="M27 48l11-16h24l11 16" />
      <path d="M50 32V18l11 7" />
      <path d="M73 56c9 3 9 15 0 18" />
    </g>
  ),

  // A cluster of three fruits on stems.
  dates: (
    <g {...stroke}>
      <ellipse cx="34" cy="58" rx="11" ry="17" />
      <ellipse cx="62" cy="66" rx="11" ry="17" />
      <path d="M34 41V22M62 49V28" />
      <path d="M22 20h24M50 26h24" />
    </g>
  ),

  // A single vertical shaft, banded.
  tower: (
    <g {...stroke}>
      <path d="M34 88V38l16-24 16 24v50" />
      <path d="M34 56h32M34 72h32" />
      <path d="M50 14V4" />
    </g>
  ),

  // Five points, drawn in one line.
  star: (
    <g {...stroke}>
      <path d="M50 10l12 26 28 3-21 20 6 28-25-14-25 14 6-28-21-20 28-3z" />
    </g>
  ),

  // A dome flanked by a minaret.
  mosque: (
    <g {...stroke}>
      <path d="M18 88V56c0-16 14-26 30-26s30 10 30 26v32" />
      <path d="M48 30V16" />
      <path d="M40 88V70a10 10 0 0120 0v18" />
      <path d="M14 88h72" />
      <path d="M86 88V38" />
    </g>
  ),

  // A rounded bowl with an angled neck.
  oud: (
    <g {...stroke}>
      <ellipse cx="40" cy="64" rx="26" ry="24" />
      <circle cx="40" cy="60" r="8" />
      <path d="M60 46l26-26" />
      <path d="M80 14l10 10" />
    </g>
  ),
}

/** Neutral mark used when a card face names no symbol we know. */
const fallbackSymbol: ReactElement = (
  <g {...stroke}>
    <rect x="26" y="26" width="48" height="48" rx="8" />
    <path d="M38 50h24" />
  </g>
)

/** Looks up an icon by key; never throws on an unknown key. */
export function getPlaceholderSymbol(key: string | undefined): ReactElement {
  if (!key) return fallbackSymbol
  return symbols[key] ?? fallbackSymbol
}

export const placeholderSymbolKeys = Object.keys(symbols)
