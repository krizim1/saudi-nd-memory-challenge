import { getPlaceholderSymbol } from '../../theme/placeholders'
import type { CardFace } from '../../game/types'
import { useImageAsset } from '../ThemedBackground/useImageAsset'

interface CardFaceArtProps {
  face: CardFace
}

/**
 * The front of a card.
 *
 * Icons are the shipped content, so that path is the primary one and
 * costs no network request. A face that names an `image` uses it instead
 * and falls back to its icon if the file is missing, which lets a theme
 * be illustrated one card at a time.
 *
 * The Arabic label stays under the artwork in both cases: it is what a
 * player reads to confirm a match when two icons look alike at a glance.
 */
export function CardFaceArt({ face }: CardFaceArtProps) {
  const status = useImageAsset(face.image)
  const showImage = status === 'ready'

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-[4%] overflow-hidden rounded-2xl bg-[#F7F5EE] p-[8%] ring-2 ring-accent/30 ring-inset">
      {showImage ? (
        <img src={face.image} alt={face.alt} className="h-full w-full object-contain" />
      ) : (
        <>
          <svg
            viewBox="0 0 100 100"
            role="img"
            aria-label={face.alt}
            className="h-[58%] w-[58%] shrink-0 text-[#0F6A3F]"
          >
            {getPlaceholderSymbol(face.symbol)}
          </svg>

          <span className="text-display w-full truncate text-center text-[clamp(0.65rem,1.15vw,1.15rem)] leading-tight text-[#06331E]">
            {face.alt}
          </span>
        </>
      )}
    </div>
  )
}
