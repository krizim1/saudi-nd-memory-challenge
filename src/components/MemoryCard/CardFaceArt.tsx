import { getPlaceholderSymbol } from '../../theme/placeholders'
import type { CardFace } from '../../game/types'
import { useImageAsset } from '../ThemedBackground/useImageAsset'

interface CardFaceArtProps {
  face: CardFace
}

/**
 * The front of a card.
 *
 * Laid out the way the identity guideline presents its traits: the square
 * artwork on the deep teal ground, framed in the trait's own colour, with
 * the trait's phrase in a strip beneath — that label is what a player
 * reads to confirm a match when two tiles share a colour.
 *
 * If the artwork is missing or still loading, the card shows its drawn
 * icon instead, so a bad asset costs one card its picture and never
 * leaves a hole in the board.
 */
export function CardFaceArt({ face }: CardFaceArtProps) {
  const status = useImageAsset(face.image)
  const tint = face.color ?? 'var(--color-primary)'

  return (
    <div
      className="absolute inset-0 flex flex-col overflow-hidden rounded-2xl bg-background p-[5%]"
      style={{ boxShadow: `inset 0 0 0 3px ${tint}` }}
    >
      <div className="relative aspect-square w-full shrink-0 overflow-hidden rounded-lg">
        {status === 'ready' ? (
          <img src={face.image} alt="" draggable={false} className="h-full w-full object-cover" />
        ) : (
          <svg
            viewBox="0 0 100 100"
            role="img"
            aria-label={face.alt}
            className="h-full w-full p-[14%] text-white"
            style={{ backgroundColor: tint }}
          >
            {getPlaceholderSymbol(face.symbol)}
          </svg>
        )}
      </div>

      <span
        className="text-display mt-[5%] flex min-h-0 flex-1 items-center justify-center truncate rounded-md px-[4%] text-center text-[clamp(0.7rem,1.25vw,1.3rem)] leading-tight text-white"
        style={{ backgroundColor: tint }}
      >
        {face.alt}
      </span>
    </div>
  )
}
