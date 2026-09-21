import { getPlaceholderSymbol } from '../../theme/placeholders'
import type { CardFace } from '../../game/types'
import { useImageAsset } from '../ThemedBackground/useImageAsset'

interface CardFaceArtProps {
  face: CardFace
}

/**
 * The front of a card.
 *
 * Every face is illustrated artwork, drawn to fill the whole card with a
 * gold inner frame and the Arabic label on a dark ribbon at the foot —
 * the label is what a player reads to confirm a match when two pictures
 * look alike at a glance.
 *
 * If the artwork is missing or still loading, the card shows its icon on
 * a light ground instead, so a bad asset costs one card its picture and
 * never leaves a hole in the board.
 */
export function CardFaceArt({ face }: CardFaceArtProps) {
  const status = useImageAsset(face.image)

  if (status === 'ready') {
    return (
      <div className="absolute inset-0 overflow-hidden rounded-2xl bg-primary-deep ring-2 ring-accent/70 ring-inset">
        <img src={face.image} alt="" draggable={false} className="absolute inset-0 h-full w-full object-cover" />

        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-[34%] bg-gradient-to-t from-black/80 via-black/45 to-transparent"
        />
        <div aria-hidden className="pointer-events-none absolute inset-[3%] rounded-xl border border-accent/60" />

        <span className="text-display absolute inset-x-0 bottom-[6%] truncate px-[8%] text-center text-[clamp(0.8rem,1.4vw,1.4rem)] leading-tight text-[#FBF3D9] [text-shadow:0_1px_6px_rgba(0,0,0,0.7)]">
          {face.alt}
        </span>
      </div>
    )
  }

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-[4%] overflow-hidden rounded-2xl bg-[#F7F5EE] p-[8%] ring-2 ring-accent/30 ring-inset">
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
    </div>
  )
}
