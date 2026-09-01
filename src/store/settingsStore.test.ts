import { beforeEach, describe, expect, it } from 'vitest'

import { config } from '../app/config'
import { levels } from '../game/levels'
import { LIMITS, applyLevelSettings, useSettingsStore } from './settingsStore'

const settings = () => useSettingsStore.getState()

describe('settingsStore', () => {
  beforeEach(() => {
    settings().resetSettings()
  })

  it('starts from the shipped configuration', () => {
    expect(settings().soundEnabled).toBe(config.audio.soundEnabled)
    expect(settings().masterVolume).toBe(config.audio.masterVolume)
    expect(settings().autoResetMs).toBe(config.kiosk.autoResetMs)
    expect(settings().gameTitle).toBe(config.branding.gameTitle)
    expect(settings().levelTimeLimits).toEqual({})
  })

  it('clamps volume into 0..1 and survives a non-number', () => {
    settings().setMasterVolume(5)
    expect(settings().masterVolume).toBe(1)

    settings().setMasterVolume(-2)
    expect(settings().masterVolume).toBe(0)

    settings().setMasterVolume(Number.NaN)
    expect(settings().masterVolume).toBe(0)
  })

  it('keeps a level timer inside playable bounds', () => {
    settings().setLevelTimeLimit(1, 5)
    expect(settings().levelTimeLimits[1]).toBe(LIMITS.timeLimit.min)

    settings().setLevelTimeLimit(1, 9999)
    expect(settings().levelTimeLimits[1]).toBe(LIMITS.timeLimit.max)

    settings().setLevelTimeLimit(1, 55)
    expect(settings().levelTimeLimits[1]).toBe(55)
  })

  it('keeps the auto-reset delay inside sane bounds', () => {
    settings().setAutoResetMs(1000)
    expect(settings().autoResetMs).toBe(LIMITS.autoResetSeconds.min * 1000)

    settings().setAutoResetMs(9_999_999)
    expect(settings().autoResetMs).toBe(LIMITS.autoResetSeconds.max * 1000)
  })

  it('refuses to leave a title blank', () => {
    settings().setGameTitle('   ')
    expect(settings().gameTitle).toBe('   ')

    settings().setGameTitle('')
    expect(settings().gameTitle).toBe(config.branding.gameTitle)
  })

  it('truncates an over-long title rather than rejecting it', () => {
    settings().setEventTitle('ا'.repeat(200))
    expect(settings().eventTitle).toHaveLength(LIMITS.titleLength)
  })

  it('retunes one level without touching the others', () => {
    settings().setLevelTimeLimit(2, 90)

    expect(settings().levelTimeLimits).toEqual({ 2: 90 })
  })

  it('returns everything to the defaults', () => {
    settings().setSoundEnabled(false)
    settings().setLevelTimeLimit(1, 30)
    settings().setGameTitle('آخر')

    settings().resetSettings()

    expect(settings().soundEnabled).toBe(config.audio.soundEnabled)
    expect(settings().levelTimeLimits).toEqual({})
    expect(settings().gameTitle).toBe(config.branding.gameTitle)
  })
})

describe('applyLevelSettings', () => {
  it('leaves the table untouched when nothing is overridden', () => {
    expect(applyLevelSettings(levels, {})).toEqual([...levels])
  })

  it('applies an override to just that level', () => {
    const applied = applyLevelSettings(levels, { 2: 90 })

    expect(applied[0]!.timeLimit).toBe(levels[0]!.timeLimit)
    expect(applied[1]!.timeLimit).toBe(90)
    expect(applied[2]!.timeLimit).toBe(levels[2]!.timeLimit)
  })

  it('keeps the grid and pair count intact', () => {
    const applied = applyLevelSettings(levels, { 1: 20 })

    expect(applied[0]!.rows).toBe(levels[0]!.rows)
    expect(applied[0]!.columns).toBe(levels[0]!.columns)
    expect(applied[0]!.pairs).toBe(levels[0]!.pairs)
  })

  it('does not mutate the shipped level table', () => {
    const before = JSON.stringify(levels)
    applyLevelSettings(levels, { 1: 20, 2: 30, 3: 40 })

    expect(JSON.stringify(levels)).toBe(before)
  })

  it('ignores an override for a level that does not exist', () => {
    expect(applyLevelSettings(levels, { 99: 10 })).toEqual([...levels])
  })
})
