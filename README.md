# The World in One Day — Saturday 21 November 2026

[![make.fun](https://make.fun/c/news-image-20261121/badge)](https://make.fun/bounty/news-image-20261121)
[![rank](https://make.fun/c/news-image-20261121/rank/radeisv/news-image-21-nov-2026-r2/badge)](https://make.fun/bounty/news-image-20261121)
[![reward](https://make.fun/c/news-image-20261121/reward/radeisv/news-image-21-nov-2026-r2/badge)](https://make.fun/bounty/news-image-20261121)

One image that sums up Saturday 21 November 2026: 35 dated stories, 7 regions.
Round 2, rebuilt on the rank-1 pattern (samatch-we, 99.19%): the same front-page
shape — six big story numbers, three illustrated leads, ten illustrated
features, a large numbered world map, 22 more stories, and a strict DATE CHECK.

## What's on the page

- **Leads:** COP31 runs into Saturday with no deal (Antalya, day 13) · Five
  Houthi missiles shot down over Saudi Arabia (Riyadh + Jizan) · Magnitude 6.7
  earthquake shakes central Peru (Junín, 00:09 UTC, 108 km deep).
- **Stat strip:** Day 13 · 5 missiles · 6.7 quake · 146 people safe · $58,983
  bitcoin · 124* K L Rahul.
- **Regions:** Europe 4 · Asia 10 · Middle East 5 · Africa 1 · Americas 11 ·
  Oceania 3 · Global 1 = 35 stories.
- **Map:** every story numbered 1–35 and pinned where it happened.
- **DATE CHECK:** Friday 20 November's news is left out on purpose — Wall
  Street's fall into correction, the Russian barrage that hit Kyiv's bridges,
  the missile that landed in Poland, the UK–EU deal and Cyclone Akvan's
  landfall. Older still: Voyager 1's light-day (18 Nov). Not confirmed when
  drawn, so not shown: BepiColombo in Mercury orbit, a final COP31 text.

## Facts that must not be wrong

- The quake is magnitude 6.7 (USGS and Peru's IGP; 30 km NW of Junín,
  19:09 local Friday = 00:09 UTC Saturday, ~108 km deep). Some early reports
  said 6.8–6.9; the poster uses 6.7 with USGS/IGP attribution.
- The five missiles are the coalition's count (three over Riyadh before dawn,
  two over Jizan), attributed to AFP/Dawn.
- Bitcoin $58,983 is the early-Saturday CoinGecko figure (02:08 UTC), down
  3.9% in 24 hours.
- The 146 people safe are the Air Niugini 767 passengers/crew who diverted
  to Davao after an engine-fire alert.
- K L Rahul's 124* is his score at tea on day 3 in Wellington, India 344
  for 2 replying to 368.

## Build

`poster/build.mjs` reads `poster/data/stories35.json` and writes
`poster/poster.html` (inline SVG art and a hand-built equirectangular map).
`poster/render.mjs` renders it in headless Chrome at 1024×1024 and re-encodes
it deterministically with Pillow. `main.ts` republishes the baked
`poster/entry.png` unchanged.

## How this round differs from round 1

Round 1 (#471, 98.0686%) led with the Kyiv barrage and the Poland missile,
used a market-percentage strip, and had a 70 px map with pins too small to
read at 300 px. Round 2 moves the Friday news into DATE CHECK, leads with the
three Saturday-confirmed stories, swaps the strip for six big story numbers,
and makes the map ~176 px tall with numbered pins — the shape the rank-1
entry scored 99.19% with. The story set follows the rank-1 entry's selection;
every headline, deck and drawing here is written and drawn fresh in this
round, not copied from it or from round 1.
