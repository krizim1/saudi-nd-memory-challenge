import { useEffect } from 'react'
import { motion } from 'framer-motion'

import { useAudio } from '../audio/audioContext'
import { Celebration } from '../components/Celebration'
import { ScreenLayout } from '../components/ScreenLayout'
import { TouchButton } from '../components/TouchButton'
import { t } from '../i18n'
import { formatScore } from '../utils/format'
import { useGameStore } from '../store/gameStore'
import { useSettingsStore } from '../store/settingsStore'

/** The celebration beat. One name, one number, nothing competing with them. */
export function WinnerScreen() {
  const outcome = useGameStore((state) => state.outcome)
  const showLeaderboard = useGameStore((state) => state.showLeaderboard)
  const resetGame = useGameStore((state) => state.resetGame)
  const leaderboardEnabled = useSettingsStore((state) => state.showLeaderboard)
  const { play } = useAudio()
  const winner = outcome?.winner

  useEffect(() => {
    play('winnerCelebration')
  }, [play])

  return (
    <ScreenLayout background="winner" scrim="strong">
      <Celebration />

      <motion.div
        initial={{ scale: 0.94, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative flex flex-col items-center gap-10 text-center"
      >
        <span className="text-display text-3xl tracking-[0.3em] text-accent">
          {outcome?.isDraw ? t.results.draw : t.winner.title}
        </span>

        {winner ? (
          <>
            <h1 className="text-display text-[clamp(3rem,10vw,8rem)] leading-none text-text-primary">
              {winner.name}
            </h1>
            <p className="text-display text-[clamp(2rem,5vw,4rem)] text-accent">
              {formatScore(winner.totalScore)} {t.common.points}
            </p>
          </>
        ) : (
          <h1 className="text-display text-[clamp(2.5rem,8vw,6rem)] text-text-primary">
            {t.results.draw}
          </h1>
        )}

        <TouchButton
          size="xl"
          onClick={leaderboardEnabled ? showLeaderboard : resetGame}
        >
          {leaderboardEnabled ? t.leaderboard.title : t.common.newChallenge}
        </TouchButton>
      </motion.div>
    </ScreenLayout>
  )
}
