/**
 * Pure helpers for creating and comparing players.
 *
 * Scoring itself arrives in Phase 4; what lives here is the shape of a
 * fresh player and the tie-break rules, both of which the store and the
 * results screen need from Phase 1 onward.
 */

import type { MatchOutcome, Player } from './types'

let sequence = 0

/** A player with a cleared scoreboard. `name` is trimmed, never validated here. */
export function createPlayer(name: string): Player {
  sequence += 1
  return {
    id: `player-${sequence}-${Date.now().toString(36)}`,
    name: name.trim(),
    totalScore: 0,
    totalTime: 0,
    matches: 0,
    attempts: 0,
    bestStreak: 0,
    levelResults: [],
  }
}

/**
 * Highest score wins. A tie on score is broken by the faster total time,
 * then by the longer best streak; only a full tie reports a draw.
 */
export function compareOutcome(a: Player, b: Player): MatchOutcome {
  const scoreDifference = Math.abs(a.totalScore - b.totalScore)

  if (a.totalScore !== b.totalScore) {
    const aWins = a.totalScore > b.totalScore
    return {
      winner: aWins ? a : b,
      loser: aWins ? b : a,
      isDraw: false,
      scoreDifference,
    }
  }

  if (a.totalTime !== b.totalTime) {
    const aWins = a.totalTime < b.totalTime
    return { winner: aWins ? a : b, loser: aWins ? b : a, isDraw: false, scoreDifference: 0 }
  }

  if (a.bestStreak !== b.bestStreak) {
    const aWins = a.bestStreak > b.bestStreak
    return { winner: aWins ? a : b, loser: aWins ? b : a, isDraw: false, scoreDifference: 0 }
  }

  return { winner: null, loser: null, isDraw: true, scoreDifference: 0 }
}
