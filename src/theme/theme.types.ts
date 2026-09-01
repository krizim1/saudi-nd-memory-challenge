/**
 * Contract every theme must satisfy.
 *
 * A theme is pure content: colors, asset paths, card faces and sound
 * paths. Swapping in a new Saudi National Day key visual means writing a
 * new object of this shape — the engine, scoring and leaderboard never
 * read from it.
 */

import type { CardFace } from '../game/types'

/** Named background slots, one per screen family. */
export interface ThemeBackgrounds {
  attract: string
  registration: string
  gameplay: string
  winner: string
  leaderboard: string
}

/** Sound slots consumed by the AudioManager (wired up in Phase 5). */
export interface ThemeSounds {
  cardFlip: string
  matchSuccess: string
  matchWrong: string
  streak: string
  countdown: string
  levelComplete: string
  playerComplete: string
  winnerCelebration: string
}

/** Design tokens exposed to CSS as custom properties. */
export interface ThemePalette {
  /** Primary Saudi green. */
  primary: string
  primaryDeep: string
  primaryBright: string
  /** Warm sand/gold accent used sparingly for emphasis. */
  accent: string
  accentDeep: string
  /** Page and surface grounds. */
  background: string
  surface: string
  surfaceRaised: string
  /** Text roles. */
  textPrimary: string
  textSecondary: string
  textInverse: string
  /** Feedback. */
  success: string
  danger: string
}

export interface ThemeTypography {
  /** CSS font stack for headings and large numerals. */
  display: string
  /** CSS font stack for body copy and inputs. */
  body: string
}

export interface Theme {
  id: string
  name: string
  palette: ThemePalette
  typography: ThemeTypography
  logo: string
  /** Optional secondary marks (client, sponsors) rendered when present. */
  sponsorLogos: string[]
  backgrounds: ThemeBackgrounds
  /** Repeating cultural pattern layered behind content. */
  pattern: string
  /** Artwork shown on the back of every card. */
  cardBack: string
  /**
   * Card faces available to the deck builder. Must contain at least as
   * many entries as the largest level requires pairs.
   */
  cards: CardFace[]
  sounds: ThemeSounds
}
