/**
 * Board sizing arithmetic, kept pure so the layout can be verified at
 * real screen sizes without a browser.
 */

export interface BoardMetrics {
  cardWidth: number
  cardHeight: number
  gap: number
  boardWidth: number
  boardHeight: number
}

/** Playing-card proportions; cards read as cards at any board size. */
export const CARD_ASPECT = 3 / 4
/** Gap as a share of card width, clamped so it never dominates or vanishes. */
const GAP_RATIO = 0.12
const MIN_GAP = 10
const MAX_GAP = 28
/** The brief's floor: a card must stay comfortably tappable. */
export const MIN_CARD_WIDTH = 96

/**
 * Sizes the grid to the space it actually has.
 *
 * Both axes are solved independently and the smaller card wins, which is
 * what keeps a 5×4 board fully visible on 1920×1080 without scrolling and
 * still legible on 1366×768 or in portrait.
 *
 * `MIN_CARD_WIDTH` is a floor, not a fit: on a screen genuinely too small
 * for the grid the board will overflow rather than shrink cards below
 * something a finger can hit. That is the deliberate trade — an
 * unplayable card is worse than a cramped board.
 */
export function computeBoardMetrics(
  width: number,
  height: number,
  rows: number,
  columns: number,
): BoardMetrics {
  if (width <= 0 || height <= 0 || rows <= 0 || columns <= 0) {
    return {
      cardWidth: MIN_CARD_WIDTH,
      cardHeight: MIN_CARD_WIDTH / CARD_ASPECT,
      gap: MIN_GAP,
      boardWidth: 0,
      boardHeight: 0,
    }
  }

  // Solve for the card width that fits horizontally, then vertically.
  const widthByColumns = width / (columns + (columns - 1) * GAP_RATIO)
  const heightPerCard = height / (rows + (rows - 1) * GAP_RATIO * CARD_ASPECT)
  const widthByRows = heightPerCard * CARD_ASPECT

  // Floored to whole pixels: it keeps card edges crisp, and it stops a
  // board that fills its container exactly from overflowing by a
  // fractional pixel and summoning a scrollbar.
  const cardWidth = Math.floor(Math.max(MIN_CARD_WIDTH, Math.min(widthByColumns, widthByRows)))
  const cardHeight = cardWidth / CARD_ASPECT
  const gap = Math.floor(Math.min(MAX_GAP, Math.max(MIN_GAP, cardWidth * GAP_RATIO)))

  return {
    cardWidth,
    cardHeight,
    gap,
    boardWidth: columns * cardWidth + (columns - 1) * gap,
    boardHeight: rows * cardHeight + (rows - 1) * gap,
  }
}
