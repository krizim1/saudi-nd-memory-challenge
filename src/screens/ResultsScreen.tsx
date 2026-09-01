import { useEffect, useRef, type ReactNode } from 'react'

import { Celebration } from '../components/Celebration'
import { ScreenLayout } from '../components/ScreenLayout'
import { TouchButton } from '../components/TouchButton'
import { useLeaderboard } from '../leaderboard/leaderboardContext'
import { t } from '../i18n'
import type { Player } from '../game/types'
import { formatDuration, formatScore } from '../utils/format'
import { selectIsSolo, useGameStore } from '../store/gameStore'
import { useSettingsStore } from '../store/settingsStore'

function Metric({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-lg text-text-secondary">{label}</span>
      <span className="text-display text-3xl text-text-primary">{children}</span>
    </div>
  )
}

function MetricRow({ children }: { children: ReactNode }) {
  return (
    <div className="flex w-full justify-around rounded-3xl border border-white/10 bg-surface px-10 py-8">
      {children}
    </div>
  )
}

function Side({ player, highlight }: { player: Player | undefined; highlight: boolean }) {
  if (!player) return null

  return (
    <div
      className={[
        'flex flex-1 flex-col items-center gap-6 rounded-3xl border p-12 transition-colors',
        highlight ? 'border-accent/60 bg-accent/10' : 'border-white/10 bg-surface',
      ].join(' ')}
    >
      <span className="text-display text-[clamp(1.75rem,3.5vw,3rem)] text-text-primary">
        {player.name}
      </span>
      <span
        className={`text-display text-[clamp(3rem,8vw,7rem)] leading-none ${
          highlight ? 'text-accent' : 'text-text-primary'
        }`}
      >
        {formatScore(player.totalScore)}
      </span>
    </div>
  )
}

/** One player's own result — no comparison, because there is nobody to compare to. */
function SoloResult({ player }: { player: Player }) {
  return (
    <>
      <Celebration />

      <div className="relative flex w-full max-w-4xl flex-col items-center gap-10">
        <h1 className="text-display text-[clamp(2rem,5vw,4rem)] text-text-primary">
          {t.results.yourScore}
        </h1>

        <div className="flex flex-col items-center gap-4 rounded-3xl border border-accent/40 bg-accent/10 px-16 py-12">
          <span className="text-display text-[clamp(1.75rem,3.5vw,3rem)] text-text-primary">
            {player.name}
          </span>
          <span className="text-display text-[clamp(3.5rem,10vw,8rem)] leading-none text-accent">
            {formatScore(player.totalScore)}
          </span>
        </div>

        <MetricRow>
          <Metric label={t.results.matches}>{player.matches}</Metric>
          <Metric label={t.results.bestStreak}>{player.bestStreak}</Metric>
          <Metric label={t.results.totalTime}>{formatDuration(player.totalTime)}</Metric>
          <Metric label={t.results.totalAttempts}>{player.attempts}</Metric>
        </MetricRow>
      </div>
    </>
  )
}

/**
 * The end of a challenge.
 *
 * In a duel this is the head-to-head reveal, showing only the four
 * metrics the brief calls useful; in solo there is nothing to compare
 * against, so the player's own run is the whole story.
 *
 * Either way, this is where the round is recorded — it is the moment the
 * result becomes final.
 */
export function ResultsScreen() {
  const [one, two] = useGameStore((state) => state.players)
  const outcome = useGameStore((state) => state.outcome)
  const solo = useGameStore(selectIsSolo)
  const showWinner = useGameStore((state) => state.showWinner)
  const showLeaderboard = useGameStore((state) => state.showLeaderboard)
  const resetGame = useGameStore((state) => state.resetGame)
  const leaderboardEnabled = useSettingsStore((state) => state.showLeaderboard)
  const { submit } = useLeaderboard()

  // Guarded against a re-render (or React's development double-mount)
  // recording the same round twice.
  const recorded = useRef(false)
  useEffect(() => {
    if (recorded.current || !one) return
    recorded.current = true
    void submit(two ? [one, two] : [one])
  }, [one, two, submit])

  // Solo skips the winner screen — there is no winner to announce.
  const advance = solo
    ? leaderboardEnabled
      ? showLeaderboard
      : resetGame
    : showWinner

  const bestStreak = Math.max(one?.bestStreak ?? 0, two?.bestStreak ?? 0)
  const fastestTime = Math.min(one?.totalTime ?? 0, two?.totalTime ?? 0)
  const totalAttempts = (one?.attempts ?? 0) + (two?.attempts ?? 0)

  return (
    <ScreenLayout background="winner" scrim="strong">
      {solo && one ? (
        <SoloResult player={one} />
      ) : (
        <div className="flex w-full max-w-6xl flex-col items-center gap-12">
          <h1 className="text-display text-[clamp(2rem,5vw,4rem)] text-text-primary">
            {t.results.title}
          </h1>

          <div className="flex w-full items-stretch gap-8">
            <Side player={one} highlight={outcome?.winner?.id === one?.id} />
            <div className="text-display flex items-center px-4 text-[clamp(2rem,5vw,4rem)] text-accent">
              {outcome?.isDraw ? t.results.draw : t.common.vs}
            </div>
            <Side player={two} highlight={outcome?.winner?.id === two?.id} />
          </div>

          <MetricRow>
            <Metric label={t.results.scoreDifference}>
              {formatScore(outcome?.scoreDifference ?? 0)}
            </Metric>
            <Metric label={t.results.bestStreak}>{bestStreak}</Metric>
            <Metric label={t.results.fastestTime}>{formatDuration(fastestTime)}</Metric>
            <Metric label={t.results.totalAttempts}>{totalAttempts}</Metric>
          </MetricRow>
        </div>
      )}

      <div className="relative mt-10">
        <TouchButton size="xl" onClick={advance}>
          {solo && leaderboardEnabled ? t.leaderboard.title : t.common.continue}
        </TouchButton>
      </div>
    </ScreenLayout>
  )
}
