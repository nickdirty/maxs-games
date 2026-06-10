# Max's Games

Personal PWA of small games for Max, age 6.5, autistic and very bright.
Off-the-charts pattern recognition and visual-spatial reasoning; emerging
reader who confuses b/d/p/q; loves animals. Runs on an older Android
tablet (TMobile Revvl 2, Chrome). Exists because the kids' game ecosystem
is full of predatory ads and IAPs.

## Audience implications
- **Don't build drill games.** Flashcard-style "show stimulus, tap the
  right bin" patterns will bore him fast. He's bright; reading content
  has to ride inside a real puzzle, not be the puzzle.
- **Lean into pattern + spatial.** Those are his strengths and what
  ball-sort already exploits. Letter discrimination can be folded into
  sort/match/build/route mechanics.
- **Short text is fine; long text isn't.** Show, don't tell.
- **Lowercase** for any letter-focused content — that's where b/d/p/q
  confusion lives.
- **Animals are a hook.** A pet/companion meta-game across games is
  planned as a unifying motivator — see `docs/roadmap.md`.
- **Big tap targets, forgiving inputs.** Don't punish a misclick.
- **No streaks, no FOMO, no engagement traps.** Reward for finishing is
  finishing. See `docs/constraints.md`. Collection mechanics are fine
  if pacing isn't grindy and there's no time pressure.

## Device target
- Older Android Chrome on a low-end tablet. **No heavy frameworks, no
  WebGL, no big asset bundles, no third-party scripts/fonts/CDNs.**
- Plain HTML/CSS/JS with a service worker. ES modules for app code,
  classic (non-module) service worker.

## Hard rules
The full list is in `docs/constraints.md` — read that file before adding
anything. Short version: zero ads, zero IAPs, zero tracking, zero external
network calls at runtime, no login, no cloud sync, no dark patterns,
HTTPS-only, works fully offline after first load.

## Architecture at a glance
- **Hub + iframe games.** `index.html` (hub) renders a tile grid from
  `hub/games.js` (registry). Tapping a tile loads
  `games/<id>/index.html` in an iframe. The hub overlays a back button at
  top-left over the iframe; games leave that area clear (~76px padding).
- **All paths are relative (`./...`).** This is the subpath config — the
  app works at `/`, `/maxs-games/`, or any deeper path without edits.
  Don't introduce absolute paths.
- **Service worker** at `sw.js`, scope `./`, cache-first. Bump
  `CACHE_VERSION` to invalidate after a deploy.
- **Persistence:** `localStorage` only, namespaced
  `maxs-games:<game-id>:...`. No IndexedDB unless a game genuinely needs
  it.
- **Audio:** synthesized via Web Audio API per-game. No audio files. Lazy
  AudioContext, resumed on first user gesture.

## Code conventions
- No frameworks, no build step. Files are served as-is.
- Terse comments. Comment the *why*, never the *what*. Don't write
  multi-paragraph docstrings or task-history notes ("added for X").
- Each game is self-contained under `games/<id>/`. Drop a folder, add an
  entry to `hub/games.js`, add files to `PRECACHE` in `sw.js`. See
  `docs/adding-a-game.md`.
- Inline SVG over images for icons and glyphs (smaller, no extra cache
  entries, no flicker).
- Touch handling: `touch-action: manipulation` and a viewport meta with
  `initial-scale=1` are both required to kill the 300ms tap delay. Don't
  set `user-scalable=no` (a11y).

## Decisions you should not undo without reading the rationale
See `docs/decisions.md`. The non-obvious ones:
- Iframe over dynamic import for games
- All-relative paths instead of a subpath config variable
- FLIP-based ball animation with WAAPI
- Adaptive difficulty as hysteresis on a sliding window (not per-level
  tuning)
- Reset = restore original puzzle, not regenerate

## Dev quick-start
```sh
# from project root
python3 -m http.server 8080
# then open http://localhost:8080/
```
Service worker works on `localhost`. For full debugging steps (forcing SW
update, clearing caches, installing on the tablet, testing offline), see
`docs/dev.md`.

## Layout
```
index.html                  hub
manifest.webmanifest        PWA manifest (start_url & scope are "./")
sw.js                       service worker (cache-first, versioned)
icons/                      192 / 512 / maskable PNGs
hub/                        hub-only assets (CSS, JS, registry)
games/<id>/                 self-contained games
shared/                     reserved for future cross-game helpers
tools/make-icons.mjs        zero-dep PNG generator (run on icon changes)
docs/                       project docs (this file's neighbors)
```
