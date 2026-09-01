import { createContext, useContext } from 'react'

import type { AudioManager, SoundName } from './AudioManager'

export interface AudioApi {
  play: (name: SoundName) => void
  /** Resumes playback after the first user gesture. */
  unlock: () => void
  manager: AudioManager | null
}

/**
 * Defaults to a working no-op so a component rendered outside the
 * provider — in a test, or a screen mounted in isolation — stays silent
 * instead of throwing.
 */
export const AudioContext = createContext<AudioApi>({
  play: () => {},
  unlock: () => {},
  manager: null,
})

export function useAudio(): AudioApi {
  return useContext(AudioContext)
}
