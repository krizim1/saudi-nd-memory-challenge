import { motion } from 'framer-motion'

import { t } from '../../i18n'
import { formatScore } from '../../utils/format'

interface ScoreCounterProps {
  value: number
}

/**
 * The live score.
 *
 * A brief scale pop on every change is enough to catch the eye of a
 * player whose attention is on the board — a rolling count-up would
 * still be animating when the next pair lands.
 */
export function ScoreCounter({ value }: ScoreCounterProps) {
  return (
    <span className="flex flex-col items-center gap-1 text-lg text-text-secondary">
      {t.level.score}
      <motion.span
        key={value}
        initial={{ scale: 1.25 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 420, damping: 22 }}
        className="text-display text-3xl text-text-primary"
      >
        {formatScore(value)}
      </motion.span>
    </span>
  )
}
