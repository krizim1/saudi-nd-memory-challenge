import { createContext, useContext } from 'react'

import { activeTheme } from './theme.config'
import type { Theme } from './theme.types'

/**
 * Defaults to the active theme so a component rendered outside the
 * provider (a test, a Storybook-style harness) still gets real tokens
 * instead of throwing.
 */
export const ThemeContext = createContext<Theme>(activeTheme)

export function useTheme(): Theme {
  return useContext(ThemeContext)
}
