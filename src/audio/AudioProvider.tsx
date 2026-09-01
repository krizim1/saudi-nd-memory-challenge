import { useEffect, useMemo, type ReactNode } from 'react'

import { useSettingsStore } from '../store/settingsStore'
import { useTheme } from '../theme/themeContext'
import { AudioManager, type SoundName } from './AudioManager'
import { AudioContext, type AudioApi } from './audioContext'

interface AudioProviderProps {
  children: ReactNode
}

/**
 * Owns the single `AudioManager` for the session.
 *
 * Preloading starts as soon as the theme is known and is deliberately
 * not awaited by anything — the game must be playable before, during and
 * after it, whether or not any sound file turns up.
 */
export function AudioProvider({ children }: AudioProviderProps) {
  const theme = useTheme()
  const soundEnabled = useSettingsStore((state) => state.soundEnabled)
  const masterVolume = useSettingsStore((state) => state.masterVolume)

  // Built once per theme. Settings changes are pushed into the live
  // manager below rather than rebuilding it, which would drop every
  // decoded buffer and leave the next few sounds silent.
  const manager = useMemo(() => new AudioManager(theme.sounds), [theme.sounds])

  useEffect(() => {
    manager.setEnabled(soundEnabled)
  }, [manager, soundEnabled])

  useEffect(() => {
    manager.setVolume(masterVolume)
  }, [manager, masterVolume])

  const api = useMemo<AudioApi>(
    () => ({
      manager,
      play: (name: SoundName) => manager.play(name),
      unlock: () => manager.unlock(),
    }),
    [manager],
  )

  useEffect(() => {
    void manager.preload()
    return () => manager.dispose()
  }, [manager])

  return <AudioContext.Provider value={api}>{children}</AudioContext.Provider>
}
