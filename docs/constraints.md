# Hard rules

These don't change. Adding a game (or any feature) that violates one of
these means the change isn't going in.

## Privacy and integrity
- **Zero ads.** Never. Not even self-promotional, not even house ads.
- **Zero IAPs.** No purchases, no virtual currency, no "premium," no
  unlock keys.
- **Zero tracking, zero analytics.** No first-party telemetry, no
  third-party SDKs, no pixels, no fingerprinting, no error reporters that
  phone home. If you need a metric to tune a game, sample it on-device
  and never transmit it.
- **Zero external network calls at runtime.** Same-origin only. No CDNs,
  no Google Fonts, no map tiles, no remote configs, no remote feature
  flags. All assets must be bundled and precached.
- **No accounts, no login, no cloud sync.** Local storage only.

## Behavioral integrity (no dark patterns)
- **No streaks, no daily-login bonuses, no FOMO timers.** A 5-year-old
  shouldn't experience guilt for skipping a day.
- **No "watch an ad to continue."** No ads to watch anyway, but the
  pattern is also banned.
- **No notifications.** Don't ask for the permission, don't request it
  conditionally, don't surface it.
- **No "rate this app," no share prompts, no social hooks.**
- **The reward for finishing a level is finishing the level.** A simple
  "you did it" beat and a tap to move on. Nothing more.

## Platform
- **HTTPS-only.** GitHub Pages handles this; never deploy anywhere that
  doesn't.
- **PWA install must work on Android Chrome.** Manifest + 192/512 icons +
  registered SW with a fetch handler + `display: standalone`.
- **Works fully offline after first load.** All needed assets precached
  by the service worker.
- **Works at any subpath.** No absolute URLs in code or markup. The site
  must move from `/` to `/maxs-games/` (or deeper) with zero edits.

## Tech ceiling
- **No frameworks** (no React/Vue/Svelte/Solid/etc.).
- **No build step.** Files are served as written.
- **No WebGL.** Old tablet, low-end GPU.
- **No giant assets.** Generate sounds with Web Audio. Prefer inline SVG
  over images. Keep total bundle small.
- **No third-party scripts** of any kind. Even self-hosted copies of
  third-party libraries are discouraged unless they earn their keep.

## Content
- **Reading level: kindergarten.** When in doubt, use icons, audio, or
  color instead of words.
- **Inclusive defaults.** Distinguish things by shape *and* color, not
  color alone.
- **No violence, no scary themes, no jump scares, no anxiety mechanics.**
