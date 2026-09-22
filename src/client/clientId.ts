/**
 * Which client this screen belongs to.
 *
 * Read once from the URL — `…/saudi-nd-memory-challenge/?client=byd` — so
 * each client's kiosk and link keeps its own leaderboard. Anything that is
 * not a plain lower-case slug falls back to the default client rather than
 * reaching the database.
 */

export const DEFAULT_CLIENT = 'default'

const SLUG = /^[a-z0-9-]{1,40}$/

export function parseClientId(search: string): string {
  const raw = new URLSearchParams(search).get('client')?.trim().toLowerCase() ?? ''
  return SLUG.test(raw) ? raw : DEFAULT_CLIENT
}

export function getClientId(): string {
  return typeof window === 'undefined' ? DEFAULT_CLIENT : parseClientId(window.location.search)
}
