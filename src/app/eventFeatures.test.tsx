// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { App } from './App'
import { config } from './config'
import { createPlayer } from '../game/players'
import type { Player } from '../game/types'
import { compareOutcome } from '../game/players'
import { MemoryLeaderboardRepository } from '../leaderboard/memoryLeaderboardRepository'
import { t } from '../i18n'
import { useGameStore } from '../store/gameStore'
import { useSettingsStore } from '../store/settingsStore'

function player(name: string, overrides: Partial<Player> = {}): Player {
  return { ...createPlayer(name), ...overrides }
}

function advance(ms: number) {
  act(() => {
    vi.advanceTimersByTime(ms)
  })
}

/** Seats two finished players on an end-of-game screen. */
function finishChallenge(phase: 'results' | 'winner' | 'leaderboard' = 'results') {
  const one = player('عبدالله', { totalScore: 8420, totalTime: 120 })
  const two = player('محمد', { totalScore: 7950, totalTime: 150 })

  useGameStore.setState({
    players: [one, two],
    outcome: compareOutcome(one, two),
    phase,
  })

  return { one, two }
}

/** Opens the operator panel with the hidden logo gesture. */
function openAdminPanel() {
  const logo = screen.getByLabelText(
    new RegExp(useSettingsStore.getState().gameTitle),
  )

  for (let tap = 0; tap < config.kiosk.adminTapCount; tap += 1) {
    fireEvent.click(logo)
  }
}

