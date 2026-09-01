import type { Theme } from './theme.types'

/**
 * Projects a theme onto the CSS custom properties that `globals.css` and
 * the Tailwind theme layer read. Doing the mapping here keeps components
 * free of any knowledge of which token name backs which color.
 */
export function themeToCssVariables(theme: Theme): Record<string, string> {
  return {
    '--color-primary': theme.palette.primary,
    '--color-primary-deep': theme.palette.primaryDeep,
    '--color-primary-bright': theme.palette.primaryBright,
    '--color-accent': theme.palette.accent,
    '--color-accent-deep': theme.palette.accentDeep,
    '--color-background': theme.palette.background,
    '--color-surface': theme.palette.surface,
    '--color-surface-raised': theme.palette.surfaceRaised,
    '--color-text-primary': theme.palette.textPrimary,
    '--color-text-secondary': theme.palette.textSecondary,
    '--color-text-inverse': theme.palette.textInverse,
    '--color-success': theme.palette.success,
    '--color-danger': theme.palette.danger,
    '--font-display': theme.typography.display,
    '--font-body': theme.typography.body,
    '--theme-pattern': `url("${theme.pattern}")`,
  }
}
