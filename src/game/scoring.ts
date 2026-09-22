/**
 * Scoring.
 *
 * A level's score is built from four things the player controls, then
 * weighted by how hard the level was:
 *
 *   Performance  matches      flat points per pair found
 *                streak       bonus for consecutive matches (capped)
 *                accuracy     share of attempts that were matches
 *   Speed        speed        how quickly each attempt was made
 *   Time         time         seconds left on a cleared level
 *                clear        flat bonus for finishing the board
 *   Level        multiplier   ×1 / ×1.5 / ×2 from the level config
 *
 *   total = round((matches + streak + accuracy + speed + time + clear) × multiplier)
 *
 * Accuracy and speed are both scaled by how much of the board was found,
 * so neither can be farmed: a careful player who found one pair, or a
 * frantic one flipping at random, earns only that share of the bonus.
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
  /** Pair-flips made, successful or not. */
  attempts: number
  /** Pairs on the board. */
  pairs: number
  /** Streak bonus accumulated during the level. */
  streakBonus: number
  timeRemaining: number
  /** Seconds the level allowed. */
  timeLimit: number
  cleared: boolean
  /** Difficulty weight of the level; defaults to 1. */
  multiplier?: number
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value))
}

/** Share of the board found, 0..1. */
function completion(matches: number, pairs: number): number {
  return pairs > 0 ? clamp01(matches / pairs) : 0
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

/**
 * Accuracy: matches ÷ attempts, weighted by how much of the board was
 * found. A perfect memory (every flip a match) on a cleared board earns
 * the full `accuracyBonusMax`.
 */
export function accuracyBonusFor(
  matches: number,
  attempts: number,
  pairs: number,
  scoring: ScoringConfig = config.scoring,
): number {
  if (attempts <= 0 || matches <= 0) return 0
  const accuracy = clamp01(matches / attempts)
  return Math.round(scoring.accuracyBonusMax * accuracy * completion(matches, pairs))
}

/**
 * Speed: the average seconds per attempt, placed between the configured
 * fast and slow paces. At or under `speedFastSeconds` a flip earns the
 * full bonus, at or over `speedSlowSeconds` none — then weighted by how
 * much of the board was found.
 *
 * This is distinct from the time bonus: that rewards finishing early,
 * this rewards a quick hand on every turn, and it still counts on a level
 * that ran out of time.
 */
export function speedBonusFor(
  timeUsed: number,
  attempts: number,
  matches: number,
  pairs: number,
  scoring: ScoringConfig = config.scoring,
): number {
  if (attempts <= 0 || matches <= 0) return 0
  const perAttempt = Math.max(0, timeUsed) / attempts
  const span = scoring.speedSlowSeconds - scoring.speedFastSeconds
  const pace = span > 0 ? clamp01((scoring.speedSlowSeconds - perAttempt) / span) : 0
  return Math.round(scoring.speedBonusMax * pace * completion(matches, pairs))
}

export function clearBonusFor(cleared: boolean, scoring: ScoringConfig = config.scoring): number {
  return cleared ? scoring.clearBonus : 0
}

/**
 * The score shown during play: matches and streak, weighted by the level.
 * Accuracy, speed and time are only settled when the level ends, so
 * showing them early would be a promise the clock might break.
 */
export function runningScore(
  matches: number,
  streakBonus: number,
  multiplier = 1,
  scoring: ScoringConfig = config.scoring,
): number {
  return Math.round((matchScoreFor(matches, scoring) + Math.max(0, streakBonus)) * multiplier)
}

export function scoreLevel(
  performance: LevelPerformance,
  scoring: ScoringConfig = config.scoring,
): ScoreBreakdown {
  const { matches, attempts, pairs, timeRemaining, timeLimit, cleared } = performance
  const multiplier = performance.multiplier ?? 1
  const timeUsed = Math.max(0, timeLimit - timeRemaining)

  const matchScore = matchScoreFor(matches, scoring)
  const streakBonus = Math.max(0, performance.streakBonus)
  const accuracyBonus = accuracyBonusFor(matches, attempts, pairs, scoring)
  const speedBonus = speedBonusFor(timeUsed, attempts, matches, pairs, scoring)
  const timeBonus = timeBonusFor(timeRemaining, cleared, scoring)
  const clearBonus = clearBonusFor(cleared, scoring)

  const subtotal = matchScore + streakBonus + accuracyBonus + speedBonus + timeBonus + clearBonus

  return {
    matchScore,
    streakBonus,
    accuracyBonus,
    speedBonus,
    timeBonus,
    clearBonus,
    subtotal,
    multiplier,
    total: Math.round(subtotal * multiplier),
  }
}
