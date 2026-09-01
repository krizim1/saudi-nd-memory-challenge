import { config } from '../../app/config'
import { t } from '../../i18n'

interface TimerProps {
  /** Seconds left, fractional. */
  remaining: number
  /** The level's full allowance, used for the progress bar. */
  total: number
}

/**
 * The countdown, as a number and a bar.
 *
 * The bar is what a player reads across the room; the number is what
 * they read when it matters. Both switch to the danger colour under the
 * configured warning threshold.
 */
export function Timer({ remaining, total }: TimerProps) {
  const seconds = Math.ceil(Math.max(0, remaining))
  const warning = seconds <= config.timing.timerWarningSeconds
  const fraction = total > 0 ? Math.max(0, Math.min(1, remaining / total)) : 0

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-baseline gap-3">
        <span className="text-lg text-text-secondary">{t.level.timeLeft}</span>
        <span
          className={`text-display text-[clamp(2rem,3.5vw,3.25rem)] leading-none ${
            warning ? 'text-danger' : 'text-accent'
          }`}
        >
          {seconds}
        </span>
      </div>

      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={seconds}
        className="h-2 w-56 overflow-hidden rounded-full bg-white/15"
      >
        <div
          className={`h-full rounded-full transition-[width] duration-200 ease-linear ${
            warning ? 'bg-danger' : 'bg-accent'
          }`}
          style={{ width: `${fraction * 100}%` }}
        />
      </div>
    </div>
  )
}
