import { motion } from 'framer-motion'

/**
 * The winner-screen celebration.
 *
 * Two layers, both restrained on purpose: a slowly turning sunburst of
 * hairline rays, and a small set of rising diamonds. No confetti burst,
 * no bloom — the brief asks for premium and architectural, and the thing
 * a winner should be looking at is their own name, not the effect behind
 * it.
 *
 * Positions are fixed rather than random so the composition is the same
 * every time it plays, and so nothing shifts between renders.
 */

const RAY_COUNT = 24

/** Horizontal position (%), delay (s) and drift for each rising mote. */
const MOTES = [
  { left: 8, delay: 0, size: 10 },
  { left: 17, delay: 1.4, size: 7 },
  { left: 26, delay: 0.6, size: 12 },
  { left: 35, delay: 2.1, size: 8 },
  { left: 44, delay: 1.1, size: 9 },
  { left: 56, delay: 0.3, size: 11 },
  { left: 65, delay: 1.8, size: 7 },
  { left: 74, delay: 0.9, size: 10 },
  { left: 83, delay: 2.4, size: 8 },
  { left: 92, delay: 1.6, size: 9 },
]

export function Celebration() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <motion.svg
        viewBox="-100 -100 200 200"
        className="absolute top-1/2 left-1/2 h-[160vmin] w-[160vmin] -translate-x-1/2 -translate-y-1/2 text-accent opacity-[0.09]"
        animate={{ rotate: 360 }}
        transition={{ duration: 90, repeat: Infinity, ease: 'linear' }}
      >
        {Array.from({ length: RAY_COUNT }, (_, index) => (
          <line
            key={index}
            x1="0"
            y1="0"
            x2="0"
            y2="-100"
            stroke="currentColor"
            strokeWidth={index % 2 === 0 ? 0.7 : 0.3}
            transform={`rotate(${(360 / RAY_COUNT) * index})`}
          />
        ))}
      </motion.svg>

      {MOTES.map((mote) => (
        <motion.span
          key={mote.left}
          className="absolute bottom-0 bg-accent"
          style={{
            left: `${mote.left}%`,
            width: mote.size,
            height: mote.size,
            transform: 'rotate(45deg)',
          }}
          initial={{ y: 0, opacity: 0 }}
          animate={{ y: '-85vh', opacity: [0, 0.65, 0] }}
          transition={{
            duration: 7,
            delay: mote.delay,
            repeat: Infinity,
            ease: 'easeOut',
          }}
        />
      ))}
    </div>
  )
}
