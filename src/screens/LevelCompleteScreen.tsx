import { motion } from 'framer-motion'

import { config } from '../app/config'
import { ScreenLayout } from '../components/ScreenLayout'
import { TouchButton } from '../components/TouchButton'
import { useAutoAdvance } from '../hooks/useAutoAdvance'
import { isLastLevel } from '../game/levels'
import { t } from '../i18n'
import { formatScore } from '../utils/format'
import { selectLastLevelResult, selectLevelNumber, useGameStore } from '../store/gameStore'

/**
 * The screen reveals in three beats — the level is over, here is what it
 * was worth, now get ready — rather than dropping all three on the player
 * at once (section 23).
 */
const reveal = {
  hidden: { opacity: 0, y: 14 },
  shown: { opacity: 1, y: 0 },
}

const sequence = {
  shown: { transition: { staggerChildren: 0.45, delayChildren: 0.15 } },
}

function BreakdownRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between gap-10 text-[clamp(1.1rem,2.3vh,1.5rem)]">
      <span className="text-text-secondary">{label}</span>
      <span className="text-display text-text-primary">+{formatScore(value)}</span>
    </div>
  )
}

/**
 * A short beat between levels: praise, where the points came from, then
 * what comes next.
 *
 * Showing the breakdown here — rather than only a total — is what makes
 * the time bonus legible as something worth playing for on the next
 * level.
 */
export function LevelCompleteScreen() {
  const levelNumber = useGameStore(selectLevelNumber)
  const currentLevelIndex = useGameStore((state) => state.currentLevelIndex)
  const continueAfterLevel = useGameStore((state) => state.continueAfterLevel)
  const result = useGameStore(selectLastLevelResult)

  const wasLast = isLastLevel(currentLevelIndex)

  useAutoAdvance(
    continueAfterLevel,
    config.timing.levelCompleteAutoAdvanceMs,
    config.timing.levelCompleteAutoAdvance,
  )

  return (
    <ScreenLayout background="gameplay" scrim="strong">
      <motion.div
        variants={sequence}
        initial="hidden"
        animate="shown"
        className="flex flex-col items-center gap-6 text-center"
      >
        <motion.h1
          variants={reveal}
          className="text-display text-[clamp(2.5rem,7vw,5.5rem)] text-accent"
        >
          {t.levelComplete.wellDone}
        </motion.h1>

        <motion.p variants={reveal} className="text-display text-3xl text-text-primary">
          {t.levelComplete.completed} — {t.level.label(levelNumber)}
        </motion.p>

        {result && (
          <motion.div
            variants={reveal}
            className="flex w-full min-w-[30rem] flex-col gap-2 rounded-3xl border border-white/10 bg-surface px-10 py-6"
          >
            <BreakdownRow label={t.levelComplete.matchScore} value={result.breakdown.matchScore} />
            <BreakdownRow label={t.levelComplete.streakBonus} value={result.breakdown.streakBonus} />
            <BreakdownRow label={t.levelComplete.accuracyBonus} value={result.breakdown.accuracyBonus} />
            <BreakdownRow label={t.levelComplete.speedBonus} value={result.breakdown.speedBonus} />
            <BreakdownRow label={t.levelComplete.timeBonus} value={result.breakdown.timeBonus} />
            <BreakdownRow label={t.levelComplete.clearBonus} value={result.breakdown.clearBonus} />

            {result.breakdown.multiplier !== 1 && (
              <div className="mt-1 flex items-center justify-between gap-10 border-t border-white/10 pt-3 text-[clamp(1.1rem,2.3vh,1.5rem)]">
                <span className="text-text-secondary">
                  {t.levelComplete.subtotal} · {t.levelComplete.multiplier(result.breakdown.multiplier)}
                </span>
                <span className="text-display text-text-primary">
                  {formatScore(result.breakdown.subtotal)} ×{result.breakdown.multiplier}
                </span>
              </div>
            )}

            <div className="mt-3 flex items-center justify-between gap-10 border-t border-white/15 pt-4">
              <span className="text-display text-2xl text-accent">
                {t.levelComplete.levelTotal}
              </span>
              <span className="text-display text-[clamp(2rem,4vw,3.5rem)] leading-none text-accent">
                {formatScore(result.breakdown.total)}
              </span>
            </div>
          </motion.div>
        )}

        {!wasLast && (
          <motion.p variants={reveal} className="text-2xl text-text-secondary">
            {t.levelComplete.getReadyNext}
          </motion.p>
        )}

        {!config.timing.levelCompleteAutoAdvance && (
          <TouchButton size="xl" onClick={continueAfterLevel}>
            {t.common.continue}
          </TouchButton>
        )}
      </motion.div>
    </ScreenLayout>
  )
}
