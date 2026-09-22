import { afterEach, describe, expect, it, vi } from 'vitest'

import { withMemoryFallback } from './createLeaderboardRepository'
import { ClearRejectedError } from './leaderboardRepository'
import { SupabaseLeaderboardRepository } from './supabaseLeaderboardRepository'

const URL = 'https://example.supabase.co'
const repo = (client = 'byd') => new SupabaseLeaderboardRepository(URL, 'anon-key', 1000, client)

function mockFetch(body: unknown, ok = true) {
  const fn = vi.fn(async () => ({ ok, status: ok ? 200 : 500, json: async () => body }))
  vi.stubGlobal('fetch', fn)
  return fn
}

afterEach(() => vi.unstubAllGlobals())

describe('SupabaseLeaderboardRepository', () => {
  it('reads the ranked table and maps rows to entries', async () => {
    const fetch = mockFetch([
      { id: 'b', player_name: 'ثاني', score: 500, total_time: 90, created_at: '2026-09-01T10:00:00Z', matches: 20, attempts: 30, best_streak: 4, levels_cleared: 3 },
      { id: 'a', player_name: 'أول', score: 900, total_time: 120, created_at: '2026-09-01T10:00:00Z', matches: null, attempts: null, best_streak: null, levels_cleared: null },
    ])

    const entries = await repo().list(10)

    expect(entries.map((e) => e.playerName)).toEqual(['أول', 'ثاني'])
    expect(entries[1]).toMatchObject({ matches: 20, attempts: 30, bestStreak: 4, levelsCleared: 3 })
    expect(entries[0]!.matches).toBeUndefined()

    const [url, init] = fetch.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toContain(`${URL}/rest/v1/leaderboard?`)
    expect(url).toContain('order=score.desc,total_time.asc,created_at.asc')
    expect(url).toContain('limit=10')
    expect(url).toContain('client=eq.byd')
    expect((init.headers as Record<string, string>).apikey).toBe('anon-key')
  })

  it('inserts every entry of a round in one request', async () => {
    const fetch = mockFetch(null)

    const saved = await repo().addMany([
      { playerName: 'عبدالله', score: 8420, totalTime: 120, date: '2026-09-01T10:00:00.000Z', matches: 24 },
      { playerName: 'محمد', score: 7950, totalTime: 150, date: '2026-09-01T10:00:00.000Z' },
    ])

    expect(saved).toHaveLength(2)
    expect(new Set(saved.map((e) => e.id)).size).toBe(2)

    const [, init] = fetch.mock.calls[0] as unknown as [string, RequestInit]
    expect(init.method).toBe('POST')
    const rows = JSON.parse(init.body as string)
    expect(rows[0]).toMatchObject({ client: 'byd', player_name: 'عبدالله', score: 8420, total_time: 120, matches: 24 })
    expect(rows[1].matches).toBeNull()
  })

  it('sends a publishable key as apikey only, a legacy key as a bearer token too', async () => {
    const fetch = mockFetch([])
    await new SupabaseLeaderboardRepository(URL, 'sb_publishable_abc', 10).list()
    await repo().list()

    const publishable = (fetch.mock.calls[0] as unknown as [string, RequestInit])[1].headers as Record<string, string>
    const legacy = (fetch.mock.calls[1] as unknown as [string, RequestInit])[1].headers as Record<string, string>
    expect(publishable.apikey).toBe('sb_publishable_abc')
    expect(publishable.Authorization).toBeUndefined()
    expect(legacy.Authorization).toBe('Bearer anon-key')
  })

  it('rejects on a server error so the caller can fall back', async () => {
    mockFetch(null, false)
    await expect(repo().list()).rejects.toThrow()
    await expect(repo().add({ playerName: 'x', score: 1, totalTime: 1, date: 'd' })).rejects.toThrow()
  })

  it('clears through the PIN-checked database function, for its own client only', async () => {
    const fetch = mockFetch(12)
    await repo().clear('123456')

    const [url, init] = fetch.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe(`${URL}/rest/v1/rpc/reset_leaderboard`)
    expect(JSON.parse(init.body as string)).toEqual({ p_client: 'byd', p_pin: '123456' })
  })

  it('reports a wrong PIN and a lock-out as rejections', async () => {
    mockFetch(-1)
    await expect(repo().clear('000000')).rejects.toMatchObject({ reason: 'invalid-pin' })
    mockFetch(-2)
    await expect(repo().clear('000000')).rejects.toMatchObject({ reason: 'locked' })
  })

  it('does not fall back to memory on a wrong PIN', async () => {
    mockFetch(-1)
    const guarded = withMemoryFallback(repo(), 10)
    await expect(guarded.clear('000000')).rejects.toBeInstanceOf(ClearRejectedError)
    expect(guarded.requiresPin).toBe(true)
  })
})
