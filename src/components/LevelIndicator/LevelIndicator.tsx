import { levelCount } from '../../game/levels'
import { t } from '../../i18n'

interface LevelIndicatorProps {
  /** Zero-based position of the level in progress. */
  currentIndex: number
}

/** Shows how far through the three levels the player is. */
export function LevelIndicator({ currentIndex }: LevelIndicatorProps) {
  return (
    <div className="flex items-center gap-4">
      <span className="text-display text-2xl text-text-primary">
        {t.level.label(currentIndex + 1)}
      </span>
      <div className="flex gap-2">
        {Array.from({ length: levelCount }, (_, index) => (
          <span
            key={index}
            className={[
              'h-3 w-10 rounded-full transition-colors duration-300',
              index < currentIndex
                ? 'bg-accent'
                : index === currentIndex
                  ? 'bg-accent/70'
                  : 'bg-white/15',
            ].join(' ')}
          />
        ))}
      </div>
    </div>
  )
}
