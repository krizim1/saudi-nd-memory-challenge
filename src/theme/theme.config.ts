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

  /*
   * Colours are the National Day 96 guideline's own (§3.1 and page 25):
   * the deep teal ground the whole guideline is set on, the logo's green,
   * and the authenticity trait green as the bright accent.
   */
  palette: {
    primary: '#00894A',
    primaryDeep: '#00343A',
    primaryBright: '#5ABA1C',
    accent: '#5ABA1C',
    accentDeep: '#00894A',
    background: '#002628',
    surface: 'rgba(255, 255, 255, 0.05)',
    surfaceRaised: 'rgba(255, 255, 255, 0.1)',
    textPrimary: '#FFFFFF',
    textSecondary: 'rgba(255, 255, 255, 0.66)',
    textInverse: '#002628',
    success: '#5ABA1C',
    danger: '#971A4D',
  },

  /* IBM Plex Sans Arabic is the identity's secondary typeface (§3.1). */
  typography: {
    display: '"IBM Plex Sans Arabic", "SF Arabic", "Geeza Pro", system-ui, sans-serif',
    body: '"IBM Plex Sans Arabic", "SF Arabic", "Geeza Pro", system-ui, sans-serif',
  },

  /** The official «عزّنا بطبعنا» artistic logo (guideline §1.2). */
  logo: `${base}/logos/logo.png`,
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
   * Twelve faces from the identity's six traits (guideline §5.2): each
   * trait's main icon, and its first secondary pattern. Both are the
   * official artwork, cropped square from the guideline; `color` is the
   * trait's own HEX from page 25.
   *
   * `symbol` names the drawn icon in `theme/placeholders.tsx` that stands
   * in if an image is ever missing, so a bad asset degrades one card to an
   * icon instead of breaking the board.
   */
  cards: [
    { id: 'vision', image: `${base}/cards/vision.webp`, alt: 'عزّنا برؤيتنا', color: '#7C5D21', symbol: 'star' },
    { id: 'courage', image: `${base}/cards/courage.webp`, alt: 'عزّنا بشجاعتنا', color: '#607C4F', symbol: 'swords' },
    { id: 'determination', image: `${base}/cards/determination.webp`, alt: 'عزّنا بهمّتنا', color: '#971A4D', symbol: 'dunes' },
    { id: 'authenticity', image: `${base}/cards/authenticity.webp`, alt: 'عزّنا بأصالتنا', color: '#5ABA1C', symbol: 'palm' },
    { id: 'generosity', image: `${base}/cards/generosity.webp`, alt: 'عزّنا بكرمنا', color: '#0050AF', symbol: 'coffee' },
    { id: 'giving', image: `${base}/cards/giving.webp`, alt: 'عزّنا بجودنا', color: '#6565E0', symbol: 'oud' },
    { id: 'vision-pattern', image: `${base}/cards/vision-pattern.webp`, alt: 'نقش الرؤية', color: '#7C5D21', symbol: 'diriyah' },
    { id: 'courage-pattern', image: `${base}/cards/courage-pattern.webp`, alt: 'نقش الشجاعة', color: '#607C4F', symbol: 'door' },
    { id: 'determination-pattern', image: `${base}/cards/determination-pattern.webp`, alt: 'نقش الهمّة', color: '#971A4D', symbol: 'falcon' },
    { id: 'authenticity-pattern', image: `${base}/cards/authenticity-pattern.webp`, alt: 'نقش الأصالة', color: '#5ABA1C', symbol: 'dates' },
    { id: 'generosity-pattern', image: `${base}/cards/generosity-pattern.webp`, alt: 'نقش الكرم', color: '#0050AF', symbol: 'mosque' },
    { id: 'giving-pattern', image: `${base}/cards/giving-pattern.webp`, alt: 'نقش الجود', color: '#6565E0', symbol: 'tower' },
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
