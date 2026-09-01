import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'

import { config } from '../app/config'
import type { LeaderboardEntry, Player } from '../game/types'
import { createLeaderboardRepository, withMemoryFallback } from './createLeaderboardRepository'
import { entryFromPlayer, type LeaderboardRepository } from './leaderboardRepository'
import { LeaderboardContext, type LeaderboardApi } from './leaderboardContext'

interface LeaderboardProviderProps {
  children: ReactNode
  /** Injectable so tests and a future remote backend can supply their own. */
  repository?: LeaderboardRepository
}

/**
 * Holds the standings for the session.
 *
 * Every call is wrapped so a storage failure cannot reach a screen: the
 * worst case is an empty board, never an error in front of a queue.
 */
export function LeaderboardProvider({ children, repository }: LeaderboardProviderProps) {
  const store = useMemo(
    () => repository ?? withMemoryFallback(createLeaderboardRepository()),
    [repository],
  )

  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)

  // `loading` starts true and is only ever cleared: a later refresh keeps
  // the standings on screen instead of flashing an empty board.
  const refresh = useCallback(async () => {
    try {
      setEntries(await store.list(config.leaderboard.storageLimit))
    } catch (error) {
      console.warn('[leaderboard] Could not read standings.', error)
      setEntries([])
    } finally {
      setLoading(false)
    }
  }, [store])

  useEffect(() => {
    // Reading the standings out of storage is exactly the case the rule
    // carves out — synchronising React with an external system — and the
    // state only settles after the await.
    // eslint-disable-next-line react/set-state-in-effect
    void refresh()
  }, [refresh])

  const submit = useCallback(
    async (players: readonly Player[]) => {
      try {
        await store.addMany(players.map((player) => entryFromPlayer(player)))
      } catch (error) {
        console.warn('[leaderboard] Could not record the round.', error)
      }
      await refresh()
    },
    [store, refresh],
  )

  const clear = useCallback(async () => {
    try {
      await store.clear()
    } catch (error) {
      console.warn('[leaderboard] Could not clear standings.', error)
    }
    await refresh()
  }, [store, refresh])

  const api = useMemo<LeaderboardApi>(
    () => ({ entries, loading, submit, clear, refresh }),
    [entries, loading, submit, clear, refresh],
  )

  return <LeaderboardContext.Provider value={api}>{children}</LeaderboardContext.Provider>
}
