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
    registration: `${base}/backgrounds/gameplay.webp`,
    gameplay: `${base}/backgrounds/gameplay.webp`,
    winner: `${base}/backgrounds/winner.webp`,
    leaderboard: `${base}/backgrounds/gameplay.webp`,
  },

  pattern: `${base}/patterns/najdi.svg`,
  cardBack: `${base}/cards/card-back.webp`,

  /**
   * Twelve faces — two more than Level 3 needs, so the deck can vary its
   * selection between rounds.
   *
   * Every face ships illustrated artwork (`cards/<id>.webp`, 3:4 to match
   * the card). `symbol` names the drawn icon in `theme/placeholders.tsx`
   * that stands in if an image is ever missing or slow, so a bad asset
   * degrades one card to an icon instead of breaking the board.
   */
  cards: [
    { id: 'palm', image: `${base}/cards/palm.webp`, alt: 'نخلة', symbol: 'palm' },
    { id: 'swords', image: `${base}/cards/swords.webp`, alt: 'سيفان', symbol: 'swords' },
    { id: 'diriyah', image: `${base}/cards/diriyah.webp`, alt: 'الدرعية', symbol: 'diriyah' },
    { id: 'najdi-door', image: `${base}/cards/najdi-door.webp`, alt: 'باب نجدي', symbol: 'door' },
    { id: 'falcon', image: `${base}/cards/falcon.webp`, alt: 'صقر', symbol: 'falcon' },
    { id: 'dunes', image: `${base}/cards/dunes.webp`, alt: 'كثبان رملية', symbol: 'dunes' },
    { id: 'coffee', image: `${base}/cards/coffee.webp`, alt: 'دلة قهوة', symbol: 'coffee' },
    { id: 'dates', image: `${base}/cards/dates.webp`, alt: 'تمر', symbol: 'dates' },
    { id: 'tower', image: `${base}/cards/tower.webp`, alt: 'برج المملكة', symbol: 'tower' },
    { id: 'fireworks', image: `${base}/cards/fireworks.webp`, alt: 'ألعاب نارية', symbol: 'star' },
    { id: 'mosque', image: `${base}/cards/mosque.webp`, alt: 'مسجد', symbol: 'mosque' },
    { id: 'oud', image: `${base}/cards/oud.webp`, alt: 'عود', symbol: 'oud' },
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
