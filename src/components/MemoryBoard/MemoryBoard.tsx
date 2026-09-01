import { useRef } from 'react'

import type { Card, LevelConfig } from '../../game/types'
import { MemoryCard } from '../MemoryCard'
import { useBoardMetrics } from './useBoardMetrics'

interface MemoryBoardProps {
  level: LevelConfig
  cards: readonly Card[]
  onCardTap: (instanceId: string) => void
}

/**
 * Lays out one level's grid at the largest size that fits the space.
 *
 * The board is presentation only: it never decides whether a tap is
 * legal. Every tap goes to the engine, which is the single place that
 * knows about locking — so there is no second, divergent copy of the
 * rules living in the UI.
 */
export function MemoryBoard({ level, cards, onCardTap }: MemoryBoardProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const metrics = useBoardMetrics(containerRef, level.rows, level.columns)

  return (
    <div ref={containerRef} className="flex min-h-0 w-full flex-1 items-center justify-center">
      <div
        className="grid"
        style={{
          gridTemplateColumns: `repeat(${level.columns}, ${metrics.cardWidth}px)`,
          gridTemplateRows: `repeat(${level.rows}, ${metrics.cardHeight}px)`,
          gap: metrics.gap,
        }}
      >
        {cards.map((card) => (
          <MemoryCard
            key={card.instanceId}
            card={card}
            width={metrics.cardWidth}
            height={metrics.cardHeight}
            onTap={onCardTap}
          />
        ))}
      </div>
    </div>
  )
}
