# Saudi ND — Memory Challenge

**تحدي الذاكرة — اليوم الوطني السعودي**

Touchscreen memory game for a Saudi National Day event activation, in
two modes: a solo run, or a two-player head-to-head. Arabic-first,
offline, built to run unattended on a 1920×1080 landscape touchscreen.

The flow starts at an attract loop, asks for the mode, takes one or two
names, then runs three levels per player. A duel ends on a VS comparison
and a winner; a solo run ends on the player's own result. Both land on
the leaderboard.

## Running

```bash
npm install
npm run dev      # http://localhost:5173 (also served on the LAN)
npm run build    # typecheck + production bundle into dist/
npm run preview  # serve the production bundle
npm run test     # game-logic unit tests
npm run lint
```

For the event itself, serve `dist/` from any static host and open it in
a kiosk-mode browser. There is no backend.

## Architecture

The theme is a replaceable content layer over a stable game system.

```
src/
├── app/        config.ts (every tunable value) · App · GameRouter · ErrorBoundary
├── screens/    one component per phase, no game logic
├── components/ TouchButton · MemoryBoard · ScreenLayout · ThemedBackground · …
├── game/       types · levels · players — pure, no React
├── store/      gameStore (flow) · phaseMachine (legal transitions)
├── theme/      theme.types · theme.config · ThemeProvider · placeholders
├── i18n/       ar.ts — all interface copy
├── hooks/      useAutoAdvance
└── utils/      format
```

- **Flow** is an explicit state machine. `src/store/phaseMachine.ts`
  declares which phase may follow which; the store refuses anything else.
- **Config** lives only in `src/app/config.ts`. No component hardcodes a
  level size, a duration, or a score weight.
- **Copy** lives only in `src/i18n/ar.ts`, reached through `t`.
- **Assets** live only in `src/theme/theme.config.ts`. See
  `public/themes/national-day/README.md`.

## Status

Phases 1–4 complete. The game is playable end to end: two players, three
levels each, real scores, and a winner.

- **Phase 1 — Foundation.** Architecture, theme system, localization,
  configuration, state machine, all twelve screens.
- **Phase 2 — Game Engine.** Deck building, shuffling, flipping, match
  checking, input locking, the timer, level completion — pure functions
  in `src/game/engine.ts`, driven from React by
  `src/hooks/useLevelEngine.ts`.
- **Phase 3 — Two-player challenge.** Registration, player sequencing,
  the handover, per-player result storage, winner calculation.
- **Phase 4 — Scoring.** `src/game/scoring.ts`: match points, capped
  streak bonuses, a time bonus for clearing, and draw handling with
  tie-breaks on time then streak.
- **Phase 5 — Visual experience.** Bundled Arabic webfonts, the Najdi
  pattern, card flip and celebration animation, staggered level
  transitions, and the sound manager (`src/audio/`).
- **Phase 6 — Event features.** IndexedDB leaderboard behind a repository
  interface, the hidden operator panel, and kiosk auto-reset.

All six phases are complete.

## Scoring

Each level is scored from what the player controls, then weighted by
the level (all weights in `src/app/config.ts`):

| Part | Rule |
|---|---|
| Matches | 100 per pair |
| Streak | +25 per consecutive match beyond the first, capped at ×5 |
| Accuracy | up to 300 × (matches ÷ attempts) × share of board found |
| Speed | up to 200, full at ≤1.5 s per attempt, zero at ≥5 s, × share found |
| Time | 10 per second left — cleared levels only |
| Clear | +200 for finishing the board |
| Level | subtotal × 1 / × 1.5 / × 2 for levels 1–3 |

Wrong flips never subtract; they only lower the accuracy bonus. The
level-complete screen shows every part.

## Shared leaderboard (Supabase)

By default standings live in the browser (IndexedDB). To share one
ranking across kiosks and the published site:

1. Create a free project at supabase.com and run `supabase/schema.sql`,
   then `supabase/migrations/002_clients.sql`, in its SQL editor.
2. Copy *Project URL* and the *anon public* key from Project Settings → API.
3. Locally: put them in `.env.local` (see `.env.example`).
   For GitHub Pages: add them as repository **variables**
   `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`, then re-run Deploy.

The table allows reading and inserting only, so the public key cannot
edit or delete results; clear the table from the Supabase dashboard. If
the network drops, the game keeps playing and holds results in memory.

## Clients: one game, separate leaderboards

Every result is tagged with the client in the URL:

    https://krizim1.github.io/saudi-nd-memory-challenge/?client=byd

With no `?client=` the game uses `default`. Each client sees only its
own standings.

Register a client (and its reset PIN) once, in the Supabase SQL editor
— no code change or redeploy needed:

```sql
select public.add_client('byd', 'BYD', 'a-6+-char-PIN',
                         'احتفال BYD باليوم الوطني',            -- event title (optional)
                         'https://example.com/byd-logo.png');   -- logo URL (optional)
```

Running it again updates the name, title, logo or PIN. To clear a
client's standings, open the operator panel (five taps on the logo),
enter the PIN and tap *مسح لوحة المتصدرين* twice. Five wrong PINs lock
that client's reset for 15 minutes. From the SQL editor you can also
clear directly: `delete from public.leaderboard where client = 'byd';`



1. `npm run build`, then serve `dist/` and open it in a kiosk-mode
   browser on the touchscreen.
2. Tap the event logo **five times within three seconds** to open the
   operator panel: reset the round, clear the standings, switch sound,
   retune level timers and the auto-reset delay, rename the game or the
   event, or jump straight into a level to smoke-test it.
3. Settings persist in `localStorage`; standings persist in IndexedDB.
   Either failing (private mode, storage blocked) drops to an in-memory
   equivalent rather than showing an error.

An end screen left untouched for 30 seconds returns to the attract loop
and clears the players. The standings survive that reset; only the
operator can clear them, and only after confirming.

## Card artwork

Cards ship as icons: each face in `src/theme/theme.config.ts` names a
`symbol` drawn in `src/theme/placeholders.tsx`. Adding an `image` path to
a face switches that one card to real artwork and keeps the icon as its
fallback, so the deck can be illustrated a card at a time.

## Fonts

The event runs offline, so both Arabic families are bundled rather than
linked: `scripts/fetch-fonts.mjs` downloads them into
`public/themes/national-day/fonts/` and generates `src/theme/fonts.css`.
Both are SIL Open Font License 1.1 (OFL.txt ships beside them). The
output is committed — re-run the script only to refresh or add a weight.

## Sound

`src/audio/AudioManager.ts` plays every sound through one Web Audio
context, with paths taken from the theme. There are no sound files in
the repo yet: a missing, unfetchable or undecodable file is recorded and
skipped, so the game runs silently rather than failing. Drop MP3s at the
paths in `theme.config.ts` to enable audio.
