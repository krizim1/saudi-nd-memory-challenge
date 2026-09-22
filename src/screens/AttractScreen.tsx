import { useCallback } from 'react'
import { motion } from 'framer-motion'

import { useAdminGesture } from '../admin/useAdminGesture'
import { config } from '../app/config'
import { useAudio } from '../audio/audioContext'
import { useEventTitle } from '../client/clientContext'
import { BrandLogo } from '../components/BrandLogo'
import { ClientLogo } from '../components/ClientLogo'
import { ThemedBackground } from '../components/ThemedBackground'
import { TouchButton } from '../components/TouchButton'
import { t } from '../i18n'
import { useGameStore } from '../store/gameStore'
import { useSettingsStore } from '../store/settingsStore'

/**
 * The idle loop. The whole surface is tappable — on a kiosk people press
 * the artwork, not the button — with the button present as the obvious
 * affordance for anyone who looks for one.
 */
export function AttractScreen() {
  const chooseMode = useGameStore((state) => state.chooseMode)
  const showLeaderboard = useGameStore((state) => state.showLeaderboard)
  const { unlock } = useAudio()
  const gameTitle = useSettingsStore((state) => state.gameTitle)
  const eventTitle = useEventTitle()
  const leaderboardEnabled = useSettingsStore((state) => state.showLeaderboard)
  const tagline = config.branding.tagline
  const adminTap = useAdminGesture()

  // Browsers will not start audio before a user gesture, and this tap is
  // the first one of the session — without it the whole game is silent.
  const start = useCallback(() => {
    unlock()
    chooseMode()
  }, [unlock, chooseMode])

  return (
    <ThemedBackground slot="attract" scrim="none">
      <div
        onClick={start}
        className="relative flex h-full w-full flex-col items-center justify-center gap-12 px-12 text-center"
      >
        {/* Partner mark: top-left, opposite the National Day logo (§1.7). */}
        <ClientLogo className="absolute top-12 left-24 h-20 max-w-72" />

        {/* The gesture must not also start a game, so the tap stops here. */}
        <span
          onClick={(event) => {
            event.stopPropagation()
            adminTap()
          }}
        >
          <BrandLogo size="lg" showTitle={false} />
        </span>

        <div className="space-y-6 [text-shadow:0_2px_18px_rgba(0,0,0,0.8),0_0_4px_rgba(0,0,0,0.5)]">
          <h1 className="text-display text-[clamp(3rem,9vw,8rem)] leading-[1.05] text-text-primary">
            {gameTitle}
          </h1>
          <p className="text-display text-[clamp(1.5rem,3vw,2.75rem)] text-accent">
            {eventTitle}
          </p>
          <p className="text-3xl text-text-primary/90">{tagline}</p>
        </div>

        <div className="flex items-center gap-6">
          <TouchButton size="xl" onClick={start}>
            {t.common.startChallenge}
          </TouchButton>
          {/* Must not also start a game, so the tap stops here. */}
          {leaderboardEnabled && (
          <TouchButton
            size="xl"
            variant="secondary"
            onClick={(event) => {
              event.stopPropagation()
              showLeaderboard()
            }}
          >
            {t.attract.viewLeaderboard}
          </TouchButton>
          )}
        </div>

        <motion.p
          animate={{ opacity: [0.35, 1, 0.35] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
          className="text-xl text-text-secondary"
        >
          {t.attract.tapToStart}
        </motion.p>
      </div>
    </ThemedBackground>
  )
}
