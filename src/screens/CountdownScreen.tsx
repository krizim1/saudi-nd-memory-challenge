import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'

import { config } from '../app/config'
import { useAudio } from '../audio/audioContext'
import { ThemedBackground } from '../components/ThemedBackground'
import { t } from '../i18n'
import { useGameStore } from '../store/gameStore'

/**
 * Counts `countdownSteps` down to zero, shows the go word, then hands
 * over to the board. A single interval drives the whole sequence so the
 * screen can never leave two timers running against each other.
 */
export function CountdownScreen() {
  const beginLevel = useGameStore((state) => state.beginLevel)
  const { play } = useAudio()
  const [step, setStep] = useState(config.timing.countdownSteps)

  useEffect(() => {
    const interval = window.setInterval(() => {
      setStep((current) => current - 1)
    }, config.timing.countdownStepMs)

    return () => window.clearInterval(interval)
  }, [])

  useEffect(() => {
    if (step >= 0) play('countdown')
  }, [step, play])

  useEffect(() => {
    // -1 is the tick after the go word has had its full beat on screen.
    if (step >= 0) return
    beginLevel()
  }, [step, beginLevel])

  const label = step > 0 ? String(step) : t.countdown.go

  return (
    <ThemedBackground slot="gameplay" scrim="strong">
      <div className="flex h-full w-full items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.span
            key={step}
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.35, opacity: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="text-display text-[clamp(6rem,26vw,22rem)] leading-none text-text-primary"
          >
            {label}
          </motion.span>
        </AnimatePresence>
      </div>
    </ThemedBackground>
  )
}
