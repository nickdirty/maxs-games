# Adding a game

Each game is a self-contained folder under `games/<id>/` with its own
`index.html`. The hub loads it in an iframe; the game has no idea the hub
exists. You can open `games/<id>/index.html` directly in a browser to dev on
it standalone.

## Steps

1. **Copy an existing game as a starting point.**

   ```sh
   cp -r games/ball-sort games/<new-id>
   ```

   Then edit it. Conventions to keep:

   - Leave the top-left ~76px clear in your topbar — the hub's back button
     overlays that area.
   - Disable text selection / tap highlight / double-tap-zoom (see
     `ball-sort.css` `html, body` rules — copy them).
   - Persist anything to `localStorage` under `maxs-games:<new-id>:...` so
     keys never collide between games.
   - No external network calls. No third-party scripts, fonts, or assets.
   - Synthesize sounds with the Web Audio API (see `games/ball-sort/audio.js`).
     Lazy-init the `AudioContext` on the first user gesture.

2. **Register the game in the hub.**

   Add an entry to `hub/games.js`:

   ```js
   {
     id: '<new-id>',
     name: 'Display Name',
     path: './games/<new-id>/index.html',
     iconBg: '#hex',
     iconHTML: `<svg viewBox="0 0 88 88" width="80" height="80">…</svg>`,
   }
   ```

   `iconHTML` is rendered inside an 88×88 tile square. Inline SVG keeps the
   bundle tiny and avoids extra files to cache.

3. **Precache the new files.**

   Add the new game's files to `PRECACHE` in `sw.js`:

   ```js
   './games/<new-id>/',
   './games/<new-id>/index.html',
   './games/<new-id>/<new-id>.css',
   './games/<new-id>/<new-id>.js',
   // …any other files the game loads at runtime
   ```

   Bump `CACHE_VERSION` in the same file (e.g. `'v1'` → `'v2'`). The activate
   handler will sweep the old cache on the next visit.

4. **Deploy.**

   Commit and push. GitHub Pages serves it at the same URL; on next launch the
   tablet picks up the new SW, drops the old cache, and the new tile appears.

## Reminders

- All paths are relative (`./…`). Don't introduce absolute paths — the app
  has to work at `/maxs-games/` (or any other subpath) without edits.
- HTTPS is required for service workers; GitHub Pages handles that.
- No streaks, no FOMO, no "watch an ad" anything. The reward for finishing
  is finishing.
