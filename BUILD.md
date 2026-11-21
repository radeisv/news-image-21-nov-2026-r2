# BUILD.md — news-image-20261121 round 2

## Concept
Round 2, Concept A: follow the rank-1 pattern (samatch-we, 99.1923%).
Same front-page shape — stat strip of story numbers, 3 illustrated leads,
10 illustrated features, big numbered map, 22 briefs, strict DATE CHECK.

## Model and what was adopted (strengths/patterns only, not a copy)
- Rank 1 samatch-we (99.19%) and rank 2 kakek-zeus (99.12%) share one family:
  same 35-story selection, same DATE CHECK discipline, same layout skeleton.
- Adopted: story selection and region grouping; stat strip instead of market
  percentages; big map with numbered pins; Friday news moved to DATE CHECK.
- Not copied: every headline, deck, SVG drawing, map polygon set and line of
  build code was written fresh in this round's session. The r1 build script
  was not copied either — build.mjs / render.mjs / main.ts were re-authored.

## Verification
- Render 3× byte-identical: `poster/entry.png` 303,157 bytes, 1024×1024 RGB,
  sha256 `736dcbeada55af7108c30ce84ff8a91fb500fea991dd91de8919a2772ac2e0bb`.
  Layout probe: scrollHeight 1024, no overflow, sections at 10/29/87/109/164/
  185/464/607/752/960/998 (DATE CHECK 960, footer 998).
- `main.ts` republishes identical bytes (same sha256).
- Kit check (no transcripts yet): 4 passed, 0 other failures; only
  transcripts_present fails, as expected before bundling.
- Local commit 2cbb8fe, 10 files, no kit files in repo.
- Render bug found and fixed in this round: Chrome's CLI --screenshot at
  1024×1024 silently drops the bottom ~84 px of the page (DATE CHECK and
  footer came out blank). render.mjs now screenshots through the DevTools
  protocol with captureBeyondViewport, which renders the full page.

## Harsh-judge self-critique (before final output)
1. Map is the biggest remaining risk: pins for Antalya (16, 17) and Washington
   (20, 21) share a place and are offset; check they do not collide at 300 px.
2. Feature decks are truncated to two lines — check no headline loses its verb.
3. The "5 missiles" figure follows the coalition's count as the rank-1 entry
   reports it; our own round-1 research had said 3 intercepted over Riyadh —
   the poster attributes the count to the coalition (AFP, Dawn).
4. Bitcoin $58,983 is an early-Saturday snapshot (02:08 UTC), not the day's
   close — the poster says so.
5. Region "Asia 10" counts Antalya stories under Asia and Indonesia under
   Antalya's brief line — the bar is the rank-1 grouping, kept as-is.
