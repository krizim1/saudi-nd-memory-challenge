/**
 * The Saudi National Day theme.
 *
 * Every path below points into `public/themes/national-day/`. Dropping a
 * real asset at one of these paths replaces the placeholder with no code
 * change; a path that resolves to nothing degrades to an SVG placeholder
 * (see `placeholders.tsx`) rather than breaking the screen.
 */

import type { Theme } from './theme.types'

/*
 * Asset paths are built from the app's base URL, not from a leading
 * slash.
 *
 * Vite rewrites `url()` in CSS and `src` in HTML when the app is served
 * from a sub-path — a GitHub Pages project site, or any deployment that
 * is not at a domain root — but it cannot rewrite a string literal in
 * JavaScript. Hardcoding `/themes/...` here would 404 every background,
 * icon, pattern and sound the moment the app moves off the root.
 *
 * `BASE_URL` is `/` in development and always ends in a slash.
 */
const base = `${import.meta.env.BASE_URL}themes/national-day`

export const nationalDayTheme: Theme = {
  id: 'national-day',
  name: 'اليوم الوطني السعودي',

  palette: {
    primary: '#0F6A3F',
    primaryDeep: '#06331E',
    primaryBright: '#17A05C',
    accent: '#D8B25E',
    accentDeep: '#8A6A22',
    background: '#04180F',
    surface: 'rgba(255, 255, 255, 0.06)',
    surfaceRaised: 'rgba(255, 255, 255, 0.12)',
    textPrimary: '#F5F3EC',
    textSecondary: 'rgba(245, 243, 236, 0.68)',
    textInverse: '#06331E',
    success: '#3FBE7C',
    danger: '#D3574F',
  },

  typography: {
    display:
      '"Noto Kufi Arabic", "Tajawal", "SF Arabic", "Geeza Pro", system-ui, sans-serif',
    body: '"Tajawal", "Noto Sans Arabic", "SF Arabic", "Geeza Pro", system-ui, sans-serif',
  },

  logo: `${base}/logos/logo.svg`,
  sponsorLogos: [],

  backgrounds: {
    attract: `${base}/backgrounds/attract.webp`,
    registration: `${base}/backgrounds/registration.webp`,
    gameplay: `${base}/backgrounds/gameplay.webp`,
    winner: `${base}/backgrounds/winner.webp`,
    leaderboard: `${base}/backgrounds/leaderboard.webp`,
  },

  pattern: `${base}/patterns/najdi.svg`,
  cardBack: `${base}/cards/card-back.webp`,

  /**
   * Twelve faces — two more than Level 3 needs, so the deck can vary its
   * selection between rounds.
   *
   * These are icon faces: `symbol` names a drawing in
   * `theme/placeholders.tsx` and is the card's actual content. Adding an
   * `image` path to an entry switches that one card to real artwork —
   * the renderer prefers the image and falls back to the icon, so a theme
   * can be illustrated a card at a time.
   */
  cards: [
    { id: 'palm', alt: 'نخلة', symbol: 'palm' },
    { id: 'swords', alt: 'سيفان', symbol: 'swords' },
    { id: 'diriyah', alt: 'الدرعية', symbol: 'diriyah' },
    { id: 'najdi-door', alt: 'باب نجدي', symbol: 'door' },
    { id: 'falcon', alt: 'صقر', symbol: 'falcon' },
    { id: 'dunes', alt: 'كثبان رملية', symbol: 'dunes' },
    { id: 'coffee', alt: 'دلة قهوة', symbol: 'coffee' },
    { id: 'dates', alt: 'تمر', symbol: 'dates' },
    { id: 'tower', alt: 'برج', symbol: 'tower' },
    { id: 'star', alt: 'نجمة', symbol: 'star' },
    { id: 'mosque', alt: 'مسجد', symbol: 'mosque' },
    { id: 'oud', alt: 'عود', symbol: 'oud' },
  ],

  sounds: {
    cardFlip: `${base}/sounds/card-flip.mp3`,
    matchSuccess: `${base}/sounds/match-success.mp3`,
    matchWrong: `${base}/sounds/match-wrong.mp3`,
    streak: `${base}/sounds/streak.mp3`,
    countdown: `${base}/sounds/countdown.mp3`,
    levelComplete: `${base}/sounds/level-complete.mp3`,
    playerComplete: `${base}/sounds/player-complete.mp3`,
    winnerCelebration: `${base}/sounds/winner.mp3`,
  },
}

/** The theme the app boots with. */
export const activeTheme = nationalDayTheme
