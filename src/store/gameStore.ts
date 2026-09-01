/**
 * Application state machine.
 *
 * The store owns *flow*: which phase is on screen, who is playing, which
 * level they are on. It deliberately owns no board state — card layout,
 * flipping and the timer arrive in Phase 2 behind a separate engine, so
 * that this file stays readable as the event script it represents.
 */

import { create } from 'zustand'

import { config } from '../app/config'
import { compareOutcome, createPlayer } from '../game/players'
import { isLastLevel, levelCount } from '../game/levels'
import type {
  GameMode,
  GamePhase,
  LevelResult,
  MatchOutcome,
  Player,
  PlayerSlot,
} from '../game/types'
import { canTransition } from './phaseMachine'

interface GameState {
  phase: GamePhase
  mode: GameMode
  players: Player[]
  activeSlot: PlayerSlot
  /** Zero-based position in the level sequence for the active player. */
  currentLevelIndex: number
  /**
   * Set once a duel finishes and both players can be compared. Always
   * null in solo, where there is nothing to compare against.
   */
  outcome: MatchOutcome | null
  /** True while the operator panel is open, so the kiosk timer pauses. */
  adminOpen: boolean
}

interface GameActions {
  /** Guarded transition. Refuses (and warns) on a move the graph forbids. */
  goTo: (phase: GamePhase) => void

  chooseMode: () => void
  /** Picks the mode and moves on to name entry. */
  setMode: (mode: GameMode) => void
  /** Seats one player in solo, two in a duel. Extra names are ignored. */
  registerPlayers: (...names: string[]) => void
  beginChallenge: () => void
  beginCountdown: () => void
  beginLevel: () => void
  /** Records the finished level for the active player and advances the flow. */
  completeLevel: (result: LevelResult) => void
  /** Moves past the level-complete screen: next level, or player done. */
  continueAfterLevel: () => void
  advanceAfterPlayer: () => void
  showResults: () => void
  showWinner: () => void
  showLeaderboard: () => void
  /** Clears players and flow state and returns to attract. */
  resetGame: () => void
  setAdminOpen: (open: boolean) => void
  /** Operator shortcut: drop straight into a level for a smoke test. */
  jumpToLevel: (levelIndex: number) => void
}

export type GameStore = GameState & GameActions

const initialState: GameState = {
  phase: 'attract',
  mode: 'duel',
  players: [],
  activeSlot: 0,
  currentLevelIndex: 0,
  outcome: null,
  adminOpen: false,
}

/** Folds a level result into the player's running totals. */
function applyLevelResult(player: Player, result: LevelResult): Player {
  return {
    ...player,
    totalScore: player.totalScore + result.score,
    totalTime: player.totalTime + result.timeUsed,
    matches: player.matches + result.matches,
    attempts: player.attempts + result.attempts,
    bestStreak: Math.max(player.bestStreak, result.bestStreak),
    levelResults: [...player.levelResults, result],
  }
}

export const useGameStore = create<GameStore>()((set, get) => ({
  ...initialState,

  goTo: (phase) => {
    const current = get().phase
    if (current === phase) return

    if (!canTransition(current, phase)) {
      console.warn(`[gameStore] Ignored illegal transition ${current} → ${phase}`)
      return
    }
    set({ phase })
  },

  chooseMode: () => get().goTo('mode-select'),

  setMode: (mode) => {
    set({ mode })
    get().goTo('registration')
  },

  registerPlayers: (...names) => {
    const seats = get().mode === 'solo' ? 1 : 2

    set({
      players: names.slice(0, seats).map(createPlayer),
      activeSlot: 0,
      currentLevelIndex: 0,
      outcome: null,
    })
    get().goTo('challenge-intro')
  },

  beginChallenge: () => get().goTo('player-ready'),

  beginCountdown: () => get().goTo('countdown'),

  beginLevel: () => get().goTo('playing'),

  completeLevel: (result) => {
    const { players, activeSlot } = get()
    const player = players[activeSlot]

    if (player) {
      const updated = [...players]
      updated[activeSlot] = applyLevelResult(player, result)
      set({ players: updated })
    }

    get().goTo('level-complete')
  },

  continueAfterLevel: () => {
    const { currentLevelIndex } = get()

    if (isLastLevel(currentLevelIndex)) {
      get().goTo('player-complete')
      return
    }

    set({ currentLevelIndex: currentLevelIndex + 1 })
    get().goTo('countdown')
  },

  advanceAfterPlayer: () => {
    const { activeSlot, mode } = get()

    // Solo has no second turn; a duel hands over once, after player one.
    if (mode === 'duel' && activeSlot === 0) {
      set({ activeSlot: 1, currentLevelIndex: 0 })
      get().goTo('player-switch')
      return
    }

    get().showResults()
  },

  showResults: () => {
    const { players, mode } = get()
    const [one, two] = players

    set({ outcome: mode === 'duel' && one && two ? compareOutcome(one, two) : null })
    get().goTo('results')
  },

  showWinner: () => get().goTo('winner'),

  showLeaderboard: () => get().goTo('leaderboard'),

  resetGame: () => set({ ...initialState }),

  setAdminOpen: (adminOpen) => set({ adminOpen }),

  jumpToLevel: (levelIndex) => {
    const index = Math.min(Math.max(levelIndex, 0), levelCount - 1)
    const players = get().players.length
      ? get().players
      : [createPlayer('تجربة ١'), createPlayer('تجربة ٢')]

    set({
      players,
      activeSlot: 0,
      currentLevelIndex: index,
      outcome: null,
      phase: 'countdown',
      adminOpen: false,
    })
  },
}))

/* ---------- selectors ---------- */

export const selectActivePlayer = (state: GameStore): Player | undefined =>
  state.players[state.activeSlot]

export const selectIsSolo = (state: GameStore): boolean => state.mode === 'solo'

export const selectCurrentLevel = (state: GameStore) => config.levels[state.currentLevelIndex]

/** The level the active player just finished, if any. */
export const selectLastLevelResult = (state: GameStore): LevelResult | undefined => {
  const results = state.players[state.activeSlot]?.levelResults
  return results?.[results.length - 1]
}

export const selectLevelNumber = (state: GameStore): number => state.currentLevelIndex + 1
