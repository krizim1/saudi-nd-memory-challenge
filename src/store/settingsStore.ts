/**
 * Operator settings.
 *
 * `app/config.ts` holds the defaults the app ships with; this store holds
 * what the operator changed on the day, and persists it so a browser
 * refresh mid-event does not undo their setup. Anything the admin panel
 * can touch lives here — nothing else does, so the config file stays the
 * single readable statement of intent.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { config } from '../app/config'
import type { LevelConfig } from '../game/types'

export interface Settings {
  soundEnabled: boolean
  /** 0..1 */
  masterVolume: number
  /** Level id → seconds. Only ids the operator retuned appear here. */
  levelTimeLimits: Record<number, number>
  /** Idle milliseconds on an end screen before returning to attract. */
  autoResetMs: number
  /** Whether the leaderboard is part of the public flow. */
  showLeaderboard: boolean
  gameTitle: string
  eventTitle: string
}

interface SettingsActions {
  setSoundEnabled: (enabled: boolean) => void
  setMasterVolume: (volume: number) => void
  setLevelTimeLimit: (levelId: number, seconds: number) => void
  setAutoResetMs: (ms: number) => void
  setShowLeaderboard: (show: boolean) => void
  setGameTitle: (title: string) => void
  setEventTitle: (title: string) => void
  /** Returns every setting to the shipped defaults. */
  resetSettings: () => void
}

export type SettingsStore = Settings & SettingsActions

/** Bounds that keep a mis-tap in the admin panel from breaking a level. */
export const LIMITS = {
  timeLimit: { min: 10, max: 300 },
  autoResetSeconds: { min: 5, max: 600 },
  titleLength: 60,
} as const

const defaults: Settings = {
  soundEnabled: config.audio.soundEnabled,
  masterVolume: config.audio.masterVolume,
  levelTimeLimits: {},
  autoResetMs: config.kiosk.autoResetMs,
  showLeaderboard: true,
  gameTitle: config.branding.gameTitle,
  eventTitle: config.branding.eventTitle,
}

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min
  return Math.min(max, Math.max(min, value))
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      ...defaults,

      setSoundEnabled: (soundEnabled) => set({ soundEnabled }),

      setMasterVolume: (volume) => set({ masterVolume: clamp(volume, 0, 1) }),

      setLevelTimeLimit: (levelId, seconds) =>
        set((state) => ({
          levelTimeLimits: {
            ...state.levelTimeLimits,
            [levelId]: Math.round(
              clamp(seconds, LIMITS.timeLimit.min, LIMITS.timeLimit.max),
            ),
          },
        })),

      setAutoResetMs: (ms) =>
        set({
          autoResetMs:
            clamp(
              ms / 1000,
              LIMITS.autoResetSeconds.min,
              LIMITS.autoResetSeconds.max,
            ) * 1000,
        }),

      setShowLeaderboard: (showLeaderboard) => set({ showLeaderboard }),

      setGameTitle: (title) =>
        set({ gameTitle: title.slice(0, LIMITS.titleLength) || defaults.gameTitle }),

      setEventTitle: (title) =>
        set({ eventTitle: title.slice(0, LIMITS.titleLength) || defaults.eventTitle }),

      resetSettings: () => set({ ...defaults }),
    }),
    {
      name: 'smc-settings',
      version: 1,
      // A kiosk with storage disabled must still run, so a failed write is
      // not allowed to take the app down with it.
      storage: {
        getItem: (name) => {
          try {
            const value = localStorage.getItem(name)
            return value ? JSON.parse(value) : null
          } catch {
            return null
          }
        },
        setItem: (name, value) => {
          try {
            localStorage.setItem(name, JSON.stringify(value))
          } catch {
            /* out of quota, private mode, or storage blocked */
          }
        },
        removeItem: (name) => {
          try {
            localStorage.removeItem(name)
          } catch {
            /* nothing to do */
          }
        },
      },
    },
  ),
)

/**
 * Applies the operator's time overrides to the shipped level table.
 *
 * Kept as a pure function so the engine and the screens agree on what a
 * level is without either of them reaching into the settings store.
 */
export function applyLevelSettings(
  levels: readonly LevelConfig[],
  overrides: Record<number, number>,
): LevelConfig[] {
  return levels.map((level) => {
    const override = overrides[level.id]
    return override === undefined ? level : { ...level, timeLimit: override }
  })
}
