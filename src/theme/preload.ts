import type { Theme } from './theme.types'

/**
 * Starts fetching every image the theme names so the first flip of a card
 * never waits on the network.
 *
 * Fire-and-forget: a missing file is fine (each component already falls
 * back), and the browser cache means the per-component probes that follow
 * resolve immediately. On a kiosk this runs once, at boot, while the
 * attract loop is showing.
 */
export function preloadThemeImages(theme: Theme): void {
  const urls = [
    theme.cardBack,
    ...Object.values(theme.backgrounds),
    ...theme.cards.flatMap((card) => (card.image ? [card.image] : [])),
  ]

  for (const url of new Set(urls)) {
    const image = new Image()
    image.decoding = 'async'
    image.src = url
  }
}
