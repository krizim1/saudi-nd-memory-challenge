import { config } from '../app/config'
import { Emblem96 } from '../components/Emblem96'
import { ScreenLayout } from '../components/ScreenLayout'
import { TouchButton } from '../components/TouchButton'
import type { LeaderboardEntry } from '../game/types'
import { t } from '../i18n'
import { useLeaderboard } from '../leaderboard/leaderboardContext'
import { useGameStore } from '../store/gameStore'
import { formatDuration, formatScore } from '../utils/format'

/**
 * The podium takes the first three places; everyone after them goes into
 * a two-column ranked list. Splitting it this way is what lets ten rows
 * fit a 1080-pixel-high screen without shrinking any of them.
 */
const PODIUM_SIZE = 3

interface PodiumStyle {
  /** Gradient used for the frame and the medal. */
  metal: string
  /** Ink used on top of the medal. */
  medalInk: string
  /** Visual slot in the podium row: champion in the middle. */
  order: string
  /** Extra height so first place stands above its neighbours. */
  lift: string
}

const podiumStyles: Record<number, PodiumStyle> = {
  1: {
    metal: 'from-[#F7E2A0] via-[#D8B25E] to-[#8A6A22]',
    medalInk: 'text-[#4A3608]',
    order: 'order-2',
    lift: 'pb-[2.4vh]',
  },
  2: {
    metal: 'from-[#F1F3F5] via-[#B8C0C7] to-[#7B858E]',
    medalInk: 'text-[#2B3238]',
    order: 'order-1',
    lift: '',
  },
  3: {
    metal: 'from-[#F0BC8E] via-[#C98A56] to-[#8A5530]',
    medalInk: 'text-[#3E2410]',
    order: 'order-3',
    lift: '',
  },
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="h-[1em] w-[1em] shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  )
}

function CrownIcon() {
  return (
    <svg viewBox="0 0 80 50" aria-hidden className="h-[3.8vh] w-auto" fill="currentColor">
      <path d="M8 44 L14 14 L28 28 L40 6 L52 28 L66 14 L72 44 Z" />
      <rect x="8" y="44" width="64" height="5" rx="2.5" />
    </svg>
  )
}

interface PodiumCardProps {
  rank: number
  entry: LeaderboardEntry | undefined
  isRecent: boolean
}

function PodiumCard({ rank, entry, isRecent }: PodiumCardProps) {
  const style = podiumStyles[rank]!
  const first = rank === 1

  return (
    <div className={`${style.order} ${style.lift} flex min-w-0 flex-1 flex-col justify-end`}>
      <div
        className={`rounded-[1.75rem] bg-gradient-to-b p-[3px] ${style.metal} ${entry ? '' : 'opacity-30'} ${
          isRecent ? 'shadow-[0_0_0_4px_rgba(216,178,94,0.35),0_0_40px_rgba(216,178,94,0.45)]' : ''
        }`}
      >
        <div className="relative flex flex-col items-center gap-[0.9vh] rounded-[calc(1.75rem-3px)] bg-primary-deep/95 px-6 pt-[4.4vh] pb-[2vh] text-center">
          {/* The medal sits on the frame, half outside the card. */}
          <span
            className={`text-display absolute -top-[3.2vh] flex h-[6.4vh] w-[6.4vh] items-center justify-center rounded-full bg-gradient-to-b text-[clamp(1.5rem,3.6vh,2.5rem)] shadow-lg ${style.metal} ${style.medalInk}`}
          >
            {rank}
          </span>

          {first && (
            <span className="absolute -top-[8vh] text-accent drop-shadow-[0_2px_8px_rgba(216,178,94,0.6)]">
              <CrownIcon />
            </span>
          )}

          {entry ? (
            <>
              <span className="text-display w-full truncate text-[clamp(1.3rem,3.1vh,2.2rem)] leading-tight text-text-primary">
                {entry.playerName}
              </span>
              <span className="text-display text-[clamp(2rem,5.6vh,3.8rem)] leading-none text-accent">
                {formatScore(entry.score)}
              </span>
              <span className="flex items-center gap-2 text-[clamp(0.95rem,2.1vh,1.4rem)] leading-none text-text-secondary">
                <ClockIcon />
                {formatDuration(entry.totalTime)}
              </span>
              {isRecent && (
                <span className="rounded-full bg-accent px-4 py-0.5 text-[clamp(0.85rem,1.8vh,1.2rem)] font-bold text-text-inverse">
                  {t.leaderboard.latest}
                </span>
              )}
            </>
          ) : (
            <span className="py-[3vh] text-[clamp(2rem,5vh,3.5rem)] text-text-secondary">—</span>
          )}
        </div>
      </div>
    </div>
  )
}

interface RankRowProps {
  rank: number
  entry: LeaderboardEntry
  isRecent: boolean
}

