/**
 * The legal phase graph.
 *
 * Keeping transitions as data (rather than as `if` chains inside the
 * store) means an illegal move is caught in one place and reported once,
 * and the whole flow can be read at a glance during an event rehearsal.
 */

import type { GamePhase } from '../game/types'

export const phaseTransitions: Record<GamePhase, readonly GamePhase[]> = {
  attract: ['mode-select'],
  'mode-select': ['registration', 'attract'],
  registration: ['challenge-intro', 'mode-select', 'attract'],
  'challenge-intro': ['player-ready', 'attract'],
  'player-ready': ['countdown', 'attract'],
  countdown: ['playing', 'attract'],
  playing: ['level-complete', 'attract'],
  'level-complete': ['countdown', 'player-complete', 'attract'],
  'player-complete': ['player-switch', 'results', 'attract'],
  'player-switch': ['player-ready', 'attract'],
  // Solo skips the winner screen: there is nobody to beat, so the result
  // itself is the payoff and the standings come next.
  results: ['winner', 'leaderboard', 'attract'],
  winner: ['leaderboard', 'attract'],
  leaderboard: ['attract'],
}

export function canTransition(from: GamePhase, to: GamePhase): boolean {
  return phaseTransitions[from].includes(to)
}


/**
 * Phases where an unattended screen should return itself to the attract
 * loop. Everything else is mid-game: a player who steps away briefly must
 * not lose their turn to a timer.
 */
export const idleResetPhases: ReadonlySet<GamePhase> = new Set<GamePhase>([
  'results',
  'winner',
  'leaderboard',
])
