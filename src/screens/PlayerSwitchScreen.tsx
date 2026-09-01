import { ScreenLayout } from '../components/ScreenLayout'
import { TouchButton } from '../components/TouchButton'
import { t } from '../i18n'
import { selectActivePlayer, useGameStore } from '../store/gameStore'

/** The handover. Waits for a tap so the next player starts when ready. */
export function PlayerSwitchScreen() {
  const nextPlayer = useGameStore(selectActivePlayer)
  const beginChallenge = useGameStore((state) => state.beginChallenge)

  return (
    <ScreenLayout background="registration" scrim="strong">
      <div className="flex flex-col items-center gap-12 text-center">
        <p className="text-2xl tracking-widest text-text-secondary">
          {t.playerSwitch.nextPlayer}
        </p>

        <h1 className="text-display text-[clamp(2.5rem,8vw,6.5rem)] leading-tight text-text-primary">
          {nextPlayer ? t.playerSwitch.turnOf(nextPlayer.name) : ''}
        </h1>

        <TouchButton size="xl" onClick={beginChallenge}>
          {t.common.ready}
        </TouchButton>
      </div>
    </ScreenLayout>
  )
}
