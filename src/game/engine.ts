/**
 * The memory-game engine.
 *
 * Every function here is pure: it takes a state and returns a state, and
 * knows nothing about React, timers, or the DOM. The React layer decides
 * *when* to call `resolvePending` and `tick`; the engine decides what
 * those mean. That split is what makes the rules testable without
 * rendering anything, and it is why the interaction guards below can be
 * trusted — they are not racing an animation.
 *
 * Rejected actions return the *same object reference*, so a stray tap
 * cannot even trigger a re-render.
 */

import { buildDeck, findCard, isMatchingPair } from './cards'
import { runningScore, scoreLevel, streakBonusFor, type ScoreBreakdown } from './scoring'
import type { RandomSource } from './shuffle'
import type { Card, CardFace, LevelConfig, LevelResult } from './types'

export type LevelStatus = 'running' | 'cleared' | 'timeout'

/**
 * Anything under this counts as zero. Summing fractional deltas leaves a
 * float remainder like 1.8e-14, and `Math.ceil` would render that as a
 * full second — so the clock would read "1" after it had actually run
 * out.
 */
const RESIDUAL_SECONDS = 1e-6

/** What the last completed pair turned out to be, pending its reveal delay. */
export type PendingOutcome = 'match' | 'mismatch'

export interface EngineState {
  level: LevelConfig
  cards: Card[]
  /** Instance ids currently face-up and awaiting resolution. */
  revealed: string[]
  pending: PendingOutcome | null
  /** True while input must be ignored. */
  locked: boolean
  matches: number
  attempts: number
  streak: number
  bestStreak: number
  /**
   * Streak bonus banked so far. Accumulated as matches land because the
   * sequence of streaks cannot be recovered from the final state — only
   * the best one survives there.
   */
  streakBonus: number
  /** Seconds left, fractional between ticks. */
  timeRemaining: number
  status: LevelStatus
}

export function createEngineState(
  level: LevelConfig,
  faces: readonly CardFace[],
  random?: RandomSource,
): EngineState {
  return {
    level,
    cards: buildDeck(level, faces, random),
    revealed: [],
    pending: null,
    locked: false,
    matches: 0,
    attempts: 0,
    streak: 0,
    bestStreak: 0,
    streakBonus: 0,
    timeRemaining: level.timeLimit,
    status: 'running',
  }
}

/** Whether a tap on `instanceId` would do anything at all. */
export function canFlip(state: EngineState, instanceId: string): boolean {
  if (state.status !== 'running') return false
  if (state.locked || state.pending !== null) return false
  if (state.revealed.length >= 2) return false

  const card = findCard(state.cards, instanceId)
  // A revealed or matched card fails this check, which is what stops the
  // same card being counted twice.
  return card?.state === 'hidden'
}

function withCardState(cards: Card[], ids: readonly string[], state: Card['state']): Card[] {
  return cards.map((card) => (ids.includes(card.instanceId) ? { ...card, state } : card))
}

/**
 * Turns a card face-up.
 *
 * The second card of a pair is judged immediately — score and streak
 * move the moment the player can see the answer — while the visual
 * outcome waits for `resolvePending`. The board is locked in between.
 */
export function flipCard(state: EngineState, instanceId: string): EngineState {
  if (!canFlip(state, instanceId)) return state

  const cards = withCardState(state.cards, [instanceId], 'revealed')
  const revealed = [...state.revealed, instanceId]

  if (revealed.length < 2) {
    return { ...state, cards, revealed }
  }

  const [firstId, secondId] = revealed as [string, string]
  const first = findCard(cards, firstId)!
  const second = findCard(cards, secondId)!
  const matched = isMatchingPair(first, second)
  const attempts = state.attempts + 1

  if (!matched) {
    return {
      ...state,
      cards,
      revealed,
      attempts,
      streak: 0,
      pending: 'mismatch',
      locked: true,
    }
  }

  const matches = state.matches + 1
  const streak = state.streak + 1
  const cleared = matches === state.level.pairs

  return {
    ...state,
    cards: withCardState(cards, revealed, 'matched'),
    revealed,
    attempts,
    matches,
    streak,
    bestStreak: Math.max(state.bestStreak, streak),
    streakBonus: state.streakBonus + streakBonusFor(streak),
    pending: 'match',
    locked: true,
    // Stopping the clock here rather than after the reveal delay means
    // the final pair's animation never eats into the time bonus.
    status: cleared ? 'cleared' : state.status,
  }
}

/**
 * Applies the pending outcome: a mismatch flips back, a match stays.
 * Input unlocks again unless the level has already ended.
 */
export function resolvePending(state: EngineState): EngineState {
  if (state.pending === null) return state

  const cards =
    state.pending === 'mismatch'
      ? withCardState(state.cards, state.revealed, 'hidden')
      : state.cards

  return {
    ...state,
    cards,
    revealed: [],
    pending: null,
    locked: state.status !== 'running',
  }
}

/**
 * Advances the clock by `deltaSeconds`.
 *
 * A level that has already ended ignores ticks, so a timer that fires
 * once more between the last match and its own teardown cannot turn a
 * cleared level into a timeout.
 */
export function tick(state: EngineState, deltaSeconds: number): EngineState {
  if (state.status !== 'running' || deltaSeconds <= 0) return state

  const timeRemaining = Math.max(0, state.timeRemaining - deltaSeconds)
  if (timeRemaining > RESIDUAL_SECONDS) {
    return { ...state, timeRemaining }
  }

  return { ...state, timeRemaining: 0, status: 'timeout', locked: true }
}

/** Seconds elapsed, never negative and never beyond the level's limit. */
export function timeUsed(state: EngineState): number {
  return Math.min(state.level.timeLimit, Math.max(0, state.level.timeLimit - state.timeRemaining))
}

export function isFinished(state: EngineState): boolean {
  return state.status !== 'running'
}

/**
 * The score so far, excluding the time bonus — that is only banked by
 * clearing the level, so showing it during play would be a promise the
 * clock might break.
 */
export function currentScore(state: EngineState): number {
  return runningScore(state.matches, state.streakBonus)
}

/** Full breakdown for a level, valid at any point but meant for the end. */
export function scoreBreakdown(state: EngineState): ScoreBreakdown {
  return scoreLevel({
    matches: state.matches,
    streakBonus: state.streakBonus,
    timeRemaining: state.timeRemaining,
    cleared: state.status === 'cleared',
  })
}

/** Packages a finished level for the store. */
export function toLevelResult(state: EngineState): LevelResult {
  const breakdown = scoreBreakdown(state)

  return {
    levelId: state.level.id,
    score: breakdown.total,
    timeUsed: Math.round(timeUsed(state)),
    matches: state.matches,
    attempts: state.attempts,
    bestStreak: state.bestStreak,
    breakdown,
  }
}
