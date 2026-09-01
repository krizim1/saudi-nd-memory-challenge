/**
 * Localization entry point.
 *
 * Phase 1 ships Arabic only, but every string already resolves through
 * `t()` so adding English later is a matter of supplying a second
 * dictionary — no component changes.
 */

import { ar } from './ar'

export type Locale = 'ar' | 'en'

/** Shape every locale must satisfy, derived from the Arabic reference. */
export type Dictionary = typeof ar

const dictionaries: Partial<Record<Locale, Dictionary>> = {
  ar,
}

export const defaultLocale: Locale = 'ar'

/** Locales whose text runs right-to-left. */
const rtlLocales: ReadonlySet<Locale> = new Set<Locale>(['ar'])

export function isRtl(locale: Locale): boolean {
  return rtlLocales.has(locale)
}

/**
 * Returns the dictionary for `locale`, falling back to the default so a
 * partially translated locale can never blank out the interface.
 */
export function getDictionary(locale: Locale = defaultLocale): Dictionary {
  return dictionaries[locale] ?? ar
}

/** Convenience accessor for the active dictionary. */
export const t: Dictionary = getDictionary(defaultLocale)
