import { useEffect } from 'react'

import { useAudio } from '../audio/audioContext'
import { ScreenLayout } from '../components/ScreenLayout'
import { TouchButton } from '../components/TouchButton'
import { t } from '../i18n'
import { selectActivePlayer, selectIsSolo, useGameStore } from '../store/gameStore'

/**
 * Confirms the run was recorded without revealing the score.
 *
 * This screen is the privacy boundary the brief asks for: player two is
 * standing right there, and showing player one's total here would hand
 * them a target to beat.
 */
export function PlayerCompleteScreen() {
  const player = useGameStore(selectActivePlayer)
  const advanceAfterPlayer = useGameStore((state) => state.advanceAfterPlayer)
  const solo = useGameStore(selectIsSolo)
  const { play } = useAudio()

  useEffect(() => {
    play('playerComplete')
  }, [play])

  return (
    <ScreenLayout background="gameplay" scrim="strong">
      <div className="flex flex-col items-center gap-10 text-center">
        <h1 className="text-display text-[clamp(2.5rem,7vw,5.5rem)] text-text-primary">
          {solo ? t.playerComplete.soloDone : t.playerComplete.recorded}
        </h1>

        <p className="text-display text-4xl text-accent">{player?.name}</p>

        <p className="text-2xl text-text-secondary">{t.playerComplete.thanks}</p>

        <TouchButton size="xl" onClick={advanceAfterPlayer}>
          {t.common.continue}
        </TouchButton>
      </div>
    </ScreenLayout>
  )
}
