import { ScreenLayout } from '../components/ScreenLayout'
import { TouchButton } from '../components/TouchButton'
import type { GameMode } from '../game/types'
import { t } from '../i18n'
import { useGameStore } from '../store/gameStore'

interface ModeCardProps {
  title: string
  hint: string
  /** Number of figures drawn on the card. */
  players: 1 | 2
  onSelect: () => void
}

/**
 * Each mode is a large card rather than a list row: on a touchscreen the
 * choice should be hittable from arm's length, and the figure count says
 * what the mode is before the label is read.
 */
function ModeCard({ title, hint, players, onSelect }: ModeCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex min-h-[22rem] flex-1 flex-col items-center justify-center gap-6 rounded-3xl border border-white/12 bg-surface px-10 py-12 text-center transition-colors active:border-accent active:bg-accent/10"
    >
      <svg viewBox="0 0 120 80" className="h-28 w-40 text-accent" aria-hidden>
        <g fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round">
          {players === 1 ? (
            <>
              <circle cx="60" cy="28" r="14" />
              <path d="M34 70a26 26 0 0152 0" />
            </>
          ) : (
            <>
              <circle cx="40" cy="28" r="13" />
              <path d="M16 70a24 24 0 0148 0" />
              <circle cx="84" cy="28" r="13" />
              <path d="M60 70a24 24 0 0148 0" />
            </>
          )}
        </g>
      </svg>

      <span className="text-display text-[clamp(2rem,4vw,3.25rem)] text-text-primary">
        {title}
      </span>
      <span className="text-2xl text-text-secondary">{hint}</span>
    </button>
  )
}

/** The first real choice of the session: play alone, or against someone. */
export function ModeSelectScreen() {
  const setMode = useGameStore((state) => state.setMode)
  const goTo = useGameStore((state) => state.goTo)

  const choose = (mode: GameMode) => () => setMode(mode)

  return (
    <ScreenLayout background="registration" scrim="strong">
      <div className="flex w-full max-w-5xl flex-col items-center gap-12">
        <h1 className="text-display text-[clamp(2.5rem,6vw,5rem)] text-text-primary">
          {t.mode.title}
        </h1>

        <div className="flex w-full flex-col gap-8 md:flex-row">
          <ModeCard
            title={t.mode.solo}
            hint={t.mode.soloHint}
            players={1}
            onSelect={choose('solo')}
          />
          <ModeCard
            title={t.mode.duel}
            hint={t.mode.duelHint}
            players={2}
            onSelect={choose('duel')}
          />
        </div>

        <TouchButton variant="ghost" size="md" onClick={() => goTo('attract')}>
          {t.common.back}
        </TouchButton>
      </div>
    </ScreenLayout>
  )
}
