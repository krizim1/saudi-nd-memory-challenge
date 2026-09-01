import { useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

import { LevelIndicator } from '../components/LevelIndicator'
import { MemoryBoard } from '../components/MemoryBoard'
import { ScoreCounter } from '../components/ScoreCounter'
import { ThemedBackground } from '../components/ThemedBackground'
import { Timer } from '../components/Timer'
import { currentScore, toLevelResult, type EngineState } from '../game/engine'
import type { LevelConfig } from '../game/types'
import { useCurrentLevel } from '../hooks/useCurrentLevel'
import { useLevelEngine } from '../hooks/useLevelEngine'
import { t } from '../i18n'
import { useTheme } from '../theme/themeContext'
import { selectActivePlayer, useGameStore } from '../store/gameStore'

interface LevelSessionProps {
  level: LevelConfig
}

/**
 * One level, start to finish.
 *
 * Split out from `GameScreen` so the engine is created by mounting and
 * destroyed by unmounting: a fresh level is a fresh component, which
 * leaves no room for state from the previous one to leak into it.
 */
function LevelSession({ level }: LevelSessionProps) {
  const theme = useTheme()
  const player = useGameStore(selectActivePlayer)
  const currentLevelIndex = useGameStore((state) => state.currentLevelIndex)
  const completeLevel = useGameStore((state) => state.completeLevel)

  const handleFinish = useCallback(
    (engine: EngineState) => {
      completeLevel(toLevelResult(engine))
    },
    [completeLevel],
  )

  const { state, flip } = useLevelEngine(level, theme.cards, handleFinish)

  return (
    <div className="flex h-full w-full flex-col px-10 py-8">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-x-8 gap-y-4">
        <div className="flex flex-col items-start gap-2">
          <LevelIndicator currentIndex={currentLevelIndex} />
          <span className="text-display text-2xl text-text-primary">{player?.name}</span>
        </div>

        <Timer remaining={state.timeRemaining} total={level.timeLimit} />

        <div className="flex items-center gap-6 text-lg text-text-secondary sm:gap-10">
          <span className="flex flex-col items-center gap-1">
            {t.level.pairs}
            <span className="text-display text-3xl text-text-primary">
              {state.matches} / {level.pairs}
            </span>
          </span>

          <span className="flex flex-col items-center gap-1">
            {t.level.streak}
            <span
              className={`text-display text-3xl ${
                state.streak > 1 ? 'text-accent' : 'text-text-primary'
              }`}
            >
              {state.streak}
            </span>
          </span>

          <ScoreCounter value={currentScore(state)} />
        </div>
      </header>

      <MemoryBoard level={level} cards={state.cards} onCardTap={flip} />

      {/* The clock running out is the one outcome a player can miss, so
          it is announced rather than left to the screen change. */}
      <AnimatePresence>
        {state.status === 'timeout' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/55"
          >
            <span className="text-display text-[clamp(3rem,9vw,7rem)] text-danger">
              {t.level.timeUp}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function GameScreen() {
  const level = useCurrentLevel()
  const activeSlot = useGameStore((state) => state.activeSlot)

  if (!level) return null

  return (
    <ThemedBackground slot="gameplay" scrim="strong">
      {/* Keyed by level *and* player: player two's level 1 is a new deck. */}
      <LevelSession key={`${activeSlot}-${level.id}`} level={level} />
    </ThemedBackground>
  )
}
