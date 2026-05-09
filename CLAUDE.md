# Max's Games

Personal PWA of small games for Max, age 6.5 (early 1st-grade-ish, an
emerging reader who confuses b/d/p/q), on an older Android tablet (TMobile
Revvl 2, Chrome). It exists because the kids' game ecosystem is full of
predatory ads and IAPs and it's better to just make him something clean.

## Audience implications
- **Short text is fine; long text isn't.** He can decode short words and
  benefits from word-based games. Long instructions still won't land —
  show, don't tell.
- **Letter discrimination matters.** Lowercase b/d/p/q is a current
  challenge; games that practice it are valuable. Use lowercase for any
  letter-focused content.
- **Big tap targets, forgiving inputs.** Don't punish a misclick; flash
  and switch selection rather than scolding.
- **No streaks, no FOMO, no engagement traps.** Reward for finishing is
  finishing. See `docs/constraints.md`.

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
