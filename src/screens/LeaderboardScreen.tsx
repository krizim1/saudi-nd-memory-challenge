import { config } from '../app/config'
import { ScreenLayout } from '../components/ScreenLayout'
import { TouchButton } from '../components/TouchButton'
import type { LeaderboardEntry } from '../game/types'
import { t } from '../i18n'
import { useLeaderboard } from '../leaderboard/leaderboardContext'
import { useGameStore } from '../store/gameStore'
import { formatDuration, formatScore } from '../utils/format'

/**
 * The podium takes the first three places; every other player follows in
 * a ranked list that scrolls, so the whole field is visible — not just a
 * top ten.
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

function TrophyIcon() {
  return (
    <svg viewBox="0 0 64 64" aria-hidden className="h-[12vh] w-auto" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 10h24v14a12 12 0 0 1-24 0z" />
      <path d="M20 14h-8v4a8 8 0 0 0 8 8M44 14h8v4a8 8 0 0 1-8 8" />
      <path d="M32 36v10M22 54h20M26 46h12v8H26z" />
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
          isRecent ? 'shadow-[0_0_0_4px_rgba(90,186,28,0.35),0_0_40px_rgba(90,186,28,0.45)]' : ''
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
            <span className="absolute -top-[8vh] text-accent drop-shadow-[0_2px_8px_rgba(90,186,28,0.6)]">
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

/** Matches as a share of attempts, or a dash for rows recorded before it was tracked. */
function formatAccuracy(entry: LeaderboardEntry): string {
  if (!entry.attempts || entry.matches === undefined) return '—'
  return `${Math.round((entry.matches / entry.attempts) * 100)}%`
}

/** Shared column template, so the header lines up with every row. */
const listColumns = 'grid grid-cols-[4.5rem_minmax(0,1fr)_7rem_7rem_9rem] items-center gap-4'

interface RankRowProps {
  rank: number
  entry: LeaderboardEntry
  isRecent: boolean
}

function RankRow({ rank, entry, isRecent }: RankRowProps) {
  return (
    <li
      className={`${listColumns} min-h-[5.4vh] rounded-2xl border px-5 py-[0.7vh] ${
        isRecent
          ? 'border-accent bg-accent/15 shadow-[0_0_24px_rgba(90,186,28,0.3)]'
          : 'border-white/10 bg-surface'
      }`}
    >
      <span className="text-display flex h-[4vh] min-h-8 w-[4vh] min-w-8 items-center justify-center rounded-full border border-accent/50 bg-primary-deep text-[clamp(1rem,2.1vh,1.5rem)] leading-none text-accent">
        {rank}
      </span>

      <span className="flex min-w-0 items-center gap-3">
        <span className="truncate text-[clamp(1.1rem,2.5vh,1.8rem)] leading-tight text-text-primary">
          {entry.playerName}
        </span>
        {isRecent && (
          <span className="shrink-0 rounded-full bg-accent px-3 py-0.5 text-[clamp(0.8rem,1.6vh,1.1rem)] font-bold text-text-inverse">
            {t.leaderboard.latest}
          </span>
        )}
      </span>

      <span className="text-center text-[clamp(0.95rem,2vh,1.35rem)] text-text-secondary">
        {formatAccuracy(entry)}
      </span>

      <span className="flex items-center justify-center gap-1.5 text-[clamp(0.9rem,1.9vh,1.3rem)] leading-none text-text-secondary">
        <ClockIcon />
        {formatDuration(entry.totalTime)}
      </span>

      <span className="text-display text-end text-[clamp(1.2rem,2.8vh,2rem)] leading-none text-text-primary">
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

  return (
    <ScreenLayout background="leaderboard" scrim="strong">
      <div className="flex h-full min-h-0 w-full max-w-[1500px] flex-col items-center justify-center gap-[1.8vh]">
        <header className="flex shrink-0 flex-col items-center gap-[0.8vh] text-center">
          <span className="text-display text-[clamp(0.95rem,2vh,1.4rem)] tracking-[0.35em] text-accent">
            {t.leaderboard.subtitle}
          </span>
          <h1 className="text-display text-[clamp(2rem,5.6vh,4rem)] leading-tight text-text-primary">
            {t.leaderboard.title}
          </h1>
        </header>

        {shown.length === 0 ? (
          <div className="flex w-full max-w-3xl flex-col items-center gap-4 rounded-3xl border border-accent/30 bg-surface px-10 py-[9vh] text-center">
            <span className="text-accent opacity-80">
              <TrophyIcon />
            </span>
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
              className="flex w-full max-w-5xl shrink-0 items-end gap-[2vw] pt-[6.5vh]"
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
              <section
                aria-label={t.leaderboard.allPlayers}
                className="flex min-h-0 w-full max-w-6xl flex-1 flex-col gap-[0.8vh]"
              >
                <div className={`${listColumns} px-5 text-[clamp(0.85rem,1.8vh,1.15rem)] text-text-secondary`}>
                  <span>{t.leaderboard.rank}</span>
                  <span>{t.leaderboard.allPlayers}</span>
                  <span className="text-center">{t.leaderboard.accuracy}</span>
                  <span className="text-center">{t.leaderboard.time}</span>
                  <span className="text-end">{t.leaderboard.score}</span>
                </div>

                {/* Scrolls on its own so the podium and buttons stay put. */}
                <ul className="flex min-h-0 flex-1 touch-pan-y flex-col gap-[0.8vh] overflow-y-auto overscroll-contain pe-1">
                  {rest.map((entry, index) => (
                    <RankRow
                      key={entry.id}
                      rank={PODIUM_SIZE + index + 1}
                      entry={entry}
                      isRecent={recentIds.has(entry.id)}
                    />
                  ))}
                </ul>
              </section>
            )}
          </>
        )}

        <div className="flex shrink-0 items-center gap-8">
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
