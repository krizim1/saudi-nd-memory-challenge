import { describe, expect, it } from 'vitest'

import { config } from '../../app/config'
import { CARD_ASPECT, MIN_CARD_WIDTH, computeBoardMetrics } from './boardMetrics'

/** The board area left over once the HUD and page padding are removed. */
function boardArea(screenWidth: number, screenHeight: number) {
  const HORIZONTAL_PADDING = 80
  const HEADER_AND_PADDING = 220
  return {
    width: screenWidth - HORIZONTAL_PADDING,
    height: screenHeight - HEADER_AND_PADDING,
  }
}

const hardestLevel = config.levels[config.levels.length - 1]!

const screens = [
  { name: '1920×1080 landscape (primary target)', width: 1920, height: 1080 },
  { name: '1366×768 landscape', width: 1366, height: 768 },
  { name: '1080×1920 portrait', width: 1080, height: 1920 },
  { name: '1024×768 tablet', width: 1024, height: 768 },
]

describe('computeBoardMetrics', () => {
  it.each(screens)('fits every level on $name without scrolling', ({ width, height }) => {
    const area = boardArea(width, height)

    for (const level of config.levels) {
      const metrics = computeBoardMetrics(area.width, area.height, level.rows, level.columns)

      expect(metrics.boardWidth).toBeLessThanOrEqual(area.width)
      expect(metrics.boardHeight).toBeLessThanOrEqual(area.height)
    }
  })

  it.each(screens)('keeps cards comfortably tappable on $name', ({ width, height }) => {
    const area = boardArea(width, height)
    const metrics = computeBoardMetrics(
      area.width,
      area.height,
      hardestLevel.rows,
      hardestLevel.columns,
    )

    // The brief's floor is a 64px target; a card should clear it easily.
    expect(metrics.cardWidth).toBeGreaterThanOrEqual(MIN_CARD_WIDTH)
    expect(metrics.cardHeight).toBeGreaterThanOrEqual(MIN_CARD_WIDTH)
  })

  it('holds the card proportions at every size', () => {
    for (const { width, height } of screens) {
      const area = boardArea(width, height)
      const metrics = computeBoardMetrics(area.width, area.height, 4, 5)

      expect(metrics.cardWidth / metrics.cardHeight).toBeCloseTo(CARD_ASPECT, 5)
    }
  })

  it('grows the cards when the board has fewer of them', () => {
    const area = boardArea(1920, 1080)
    const easy = computeBoardMetrics(area.width, area.height, 3, 4)
    const hard = computeBoardMetrics(area.width, area.height, 4, 5)

    expect(easy.cardWidth).toBeGreaterThan(hard.cardWidth)
  })

  it('is limited by height on a wide, short screen', () => {
    const wide = computeBoardMetrics(2400, 600, 4, 5)
    expect(wide.boardHeight).toBeLessThanOrEqual(600)
  })

  it('is limited by width on a narrow, tall screen', () => {
    const tall = computeBoardMetrics(700, 2000, 4, 5)
    expect(tall.boardWidth).toBeLessThanOrEqual(700)
  })

  it('refuses to shrink cards below the tappable floor, even in a tiny box', () => {
    const cramped = computeBoardMetrics(200, 200, 4, 5)

    expect(cramped.cardWidth).toBe(MIN_CARD_WIDTH)
    // It overflows instead — an unhittable card is the worse failure.
    expect(cramped.boardWidth).toBeGreaterThan(200)
  })

  it('returns a usable fallback before the container has been measured', () => {
    const unmeasured = computeBoardMetrics(0, 0, 4, 5)

    expect(unmeasured.cardWidth).toBe(MIN_CARD_WIDTH)
    expect(unmeasured.boardWidth).toBe(0)
  })
})