describe('event features', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    useGameStore.getState().resetGame()
    useSettingsStore.getState().resetSettings()
  })

  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  describe('leaderboard', () => {
    it('records both players when the results screen appears', async () => {
      const repository = new MemoryLeaderboardRepository(100)
      finishChallenge('results')

      render(<App leaderboardRepository={repository} />)
      await act(async () => {})

      const entries = await repository.list()
      expect(entries.map((e) => e.playerName)).toEqual(['عبدالله', 'محمد'])
      expect(entries[0]!.score).toBe(8420)
    })

    it('records the round once, not once per render', async () => {
      const repository = new MemoryLeaderboardRepository(100)
      finishChallenge('results')

      const view = render(<App leaderboardRepository={repository} />)
      await act(async () => {})
      view.rerender(<App leaderboardRepository={repository} />)
      await act(async () => {})

      await expect(repository.list()).resolves.toHaveLength(2)
    })

    it('shows the standings in rank order', async () => {
      const repository = new MemoryLeaderboardRepository(100)
      await repository.addMany([
        { playerName: 'ثاني', score: 500, totalTime: 90, date: '2026-09-01T10:00:00.000Z' },
        { playerName: 'أول', score: 900, totalTime: 120, date: '2026-09-01T10:00:00.000Z' },
      ])

      useGameStore.setState({ phase: 'leaderboard' })
      render(<App leaderboardRepository={repository} />)
      await act(async () => {})

      const names = screen.getAllByText(/أول|ثاني/).map((el) => el.textContent)
      expect(names).toEqual(['أول', 'ثاني'])
    })

    it('spotlights the players from the round just played', async () => {
      const repository = new MemoryLeaderboardRepository(100)
      await repository.add({
        playerName: 'قديم',
        score: 100,
        totalTime: 200,
        date: '2026-09-01T10:00:00.000Z',
      })
      finishChallenge('results')

      render(<App leaderboardRepository={repository} />)
      await act(async () => {})
      act(() => {
        useGameStore.setState({ phase: 'leaderboard' })
      })
      await act(async () => {})

      // Two players just finished; the older entry is not marked.
      expect(screen.getAllByText(t.leaderboard.latest)).toHaveLength(2)
    })

    it('shows the empty state when nothing has been recorded', async () => {
      useGameStore.setState({ phase: 'leaderboard' })
      render(<App leaderboardRepository={new MemoryLeaderboardRepository(100)} />)
      await act(async () => {})

      expect(screen.getByText(t.leaderboard.empty)).not.toBeNull()
    })
  })

  describe('kiosk auto-reset', () => {
    it('returns an idle winner screen to the attract loop', () => {
      finishChallenge('winner')
      render(<App />)

      advance(useSettingsStore.getState().autoResetMs + 100)

      expect(useGameStore.getState().phase).toBe('attract')
      expect(useGameStore.getState().players).toEqual([])
    })

    it('restarts the countdown whenever someone touches the screen', () => {
      finishChallenge('winner')
      render(<App />)
      const autoResetMs = useSettingsStore.getState().autoResetMs

      advance(autoResetMs - 1000)
      act(() => {
        window.dispatchEvent(new Event('pointerdown'))
      })
      advance(autoResetMs - 1000)

      expect(useGameStore.getState().phase).toBe('winner')

      advance(autoResetMs + 100)
      expect(useGameStore.getState().phase).toBe('attract')
    })

    it('never resets a screen mid-game', () => {
      useGameStore.getState().chooseMode()
    useGameStore.getState().setMode('duel')
      useGameStore.getState().registerPlayers('عبدالله', 'محمد')
      useGameStore.setState({ phase: 'playing' })
      render(<App />)

      advance(useSettingsStore.getState().autoResetMs * 3)

      expect(useGameStore.getState().phase).toBe('playing')
    })

    it('holds off while the operator panel is open', () => {
      finishChallenge('winner')
      useGameStore.setState({ adminOpen: true })
      render(<App />)

      advance(useSettingsStore.getState().autoResetMs * 3)

      expect(useGameStore.getState().phase).toBe('winner')
    })

    it('keeps leaderboard records through a reset', async () => {
      const repository = new MemoryLeaderboardRepository(100)
      finishChallenge('results')

      render(<App leaderboardRepository={repository} />)
      await act(async () => {})

      useGameStore.getState().resetGame()

      await expect(repository.list()).resolves.toHaveLength(2)
    })
  })

  describe('operator panel', () => {
    it('opens on five taps of the logo and not on four', () => {
      useGameStore.setState({ phase: 'registration' })
      render(<App />)

      const logo = screen.getByLabelText(new RegExp(useSettingsStore.getState().gameTitle))
      for (let tap = 0; tap < config.kiosk.adminTapCount - 1; tap += 1) {
        fireEvent.click(logo)
      }
      expect(screen.queryByText(t.admin.title)).toBeNull()

      fireEvent.click(logo)
      expect(screen.getByText(t.admin.title)).not.toBeNull()
    })

    it('retunes a level timer, and the next level uses it', () => {
      useGameStore.setState({ phase: 'registration' })
      render(<App />)
      openAdminPanel()

      const firstLevel = config.levels[0]!
      const row = screen.getByText(t.level.label(1)).parentElement!
      fireEvent.click(within(row, '+'))

      expect(useSettingsStore.getState().levelTimeLimits[firstLevel.id]).toBe(
        firstLevel.timeLimit + 5,
      )
    })

    it('switches sound off', () => {
      useGameStore.setState({ phase: 'registration' })
      render(<App />)
      openAdminPanel()

      const row = screen.getByText(t.admin.sound).parentElement!
      fireEvent.click(within(row, t.admin.on))

      expect(useSettingsStore.getState().soundEnabled).toBe(false)
    })

    it('renames the game everywhere at once', () => {
      useGameStore.setState({ phase: 'registration' })
      render(<App />)
      openAdminPanel()

      const input = screen.getByDisplayValue(config.branding.gameTitle)
      fireEvent.change(input, { target: { value: 'تحدي بلدي' } })

      expect(useSettingsStore.getState().gameTitle).toBe('تحدي بلدي')
    })

    it('asks for a second tap before wiping the standings', async () => {
      const repository = new MemoryLeaderboardRepository(100)
      await repository.add({
        playerName: 'قديم',
        score: 100,
        totalTime: 10,
        date: '2026-09-01T10:00:00.000Z',
      })

      useGameStore.setState({ phase: 'registration' })
      render(<App leaderboardRepository={repository} />)
      await act(async () => {})
      openAdminPanel()

      fireEvent.click(screen.getByText(t.admin.resetLeaderboard))
      await act(async () => {})
      await expect(repository.list()).resolves.toHaveLength(1)

      fireEvent.click(screen.getByText(t.admin.confirmClear))
      await act(async () => {})
      await expect(repository.list()).resolves.toHaveLength(0)
    })

    it('drops straight into a level for a smoke test', () => {
      useGameStore.setState({ phase: 'registration' })
      render(<App />)
      openAdminPanel()

      fireEvent.click(screen.getByText(t.admin.testLevel(3)))

      const state = useGameStore.getState()
      expect(state.currentLevelIndex).toBe(2)
      expect(state.phase).toBe('countdown')
      expect(state.adminOpen).toBe(false)
    })

    it('restores every default', () => {
      useSettingsStore.getState().setSoundEnabled(false)
      useSettingsStore.getState().setGameTitle('شيء آخر')

      useGameStore.setState({ phase: 'registration' })
      render(<App />)
      openAdminPanel()

      fireEvent.click(screen.getByText(t.admin.restoreDefaults))

      expect(useSettingsStore.getState().soundEnabled).toBe(config.audio.soundEnabled)
      expect(useSettingsStore.getState().gameTitle).toBe(config.branding.gameTitle)
    })
  })
})

/** Finds a button by its text inside a given row. */
function within(container: HTMLElement, text: string): HTMLElement {
  const match = [...container.querySelectorAll('button')].find(
    (button) => button.textContent?.trim() === text,
  )
  if (!match) throw new Error(`No button "${text}" in row`)
  return match
}
