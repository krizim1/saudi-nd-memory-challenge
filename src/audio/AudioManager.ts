/**
 * Centralised sound playback.
 *
 * Two constraints shape this design. First, sound files are theme
 * content: the manager is handed a `ThemeSounds` record and never names
 * a path itself. Second, a missing, unplayable, or unsupported sound must
 * never interrupt a game — every failure here is recorded and swallowed,
 * because a silent event is a working event and a thrown error is not.
 *
 * Web Audio is used rather than `<audio>` elements: card flips overlap,
 * and HTMLAudioElement adds latency and caps concurrent playback.
 */

import type { ThemeSounds } from '../theme/theme.types'

export type SoundName = keyof ThemeSounds

/** Seams for tests, and for browsers without Web Audio. */
export interface AudioManagerOptions {
  enabled?: boolean
  /** 0..1 */
  volume?: number
  createContext?: () => AudioContext | null
  fetchAudio?: (url: string) => Promise<ArrayBuffer>
}

function defaultCreateContext(): AudioContext | null {
  const Ctor =
    typeof window === 'undefined'
      ? undefined
      : window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext

  try {
    return Ctor ? new Ctor() : null
  } catch {
    return null
  }
}

async function defaultFetchAudio(url: string): Promise<ArrayBuffer> {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`${response.status} for ${url}`)
  return response.arrayBuffer()
}

export class AudioManager {
  private context: AudioContext | null = null
  private gain: GainNode | null = null
  private buffers = new Map<SoundName, AudioBuffer>()
  private unavailable = new Set<SoundName>()
  private enabled: boolean
  private volume: number
  private readonly sounds: ThemeSounds
  private readonly createContext: () => AudioContext | null
  private readonly fetchAudio: (url: string) => Promise<ArrayBuffer>

  constructor(sounds: ThemeSounds, options: AudioManagerOptions = {}) {
    this.sounds = sounds
    this.enabled = options.enabled ?? true
    this.volume = clampVolume(options.volume ?? 1)
    this.createContext = options.createContext ?? defaultCreateContext
    this.fetchAudio = options.fetchAudio ?? defaultFetchAudio
  }

  /** Sounds that could not be loaded. Useful for an operator check. */
  get missing(): SoundName[] {
    return [...this.unavailable]
  }

  get isEnabled(): boolean {
    return this.enabled
  }

  /**
   * Loads every sound, tolerating any that fail.
   *
   * Resolves once all attempts have settled, so a caller can await it
   * without a single bad file rejecting the whole preload.
   */
  async preload(): Promise<void> {
    const context = this.ensureContext()
    if (!context) {
      for (const name of Object.keys(this.sounds) as SoundName[]) {
        this.unavailable.add(name)
      }
      return
    }

    const names = Object.keys(this.sounds) as SoundName[]
    await Promise.all(names.map((name) => this.load(name, context)))
  }

  private async load(name: SoundName, context: AudioContext): Promise<void> {
    try {
      const data = await this.fetchAudio(this.sounds[name])
      this.buffers.set(name, await context.decodeAudioData(data))
      this.unavailable.delete(name)
    } catch {
      // A theme without sound files is a supported state, not an error.
      this.unavailable.add(name)
    }
  }

  private ensureContext(): AudioContext | null {
    if (this.context) return this.context

    const context = this.createContext()
    if (!context) return null

    this.context = context
    try {
      this.gain = context.createGain()
      this.gain.gain.value = this.volume
      this.gain.connect(context.destination)
    } catch {
      this.gain = null
    }

    return context
  }

  /**
   * Resumes the audio context after a user gesture.
   *
   * Browsers refuse to start audio before one, so the attract screen's
   * first tap calls this; without it the whole session stays silent.
   */
  unlock(): void {
    const context = this.ensureContext()
    if (context?.state === 'suspended') {
      void context.resume().catch(() => {})
    }
  }

  play(name: SoundName): void {
    if (!this.enabled) return

    const buffer = this.buffers.get(name)
    const context = this.context
    if (!buffer || !context || !this.gain) return

    try {
      const source = context.createBufferSource()
      source.buffer = buffer
      source.connect(this.gain)
      source.start(0)
    } catch {
      // A source that will not start is not worth a crash mid-game.
    }
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled
  }

  setVolume(volume: number): void {
    this.volume = clampVolume(volume)
    if (this.gain) this.gain.gain.value = this.volume
  }

  getVolume(): number {
    return this.volume
  }

  /** Releases the audio context. Called when the app tears down. */
  dispose(): void {
    this.buffers.clear()
    void this.context?.close().catch(() => {})
    this.context = null
    this.gain = null
  }
}

function clampVolume(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.min(1, Math.max(0, value))
}
