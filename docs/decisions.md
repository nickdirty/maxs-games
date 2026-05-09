# Architecture decisions

Short ADR-style log of the non-obvious choices. Each entry is the *what*
and the *why*, so future-you (or a future Claude session) doesn't undo a
decision without realizing the trade-off.

---

## 1. Games run in iframes, not via dynamic import

**Considered:** dynamic `import()` of each game's module into the hub
document, with a manual cleanup contract.

**Chose:** iframe per game.

**Why:**
- True isolation. CSS, JS globals, `AudioContext`, history state, event
  listeners — none of it leaks into the hub or between games.
- Each game runs standalone: opening `games/<id>/index.html` directly in a
  browser is a complete dev environment.
- "Add a game" is genuinely "drop a folder + add a registry line." No
  cleanup contract to honor.
- Memory cost is fine because only one game is mounted at a time. Setting
  `frame.src = 'about:blank'` on close tears it down.

**Trade-off:** parent ↔ iframe communication needs `postMessage` if it ever
becomes necessary. So far it isn't — the back button is in the hub's chrome
and games persist their own state via `localStorage`.

---

## 2. All paths are relative; no subpath config variable

**Considered:** a `config.js` exporting a `BASE_URL` consumed by the
manifest, SW, and asset references.

**Chose:** every path in the project is `./...`.

**Why:**
- The manifest's `start_url: "./"` and `scope: "./"` resolve relative to
  the manifest URL, so they automatically point at the right subpath.
- The SW registers with `register('./sw.js', { scope: './' })`, which
  becomes `/maxs-games/sw.js` with scope `/maxs-games/` when deployed
  there. SW max-scope = its own directory, so this is also the most
  permissive valid scope.
- Cache list inside the SW uses scope-relative URLs, which `cache.put`
  resolves against the SW's location.
- Result: the project moves from `/` to any subpath with zero edits, and
  there is no config var to forget to update.

**Trade-off:** can't share a path constant with Node tooling. Not
relevant — the only Node tool is the icon generator and it's path-agnostic.

---

## 3. ES modules for app code, classic (non-module) service worker

**Why classic SW:** module workers are still gated behind a feature flag
in older Chrome and have inconsistent support across the Android tablets
the family might use. Classic workers are universal and there is nothing a
module SW would buy us.

**Why ES modules for app:** modern Android Chrome supports them
natively, no build step required. `<script type="module">` everywhere.

---

## 4. Ball-move animation uses FLIP via the Web Animations API

**Considered:** absolute-positioning the ball above all tubes during
flight, then re-parenting on land; or CSS transitions on `top`/`left`.

**Chose:** FLIP — append the ball to the destination tube *first*, capture
the resulting layout, then animate from an inverse-transformed starting
state back to identity using `element.animate(keyframes, opts)`.

**Why:**
- Layout is correct at every frame; if anything cancels (DOM reset, level
  restart), the ball ends up in its proper resting place by default.
- Web Animations API gives us multi-keyframe arcs with per-segment easing
  and a real `Promise<finished>`, without timer plumbing.
- Setting `fill: 'none'` (the default) means after `finished`, no inline
  transform is left on the element — no flicker, no commit step.

The arc has four keyframes: start (inverse), apex over source, apex over
destination, identity. Apex Y is offset above the higher of the two tube
rims so the ball clears the rim no matter the direction.

---

## 5. Adaptive difficulty: hysteresis on a sliding window

**Considered:** continuous difficulty score that nudges every level; or
no adaptation, just hand-tuned per level.

**Chose:** discrete tiers (1..12) with a sliding window of recent
outcomes. Bump up after **3 consecutive efficient solves**, bump down
after **2 consecutive struggles or rage-resets**, reset the window after
each step.

**Why:**
- Window reset prevents oscillation: after a bump we re-evidence at the
  new tier instead of bouncing between two.
- Asymmetric counts (3 to go up, 2 to go down) bias toward "stay
  comfortable" — better for a 5-year-old's flow than precise difficulty
  matching.
- Discrete tiers map cleanly to (colors, empties, scramble) triples that
  feel meaningfully different.

The kid's displayed level number is just a counter — independent of
difficulty — so a bump or drop doesn't visibly interrupt anything.

---

## 6. Reset restores the original puzzle, not a fresh one

**Why:** "where did my balls go?" is a worse experience than "I'll try
again." Reset only counts as a struggle signal if the kid actually made
≥3 moves before giving up — protects against the "I tapped reset by
accident" case.

---

## 7. Color only on balls (glyphs were tried and removed)

Originally each color paired with a unique inline-SVG glyph (star, sun,
leaf, etc.) so balls were distinguishable without color — a basic
colorblind-hygiene reflex. In practice the glyphs read as visual noise
on small balls, and the specific kid this is built for has no CVD. We
dropped them. If a future game has a different audience, reintroduce a
non-color channel (glyph, pattern, or shape) instead of trusting hue
alone.

---

## 8. Pure-JS PNG generation for icons (zero deps)

**Considered:** `sharp`, `node-canvas`, ImageMagick, or hand-curated
exported PNGs.

**Chose:** `tools/make-icons.mjs` — a small rasterizer + PNG encoder
written from scratch using only Node's built-in `zlib`.

**Why:** keeps the project dep-free and source-of-truth. Editing the
icon design and regenerating is one `node tools/make-icons.mjs` away,
no `npm install` first.

**Trade-off:** the rasterizer is intentionally limited to the shapes the
icon actually needs (rounded rectangles, filled circles). If the icon
ever gets fancier, swap in `sharp`.

---

## 9. localStorage namespacing under `maxs-games:<game-id>:`

Two-level namespace prevents collisions between games, and the
`maxs-games:` prefix means a future "wipe all save state" feature can
just iterate `Object.keys(localStorage).filter(k => k.startsWith('maxs-games:'))`
and delete.

---

## 10. Cache versioning via a single constant; `skipWaiting` + `clients.claim`

**Why aggressive activation:** this PWA has one user. Waiting for all
clients to close before activating a new SW (the default) means he could
miss an update for a week. `skipWaiting()` + `clients.claim()` rolls the
new SW out on the next page load.

**Why `Promise.all` + individual `cache.put` instead of `cache.addAll`:**
`addAll` is atomic — a single 404 fails the entire install and the user
gets nothing. The looser version logs misses but still installs the rest,
so a forgotten file in `PRECACHE` degrades gracefully instead of bricking
offline.

---

## 11. ~76px top-left padding in each game's topbar

The hub's back button is an overlay outside the iframe, positioned at
top-left. Games can't see the overlay, so each game leaves that area
empty by hardcoding `padding-left: 76px` on its topbar. Cheap, robust,
no `postMessage` chrome handshake required.
