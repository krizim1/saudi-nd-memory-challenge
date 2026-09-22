import { useEffect } from 'react'

import { AdminPanel } from '../admin/AdminPanel'
import { AudioProvider } from '../audio/AudioProvider'
import { ClientProvider } from '../client/ClientProvider'
import { validateLevels } from '../game/levels'
import { useKioskReset } from '../hooks/useKioskReset'
import { LeaderboardProvider } from '../leaderboard/LeaderboardProvider'
import type { LeaderboardRepository } from '../leaderboard/leaderboardRepository'
import { ThemeProvider } from '../theme/ThemeProvider'
import { useGameStore } from '../store/gameStore'
import { ErrorBoundary } from './ErrorBoundary'
import { GameRouter } from './GameRouter'

/**
 * Everything that needs the providers above it: the kiosk idle timer,
 * the screen in play, and the operator panel layered over both.
 */
function GameShell() {
  const adminOpen = useGameStore((state) => state.adminOpen)

  useKioskReset()

  return (
    <>
      <GameRouter />
      {adminOpen && <AdminPanel />}
    </>
  )
}

interface AppProps {
  /** Injectable so tests can supply their own storage. */
  leaderboardRepository?: LeaderboardRepository
}

export function App({ leaderboardRepository }: AppProps = {}) {
  const resetGame = useGameStore((state) => state.resetGame)

  // Surface a malformed level table at startup rather than mid-event.
  useEffect(() => {
    const problems = validateLevels()
    for (const problem of problems) {
      console.error(`[config] ${problem}`)
    }
  }, [])

  return (
    <ThemeProvider>
      <ClientProvider>
        <AudioProvider>
          <LeaderboardProvider repository={leaderboardRepository}>
            <ErrorBoundary onReset={resetGame}>
              <GameShell />
            </ErrorBoundary>
          </LeaderboardProvider>
        </AudioProvider>
      </ClientProvider>
    </ThemeProvider>
  )
}
