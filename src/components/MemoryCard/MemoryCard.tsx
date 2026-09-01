import { motion } from 'framer-motion'

import { config } from '../../app/config'
import type { Card } from '../../game/types'
import { CardBack } from './CardBack'
import { CardFaceArt } from './CardFaceArt'

interface MemoryCardProps {
  card: Card
  width: number
  height: number
  onTap: (instanceId: string) => void
}

/**
 * One card, flipped with a real 3D rotation.
 *
 * The two halves are stacked in a `preserve-3d` container with their
 * back faces hidden, so the flip is a single composited transform — no
 * layout, no repaint, and steady at 60fps on ordinary event hardware.
 */
export function MemoryCard({ card, width, height, onTap }: MemoryCardProps) {
  const faceUp = card.state === 'revealed' || card.state === 'matched'
  const matched = card.state === 'matched'
  const flipSeconds = config.timing.flipDurationMs / 1000

  return (
    <button
      type="button"
      onClick={() => onTap(card.instanceId)}
      aria-label={faceUp ? card.face.alt : undefined}
      // Matched cards stay on screen but stop being controls.
      disabled={matched}
      style={{ width, height, perspective: 1200 }}
      className="relative rounded-2xl outline-none focus-visible:ring-4 focus-visible:ring-accent"
    >
      <motion.div
        className="relative h-full w-full"
        style={{ transformStyle: 'preserve-3d' }}
        // Rotating the container, not the faces, keeps both halves in the
        // same 3D space and avoids the mid-flip seam.
        animate={{ rotateY: faceUp ? 180 : 0 }}
        transition={{ duration: flipSeconds, ease: [0.4, 0, 0.2, 1] }}
      >
        <div className="absolute inset-0" style={{ backfaceVisibility: 'hidden' }}>
          <CardBack />
        </div>

        <div
          className="absolute inset-0"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <CardFaceArt face={card.face} />
        </div>
      </motion.div>

      {/* Success accent, drawn outside the rotating container so it does
          not flip with the card. */}
      <motion.span
        aria-hidden
        initial={false}
        animate={matched ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="pointer-events-none absolute inset-0 rounded-2xl ring-4 ring-accent"
      />
    </button>
  )
}
