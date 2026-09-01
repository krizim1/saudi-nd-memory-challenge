import { ScreenLayout } from '../components/ScreenLayout'
import { TouchButton } from '../components/TouchButton'
import { levels } from '../game/levels'
import { t } from '../i18n'
import { selectIsSolo, useGameStore } from '../store/gameStore'
import { applyLevelSettings, useSettingsStore } from '../store/settingsStore'

/** Explains the rules once, before the first player steps up. */
export function ChallengeIntroScreen() {
  const beginChallenge = useGameStore((state) => state.beginChallenge)
  const players = useGameStore((state) => state.players)
  const solo = useGameStore(selectIsSolo)
  const gameTitle = useSettingsStore((state) => state.gameTitle)
  const levelTimeLimits = useSettingsStore((state) => state.levelTimeLimits)

  return (
    <ScreenLayout background="registration" scrim="strong">
      <div className="flex w-full max-w-5xl flex-col items-center gap-12 text-center">
        <h1 className="text-display text-[clamp(2.5rem,6vw,5rem)] text-text-primary">
          {gameTitle}
        </h1>

        <div className="flex items-center gap-8 text-display text-3xl">
          <span className="text-text-primary">{players[0]?.name}</span>
          {!solo && (
            <>
              <span className="text-accent">{t.common.vs}</span>
              <span className="text-text-primary">{players[1]?.name}</span>
            </>
          )}
        </div>

        <section className="w-full rounded-3xl border border-white/10 bg-surface p-10 backdrop-blur-sm">
          <h2 className="text-display mb-6 text-3xl text-accent">{t.intro.rulesHeading}</h2>
          <ul className="space-y-4 text-2xl text-text-primary">
            {t.intro.rules.map((rule) => (
              <li key={rule} className="flex items-center justify-center gap-4">
                <span aria-hidden className="h-2 w-2 rounded-full bg-accent" />
                {rule}
              </li>
            ))}
          </ul>
        </section>

        <div className="flex gap-6 text-xl text-text-secondary">
          {applyLevelSettings(levels, levelTimeLimits).map((level, index) => (
            <span key={level.id} className="rounded-full border border-white/15 px-6 py-3">
              {t.level.label(index + 1)} · {level.pairs} · {level.timeLimit} {t.common.seconds}
            </span>
          ))}
        </div>

        <TouchButton size="xl" onClick={beginChallenge}>
          {t.common.startChallenge}
        </TouchButton>
      </div>
    </ScreenLayout>
  )
}
