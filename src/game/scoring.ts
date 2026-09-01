/**
 * Scoring.
 *
 * Pure arithmetic over plain numbers — deliberately *not* over an
 * `EngineState`, so the engine can call into this module without the two
 * depending on each other. Every weight comes from `config.scoring`, so
 * an operator can retune the whole economy without touching this file.
 */

import { config, type ScoringConfig } from '../app/config'
import type { ScoreBreakdown } from './types'

export type { ScoreBreakdown }

/** What a finished level yields, expressed without engine types. */
export interface LevelPerformance {
  matches: number
  /** Streak bonus accumulated during the level. */
  streakBonus: number
  timeRemaining: number
  cleared: boolean
}

/**
 * Bonus for the match that took the streak to `streak`.
 *
 * The first match of a run is worth no bonus — a streak needs at least
 * two — and the reward stops growing at `maxStreakMultiplier` so a lucky
 * board cannot run away with the leaderboard.
 */
export function streakBonusFor(streak: number, scoring: ScoringConfig = config.scoring): number {
  if (streak < 2) return 0

  const capped = Math.min(streak, scoring.maxStreakMultiplier)
  return (capped - 1) * scoring.streakBonusPerLevel
}

export function matchScoreFor(matches: number, scoring: ScoringConfig = config.scoring): number {
  return Math.max(0, matches) * scoring.matchPoints
}

/**
 * Seconds left are only worth points on a level the player actually
 * cleared; running out of time earns nothing rather than a rounding
 * artefact.
 */
export function timeBonusFor(
  timeRemaining: number,
  cleared: boolean,
  scoring: ScoringConfig = config.scoring,
): number {
  if (!cleared) return 0
  return Math.max(0, Math.floor(timeRemaining)) * scoring.timeBonusPerSecond
}

/** The score a level is worth in progress: no time bonus banked yet. */
export function runningScore(
  matches: number,
  streakBonus: number,
  scoring: ScoringConfig = config.scoring,
): number {
  return matchScoreFor(matches, scoring) + Math.max(0, streakBonus)
}

export function scoreLevel(
  performance: LevelPerformance,
  scoring: ScoringConfig = config.scoring,
): ScoreBreakdown {
  const matchScore = matchScoreFor(performance.matches, scoring)
  const streakBonus = Math.max(0, performance.streakBonus)
  const timeBonus = timeBonusFor(performance.timeRemaining, performance.cleared, scoring)

  return {
    matchScore,
    streakBonus,
    timeBonus,
    total: matchScore + streakBonus + timeBonus,
  }
}