function RankRow({ rank, entry, isRecent }: RankRowProps) {
  return (
    <li
      className={`flex h-[5.6vh] min-h-11 items-center gap-4 rounded-2xl border px-5 ${
        isRecent
          ? 'border-accent bg-accent/15 shadow-[0_0_24px_rgba(216,178,94,0.3)]'
          : 'border-white/10 bg-surface'
      }`}
    >
      <span className="text-display flex h-[4vh] min-h-8 w-[4vh] min-w-8 shrink-0 items-center justify-center rounded-full border border-accent/50 bg-primary-deep text-[clamp(1rem,2.1vh,1.5rem)] leading-none text-accent">
        {rank}
      </span>

      <span className="min-w-0 flex-1 truncate text-[clamp(1.1rem,2.5vh,1.8rem)] leading-tight text-text-primary">
        {entry.playerName}
      </span>

      {isRecent && (
        <span className="shrink-0 rounded-full bg-accent px-3 py-0.5 text-[clamp(0.8rem,1.6vh,1.1rem)] font-bold text-text-inverse">
          {t.leaderboard.latest}
        </span>
      )}

      <span className="flex shrink-0 items-center gap-1.5 text-[clamp(0.9rem,1.9vh,1.3rem)] leading-none text-text-secondary">
        <ClockIcon />
        {formatDuration(entry.totalTime)}
      </span>

      <span className="text-display w-[6.5ch] shrink-0 text-end text-[clamp(1.2rem,2.8vh,2rem)] leading-none text-text-primary">
        {formatScore(entry.score)}
      </span>
    </li>
  )
}

export function LeaderboardScreen() {
  const resetGame = useGameStore((state) => state.resetGame)
  const { entries, loading, recentIds } = useLeaderboard()

  const shown = entries.slice(0, config.leaderboard.displayLimit)
  const podium = shown.slice(0, PODIUM_SIZE)
  const rest = shown.slice(PODIUM_SIZE)

  // Two columns filled top to bottom, right column first in RTL.
  const half = Math.ceil(rest.length / 2)
  const columns = [rest.slice(0, half), rest.slice(half)].filter((column) => column.length > 0)

  return (
    <ScreenLayout background="leaderboard" scrim="strong">
      <div className="flex h-full w-full max-w-[1500px] flex-col items-center justify-center gap-[2vh]">
        <header className="flex flex-col items-center gap-[0.8vh] text-center">
          <span className="text-display text-[clamp(0.95rem,2vh,1.4rem)] tracking-[0.35em] text-accent">
            {t.leaderboard.subtitle}
          </span>
          <h1 className="text-display text-[clamp(2rem,5.6vh,4rem)] leading-tight text-text-primary">
            {t.leaderboard.title}
          </h1>
        </header>

        {shown.length === 0 ? (
          <div className="flex w-full max-w-3xl flex-col items-center gap-4 rounded-3xl border border-accent/30 bg-surface px-10 py-[9vh] text-center">
            <Emblem96 aria-hidden role="presentation" className="h-[12vh] w-auto opacity-70" />
            <p className="text-display text-[clamp(1.5rem,3.4vh,2.4rem)] text-text-primary">
              {loading ? '' : t.leaderboard.empty}
            </p>
            {!loading && (
              <p className="text-[clamp(1rem,2.2vh,1.5rem)] text-text-secondary">
                {t.leaderboard.emptyHint}
              </p>
            )}
          </div>
        ) : (
          <>
            <section
              aria-label={t.leaderboard.title}
              className="flex w-full max-w-5xl items-end gap-[2vw] pt-[6.5vh]"
            >
              {[1, 2, 3].map((rank) => (
                <PodiumCard
                  key={rank}
                  rank={rank}
                  entry={podium[rank - 1]}
                  isRecent={podium[rank - 1] ? recentIds.has(podium[rank - 1]!.id) : false}
                />
              ))}
            </section>

            {rest.length > 0 && (
              <section className="grid w-full max-w-6xl grid-cols-2 gap-x-[2vw] gap-y-0">
                {columns.map((column, columnIndex) => (
                  <ul key={columnIndex} className="flex flex-col gap-[0.9vh]">
                    {column.map((entry, rowIndex) => {
                      const rank = PODIUM_SIZE + columnIndex * half + rowIndex + 1
                      return (
                        <RankRow
                          key={entry.id}
                          rank={rank}
                          entry={entry}
                          isRecent={recentIds.has(entry.id)}
                        />
                      )
                    })}
                  </ul>
                ))}
              </section>
            )}
          </>
        )}

        <div className="flex items-center gap-8">
          <TouchButton size="xl" onClick={resetGame}>
            {t.common.newChallenge}
          </TouchButton>
          {entries.length > 0 && (
            <span className="text-[clamp(1rem,2.2vh,1.4rem)] text-text-secondary">
              {t.leaderboard.participants(entries.length)}
            </span>
          )}
        </div>
      </div>
    </ScreenLayout>
  )
}
