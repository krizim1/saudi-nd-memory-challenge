import { config } from '../app/config'
import { ScreenLayout } from '../components/ScreenLayout'
import { TouchButton } from '../components/TouchButton'
import { useLeaderboard } from '../leaderboard/leaderboardContext'
import { t } from '../i18n'
import { formatDuration, formatScore } from '../utils/format'
import { useGameStore } from '../store/gameStore'

/** Rank colour for the podium; everyone else is plain. */
const podium = ['text-accent', 'text-text-primary', 'text-text-primary'] as const

export function LeaderboardScreen() {
  const resetGame = useGameStore((state) => state.resetGame)
  const { entries, loading } = useLeaderboard()

  const shown = entries.slice(0, config.leaderboard.displayLimit)

  return (
    <ScreenLayout background="leaderboard" scrim="strong">
      <div className="flex w-full max-w-4xl flex-col items-center gap-10">
        <h1 className="text-display text-[clamp(2.5rem,6vw,5rem)] text-text-primary">
          {t.leaderboard.title}
        </h1>

        <div className="flex w-full flex-col rounded-3xl border border-white/10 bg-surface">
          <div className="grid grid-cols-[6rem_1fr_10rem_8rem] gap-4 border-b border-white/10 px-10 py-6 text-xl text-text-secondary">
            <span>{t.leaderboard.rank}</span>
            <span>{t.leaderboard.name}</span>
            <span>{t.leaderboard.score}</span>
            <span>{t.leaderboard.time}</span>
          </div>

          {shown.length === 0 ? (
            <p className="px-10 py-20 text-center text-2xl text-text-secondary">
              {loading ? '' : t.leaderboard.empty}
            </p>
          ) : (
            <ul className="flex flex-col">
              {shown.map((entry, index) => (
                <li
                  key={entry.id}
                  className="grid grid-cols-[6rem_1fr_10rem_8rem] items-center gap-4 border-b border-white/5 px-10 py-5 text-2xl last:border-b-0"
                >
                  <span className={`text-display ${podium[index] ?? 'text-text-secondary'}`}>
                    {index + 1}
                  </span>
                  <span className="truncate text-text-primary">{entry.playerName}</span>
                  <span className="text-display text-text-primary">
                    {formatScore(entry.score)}
                  </span>
                  <span className="text-text-secondary">{formatDuration(entry.totalTime)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <TouchButton size="xl" onClick={resetGame}>
          {t.common.newChallenge}
        </TouchButton>
      </div>
    </ScreenLayout>
  )
}
