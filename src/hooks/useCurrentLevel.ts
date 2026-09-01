import { useMemo } from 'react'

import { levels } from '../game/levels'
import type { LevelConfig } from '../game/types'
import { applyLevelSettings, useSettingsStore } from '../store/settingsStore'
import { useGameStore } from '../store/gameStore'

/**
 * The level in progress, with the operator's time overrides applied.
 *
 * Screens ask for the level here rather than reading `config.levels`
 * directly, so a timer retuned in the admin panel takes effect on the
 * very next level without a reload.
 */
export function useCurrentLevel(): LevelConfig | undefined {
  const index = useGameStore((state) => state.currentLevelIndex)
  const overrides = useSettingsStore((state) => state.levelTimeLimits)

  return useMemo(() => applyLevelSettings(levels, overrides)[index], [overrides, index])
}
