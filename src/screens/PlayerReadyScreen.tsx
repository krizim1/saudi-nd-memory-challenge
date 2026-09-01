import { ScreenLayout } from '../components/ScreenLayout'
import { TouchButton } from '../components/TouchButton'
import { t } from '../i18n'
import { selectActivePlayer, selectLevelNumber, useGameStore } from '../store/gameStore'

/**
 * A deliberate pause before the countdown. It exists so a player is
 * actually standing at the screen when the timer starts, rather than
 * losing seconds to the handover.
 */
export function PlayerReadyScreen() {
  const player = useGameStore(selectActivePlayer)
  const levelNumber = useGameStore(selectLevelNumber)
  const beginCountdown = useGameStore((state) => state.beginCountdown)

  return (
    <ScreenLayout background="gameplay" scrim="strong">
      <div className="flex flex-col items-center gap-14 text-center">
        <p className="text-2xl tracking-widest text-text-secondary">{t.ready.getReady}</p>

        <h1 className="text-display text-[clamp(3rem,10vw,9rem)] leading-none text-text-primary">
          {player?.name}
        </h1>

        <p className="text-display text-4xl text-accent">{t.ready.yourTurn}</p>

        <p className="text-2xl text-text-secondary">{t.level.label(levelNumber)}</p>

        <TouchButton size="xl" onClick={beginCountdown}>
          {t.common.start}
        </TouchButton>
      </div>
    </ScreenLayout>
  )
}
