/**
 * Read-only accessors over the level table in `app/config.ts`.
 *
 * Screens ask questions here ("is this the last level?") instead of
 * indexing the config array themselves, so level count stays a config
 * concern rather than something baked into the UI.
 */

import { config } from '../app/config'
import type { LevelConfig } from './types'

export const levels: readonly LevelConfig[] = config.levels

export const levelCount = levels.length

/** The level at a zero-based position in the sequence, or `undefined`. */
export function getLevelByIndex(index: number): LevelConfig | undefined {
  return levels[index]
}

export function getLevelById(id: number): LevelConfig | undefined {
  return levels.find((level) => level.id === id)
}

export function isLastLevel(index: number): boolean {
  return index >= levelCount - 1
}

/** Total cards dealt for a level — two per pair. */
export function cardCountForLevel(level: LevelConfig): number {
  return level.pairs * 2
}

/**
 * Guards the config against a grid that cannot hold its own pairs.
 * Called once at startup so a bad edit surfaces immediately instead of
 * producing a silently broken board mid-event.
 */
export function validateLevels(source: readonly LevelConfig[] = levels): string[] {
  const problems: string[] = []

  if (source.length === 0) {
    problems.push('No levels are configured.')
  }

  const seenIds = new Set<number>()
  for (const level of source) {
    if (seenIds.has(level.id)) {
      problems.push(`Duplicate level id ${level.id}.`)
    }
    seenIds.add(level.id)

    const slots = level.rows * level.columns
    if (slots !== level.pairs * 2) {
      problems.push(
        `Level ${level.id}: grid ${level.columns}×${level.rows} has ${slots} slots but ${level.pairs} pairs need ${level.pairs * 2}.`,
      )
    }
    if (level.timeLimit <= 0) {
      problems.push(`Level ${level.id}: timeLimit must be greater than zero.`)
    }
  }

  return problems
}
