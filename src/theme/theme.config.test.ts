import { describe, expect, it } from 'vitest'

// The module's own source, for the sub-path check below.
import themeSource from './theme.config.ts?raw'

import { config } from '../app/config'
import { placeholderSymbolKeys } from './placeholders'
import { activeTheme } from './theme.config'

const cards = activeTheme.cards

describe('theme card faces', () => {
  it('offers at least as many faces as the largest level needs', () => {
    const mostPairs = Math.max(...config.levels.map((level) => level.pairs))
    expect(cards.length).toBeGreaterThanOrEqual(mostPairs)
  })

  it('gives every face a unique id', () => {
    expect(new Set(cards.map((card) => card.id)).size).toBe(cards.length)
  })

  it('gives every face an Arabic label', () => {
    for (const card of cards) {
      expect(card.alt.trim()).not.toBe('')
    }
  })

  /*
   * This is the one that matters. An unknown symbol key renders the
   * generic fallback mark, so two mistyped faces would look identical on
   * the board while refusing to match each other — a game that appears
   * broken to the player, with nothing in the console to explain it.
   */
  it('names a real icon for every face', () => {
    for (const card of cards) {
      expect(placeholderSymbolKeys).toContain(card.symbol)
    }
  })

  it('gives every face a distinct icon', () => {
    const symbols = cards.map((card) => card.symbol)
    expect(new Set(symbols).size).toBe(cards.length)
  })
})

describe('theme asset paths', () => {
  /*
   * Vite rewrites asset URLs in CSS and HTML when the app is served from
   * a sub-path, but never inside a JavaScript string. A path hardcoded
   * with a leading slash therefore works locally and 404s on a GitHub
   * Pages project site — which is exactly the kind of break nobody sees
   * until the link is shared.
   */
  const paths = [
    activeTheme.logo,
    activeTheme.pattern,
    activeTheme.cardBack,
    ...Object.values(activeTheme.backgrounds),
    ...Object.values(activeTheme.sounds),
  ]

  it('builds every asset path from the app base URL', () => {
    for (const path of paths) {
      expect(path.startsWith(import.meta.env.BASE_URL)).toBe(true)
    }
  })

  /*
   * Checked against the source rather than the values: under the test
   * runner `BASE_URL` is `/`, so a hardcoded `/themes/...` and a properly
   * derived path are indistinguishable at runtime. Reading the file is
   * the only way to tell them apart.
   */
  it('derives the asset root from BASE_URL in the source', () => {
    // Comments explain the rule and quote the very pattern being banned,
    // so only the code is examined.
    const code = themeSource.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')

    expect(code).toContain('import.meta.env.BASE_URL')
    expect(code).not.toMatch(/['`]\/themes\//)
  })
})
