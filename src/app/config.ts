/**
 * Single source of truth for every tunable game value.
 *
 * Nothing in `screens/`, `components/` or `game/` may hardcode a level
 * size, a duration, or a score weight — it reads from here so the event
 * operator (and the admin panel in Phase 6) can retune without a rebuild.
 */

import type { LevelConfig } from '../game/types'

export interface ScoringConfig {
  /** Awarded for each correct pair. */
  matchPoints: number
  /** Added per consecutive match beyond the first, multiplied by streak depth. */
  streakBonusPerLevel: number
  /** Streak length at which bonuses stop growing, to bound the ceiling. */
  maxStreakMultiplier: number
  /** Points per remaining second when a level is cleared. */
  timeBonusPerSecond: number
  /** Kept at 0 for v1 — the brief asks not to punish wrong taps. */
  incorrectPenalty: number
}

export interface TimingConfig {
  /** How long a non-matching pair stays face-up before flipping back (ms). */
  mismatchRevealMs: number
  /** Input lock after the second card flips, covering the flip animation (ms). */
  inputLockMs: number
  /** Card flip animation duration (ms). Kept in sync with CSS/Framer values. */
  flipDurationMs: number
  /** Beat between the last match (or timeout) and the level-complete screen (ms). */
  levelEndDelayMs: number
  /** Seconds left at which the timer switches to its warning treatment. */
  timerWarningSeconds: number
  /** Steps rendered by the pre-level countdown, in order. */
  countdownSteps: number
  /** Time each countdown step is held on screen (ms). */
  countdownStepMs: number
  /** Auto-advance delay on the level-complete screen (ms). */
  levelCompleteAutoAdvanceMs: number
  /** When false, the level-complete screen waits for a large continue button. */
  levelCompleteAutoAdvance: boolean
}

export interface KioskConfig {
  /** Idle time on the winner/leaderboard screens before returning to attract (ms). */
  autoResetMs: number
  /** Number of logo taps that opens the admin panel. */
  adminTapCount: number
  /** Taps must all land inside this window to count (ms). */
  adminTapWindowMs: number
}

export interface BrandingConfig {
  gameTitle: string
  eventTitle: string
  /** Optional short line under the title on the attract screen. */
  tagline: string
}

export interface PlayerInputConfig {
  minNameLength: number
  maxNameLength: number
}

export interface AudioConfig {
  soundEnabled: boolean
  /** 0..1 */
  masterVolume: number
}

export interface AppConfig {
  branding: BrandingConfig
  levels: LevelConfig[]
  scoring: ScoringConfig
  timing: TimingConfig
  kiosk: KioskConfig
  player: PlayerInputConfig
  audio: AudioConfig
  leaderboard: {
    /** Rows shown on the leaderboard screen. */
    displayLimit: number
    /** Rows retained in storage. */
    storageLimit: number
  }
}

export const config: AppConfig = {
  branding: {
    gameTitle: 'تحدي الذاكرة',
    eventTitle: 'اليوم الوطني السعودي',
    tagline: 'اختبر ذاكرتك وتنافس مع صديقك',
  },

  levels: [
    { id: 1, rows: 3, columns: 4, pairs: 6, timeLimit: 45 },
    { id: 2, rows: 4, columns: 4, pairs: 8, timeLimit: 60 },
    { id: 3, rows: 4, columns: 5, pairs: 10, timeLimit: 75 },
  ],

  scoring: {
    matchPoints: 100,
    streakBonusPerLevel: 25,
    maxStreakMultiplier: 5,
    timeBonusPerSecond: 10,
    incorrectPenalty: 0,
  },

  timing: {
    mismatchRevealMs: 900,
    inputLockMs: 400,
    flipDurationMs: 350,
    levelEndDelayMs: 1200,
    timerWarningSeconds: 10,
    countdownSteps: 3,
    countdownStepMs: 1000,
    levelCompleteAutoAdvanceMs: 3500,
    levelCompleteAutoAdvance: true,
  },

  kiosk: {
    autoResetMs: 30_000,
    adminTapCount: 5,
    adminTapWindowMs: 3000,
  },

  player: {
    minNameLength: 2,
    maxNameLength: 20,
  },

  audio: {
    soundEnabled: true,
    masterVolume: 0.7,
  },

  leaderboard: {
    displayLimit: 10,
    storageLimit: 100,
  },
}
