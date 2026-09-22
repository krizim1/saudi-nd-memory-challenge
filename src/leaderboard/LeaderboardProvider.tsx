import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'

import { config } from '../app/config'
import type { LeaderboardEntry, Player } from '../game/types'
import {
  createLeaderboardRepository,
  createRemoteLeaderboardRepository,
  withMemoryFallback,
} from './createLeaderboardRepository'
import {
  ClearRejectedError,
  entryFromPlayer,
  type LeaderboardRepository,
} from './leaderboardRepository'
import { LeaderboardContext, type ClearResult, type LeaderboardApi } from './leaderboardContext'

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
    () =>
      repository ??
      withMemoryFallback(createRemoteLeaderboardRepository() ?? createLeaderboardRepository()),
    [repository],
  )

  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [recentIds, setRecentIds] = useState<ReadonlySet<string>>(() => new Set())

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
        const added = await store.addMany(players.map((player) => entryFromPlayer(player)))
        setRecentIds(new Set(added.map((entry) => entry.id)))
      } catch (error) {
        console.warn('[leaderboard] Could not record the round.', error)
      }
      await refresh()
    },
    [store, refresh],
  )

  const clear = useCallback(
    async (pin?: string): Promise<ClearResult> => {
      let result: ClearResult = 'cleared'
      try {
        await store.clear(pin)
        setRecentIds(new Set())
      } catch (error) {
        if (error instanceof ClearRejectedError) return error.reason
        console.warn('[leaderboard] Could not clear standings.', error)
        result = 'failed'
      }
      await refresh()
      return result
    },
    [store, refresh],
  )

  const requiresPin = Boolean(store.requiresPin)

  const api = useMemo<LeaderboardApi>(
    () => ({ entries, loading, recentIds, submit, clear, requiresPin, refresh }),
    [entries, loading, recentIds, submit, clear, requiresPin, refresh],
  )

  return <LeaderboardContext.Provider value={api}>{children}</LeaderboardContext.Provider>
}
