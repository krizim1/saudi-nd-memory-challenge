# National Day theme assets

Every file the game looks for is declared in `src/theme/theme.config.ts`.
Drop a real asset at the path named there and it appears on the next
reload — no component or logic change.

```
backgrounds/   attract · gameplay · winner  (.webp, 1920×1080). The registration,
               mode-select and leaderboard screens reuse gameplay.webp.
cards/         one 3:4 illustration per face id (palm, swords, diriyah …), 900×1200 .webp.
               The card back is drawn in code; add card-back.webp to override it.
logos/         logo.svg  (event mark; sponsor marks go in theme.sponsorLogos)
patterns/      najdi.svg (repeating, tiled at 240×240)
sounds/        card-flip · match-success · match-wrong · streak · countdown ·
               level-complete · player-complete · winner  (.mp3)
icons/         reserved
illustrations/ reserved
```

Anything absent falls back to a designed placeholder — a gradient for a
background, a drawn geometric motif for a card. A missing asset never
throws and never leaves an empty box on screen.

To add a card face, append an entry to `cards` in `theme.config.ts` with
an `id`, an `image` path, an Arabic `alt`, and a `symbol` key from
`src/theme/placeholders.tsx`.

To ship a different theme entirely, write a new object satisfying
`Theme` (`src/theme/theme.types.ts`) and point `activeTheme` at it.
