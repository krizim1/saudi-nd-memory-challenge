import { describe, expect, it, vi } from 'vitest'

import { activeTheme } from '../theme/theme.config'
import { AudioManager, type AudioManagerOptions, type SoundName } from './AudioManager'

const sounds = activeTheme.sounds
const allNames = Object.keys(sounds) as SoundName[]

/** A minimal stand-in for the parts of Web Audio the manager touches. */
function fakeContext() {
  const started: unknown[] = []
  const gain = { gain: { value: 1 }, connect: vi.fn() }

  const context = {
    state: 'suspended' as AudioContextState,
    destination: {},
    createGain: vi.fn(() => gain),
    createBufferSource: vi.fn(() => ({
      buffer: null,
      connect: vi.fn(),
      start: vi.fn((...args: unknown[]) => started.push(args)),
    })),
    decodeAudioData: vi.fn(async () => ({ duration: 1 }) as unknown as AudioBuffer),
    resume: vi.fn(async () => {
      context.state = 'running'
    }),
    close: vi.fn(async () => {}),
  }

  return { context, gain, started }
}

function manager(overrides: AudioManagerOptions = {}) {
  const { context, gain, started } = fakeContext()

  const instance = new AudioManager(sounds, {
    createContext: () => context as unknown as AudioContext,
    fetchAudio: async () => new ArrayBuffer(8),
    ...overrides,
  })

  return { instance, context, gain, started }
}

describe('AudioManager', () => {
  it('loads every sound the theme declares', async () => {
    const { instance } = manager()
    await instance.preload()

    expect(instance.missing).toEqual([])
  })

  it('records a sound that cannot be fetched instead of throwing', async () => {
    const { instance } = manager({
      fetchAudio: async (url: string) => {
        if (url.includes('card-flip')) throw new Error('404')
        return new ArrayBuffer(8)
      },
    })

    await expect(instance.preload()).resolves.toBeUndefined()
    expect(instance.missing).toEqual(['cardFlip'])
  })

  it('treats a theme with no sound files at all as a supported state', async () => {
    const { instance } = manager({
      fetchAudio: async () => {
        throw new Error('no files deployed')
      },
    })

    await instance.preload()

    expect(instance.missing).toHaveLength(allNames.length)
    expect(() => instance.play('matchSuccess')).not.toThrow()
  })

  it('stays silent and unbroken when the browser has no Web Audio', async () => {
    const { instance } = manager({ createContext: () => null })

    await instance.preload()

    expect(instance.missing).toHaveLength(allNames.length)
    expect(() => instance.play('cardFlip')).not.toThrow()
    expect(() => instance.unlock()).not.toThrow()
  })

  it('plays a loaded sound', async () => {
    const { instance, started } = manager()
    await instance.preload()

    instance.play('cardFlip')

    expect(started).toHaveLength(1)
  })

  it('overlaps repeated plays rather than cutting the previous one off', async () => {
    const { instance, started } = manager()
    await instance.preload()

    instance.play('cardFlip')
    instance.play('cardFlip')
    instance.play('cardFlip')

    expect(started).toHaveLength(3)
  })

  it('plays nothing while sound is switched off', async () => {
    const { instance, started } = manager({ enabled: false })
    await instance.preload()

    instance.play('cardFlip')
    expect(started).toHaveLength(0)

    instance.setEnabled(true)
    instance.play('cardFlip')
    expect(started).toHaveLength(1)
  })

  it('plays nothing for a sound that failed to load', async () => {
    const { instance, started } = manager({
      fetchAudio: async () => {
        throw new Error('missing')
      },
    })
    await instance.preload()

    instance.play('winnerCelebration')

    expect(started).toHaveLength(0)
  })

  it('applies master volume and clamps it to a sane range', async () => {
    const { instance, gain } = manager({ volume: 0.5 })
    await instance.preload()
    expect(gain.gain.value).toBe(0.5)

    instance.setVolume(2)
    expect(instance.getVolume()).toBe(1)

    instance.setVolume(-1)
    expect(instance.getVolume()).toBe(0)

    instance.setVolume(Number.NaN)
    expect(instance.getVolume()).toBe(0)
  })

  it('resumes a suspended context on the first user gesture', () => {
    const { instance, context } = manager()

    instance.unlock()

    expect(context.resume).toHaveBeenCalledOnce()
  })

  it('reuses one context rather than creating one per sound', async () => {
    const createContext = vi.fn(() => fakeContext().context as unknown as AudioContext)
    const instance = new AudioManager(sounds, {
      createContext,
      fetchAudio: async () => new ArrayBuffer(8),
    })

    await instance.preload()
    instance.unlock()
    instance.play('cardFlip')

    expect(createContext).toHaveBeenCalledOnce()
  })
})
