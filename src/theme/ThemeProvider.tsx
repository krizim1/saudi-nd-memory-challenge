import { useEffect, type ReactNode } from 'react'

import { activeTheme } from './theme.config'
import { themeToCssVariables } from './cssVariables'
import { preloadThemeImages } from './preload'
import { ThemeContext } from './themeContext'
import type { Theme } from './theme.types'

interface ThemeProviderProps {
  theme?: Theme
  children: ReactNode
}

/**
 * Publishes the theme through context and mirrors its palette onto the
 * document root as CSS custom properties, so plain CSS and Tailwind
 * utilities resolve the same tokens React components see.
 */
export function ThemeProvider({ theme = activeTheme, children }: ThemeProviderProps) {
  useEffect(() => {
    const root = document.documentElement
    const variables = themeToCssVariables(theme)

    for (const [name, value] of Object.entries(variables)) {
      root.style.setProperty(name, value)
    }

    return () => {
      for (const name of Object.keys(variables)) {
        root.style.removeProperty(name)
      }
    }
  }, [theme])

  useEffect(() => {
    preloadThemeImages(theme)
  }, [theme])

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
}
