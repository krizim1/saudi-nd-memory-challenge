/**
 * Core domain types for the memory game.
 *
 * These types describe game data only. They must never reference React,
 * DOM nodes, or any presentation concern — the engine (Phase 2) and the
 * UI both depend on this module, and nothing here depends on either.
 */

/**
 * How many people are playing.
 *
 * `solo` is one player against their own score; `duel` is the two-player
 * head-to-head. The level, engine and scoring rules are identical — only
 * the flow around them differs.
 */
export type GameMode = 'solo' | 'duel'

/** Explicit application phases. The router renders exactly one per phase. */
export type GamePhase =
  | 'attract'
  | 'mode-select'
  | 'registration'
  | 'challenge-intro'
  | 'player-ready'
  | 'countdown'
  | 'playing'
  | 'level-complete'
  | 'player-complete'
  | 'player-switch'
  | 'results'
  | 'winner'
  | 'leaderboard'

/** Which of the two competitors is currently at the screen. */
export type PlayerSlot = 0 | 1

/** Visual/interaction state of a single card on the board. */
export type CardState = 'hidden' | 'revealed' | 'matched' | 'disabled'

/**
 * A card face definition, supplied by the theme as pure data.
 * `image` may be missing or fail to load; renderers must fall back to
 * `symbol` / `alt` rather than break the board.
 */
export interface CardFace {
  /** Stable identity — two cards match when their `id` values are equal. */
  id: string
  /** Optional artwork path. Resolved through the theme, never hardcoded. */
  image?: string
  /** Accessible Arabic label, also used as the text fallback. */
  alt: string
  /** Inline SVG placeholder key used when `image` is absent or fails. */
  symbol?: string
  /** Optional accent colour for the card's frame and label strip. */
  color?: string
}

/** A single card instance on the board (each pair is dealt twice). */
export interface Card {
  /** Unique per board instance. */
  instanceId: string
  /**
   * Identity shared with this card's twin, and with nothing else.
   *
   * Deliberately not the face id: a theme with fewer faces than a level
   * has pairs deals the same artwork twice, and keying the match on the
   * face would let a card from one pair match a card from another.
   */
  pairId: string
  face: CardFace
  state: CardState
}

/** Level parameters. All values come from `app/config.ts`. */
export interface LevelConfig {
  id: number
  rows: number
  columns: number
  pairs: number
  /** Seconds allowed for the level. */
  timeLimit: number
}

/**
 * How a score was earned, kept alongside the total so the level-complete
 * screen can show the player where their points came from (section 7).
 */
export interface ScoreBreakdown {
  /** Flat points for the pairs found. */
  matchScore: number
  /** Accumulated bonus for consecutive matches. */
  streakBonus: number
  /** Awarded from the seconds left on a cleared level. */
  timeBonus: number
  total: number
}

/** Result of one player finishing one level. */
export interface LevelResult {
  levelId: number
  score: number
  timeUsed: number
  matches: number
  attempts: number
  bestStreak: number
  breakdown: ScoreBreakdown
}

/** A competitor and their accumulated performance. */
export interface Player {
  id: string
  name: string
  totalScore: number
  totalTime: number
  matches: number
  attempts: number
  bestStreak: number
  levelResults: LevelResult[]
}

/** A persisted leaderboard row. */
export interface LeaderboardEntry {
  id: string
  playerName: string
  score: number
  totalTime: number
  /** ISO 8601 timestamp. */
  date: string
}

/** Outcome of comparing both players once the challenge ends. */
export interface MatchOutcome {
  winner: Player | null
  loser: Player | null
  isDraw: boolean
  scoreDifference: number
}
