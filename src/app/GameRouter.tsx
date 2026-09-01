import type { ComponentType } from 'react'

import { AttractScreen } from '../screens/AttractScreen'
import { ChallengeIntroScreen } from '../screens/ChallengeIntroScreen'
import { CountdownScreen } from '../screens/CountdownScreen'
import { GameScreen } from '../screens/GameScreen'
import { LeaderboardScreen } from '../screens/LeaderboardScreen'
import { LevelCompleteScreen } from '../screens/LevelCompleteScreen'
import { ModeSelectScreen } from '../screens/ModeSelectScreen'
import { PlayerCompleteScreen } from '../screens/PlayerCompleteScreen'
import { PlayerReadyScreen } from '../screens/PlayerReadyScreen'
import { PlayerSwitchScreen } from '../screens/PlayerSwitchScreen'
import { RegistrationScreen } from '../screens/RegistrationScreen'
import { ResultsScreen } from '../screens/ResultsScreen'
import { WinnerScreen } from '../screens/WinnerScreen'
import type { GamePhase } from '../game/types'
import { useGameStore } from '../store/gameStore'

/**
 * One screen per phase, exhaustively. TypeScript rejects this map if a
 * phase is ever added without a screen to render it, which is the check
 * that keeps the state machine and the UI from drifting apart.
 */
const screens: Record<GamePhase, ComponentType> = {
  attract: AttractScreen,
  'mode-select': ModeSelectScreen,
  registration: RegistrationScreen,
  'challenge-intro': ChallengeIntroScreen,
  'player-ready': PlayerReadyScreen,
  countdown: CountdownScreen,
  playing: GameScreen,
  'level-complete': LevelCompleteScreen,
  'player-complete': PlayerCompleteScreen,
  'player-switch': PlayerSwitchScreen,
  results: ResultsScreen,
  winner: WinnerScreen,
  leaderboard: LeaderboardScreen,
}

/**
 * Screens swap instantly and animate *in*; there is no exit animation.
 *
 * An exit transition would put roughly three quarters of a second of
 * dead time in front of a player on every screen change — including the
 * one between the countdown and the board — for an effect nobody at a
 * kiosk is watching for. The `key` forces a genuine remount, which is
 * also what gives each level a fresh engine.
 */
export function GameRouter() {
  const phase = useGameStore((state) => state.phase)
  const Screen = screens[phase]

  return <Screen key={phase} />
}
