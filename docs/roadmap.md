# Goal: four new games + the pet meta

Grow the collection from two games to six, then tie everything together
with a hub-level pet companion. Every item below rides Max's strengths
(pattern recognition, visual-spatial reasoning) and his hooks (animals),
and folds reading practice *inside* puzzles where it fits naturally —
never as a drill. All hard rules in `constraints.md` apply unchanged.

## Build order

1. **herd-home** — tilt-slide puzzle (most depth per line of code;
   reuses the grid/undo/FLIP patterns proven in ball-sort and
   letter-push)
2. **pet meta v1** — once there are three games feeding it
3. **switch-tracks** — routing prediction (new cognitive loop:
   commit-then-watch)
4. **pair-paths** — numberlink with animal families
5. **key-maze** — letter discrimination inside navigation

Order is a default, not a contract — reorder if playtesting with Max
says otherwise.

---

## 1. herd-home (tilt-slide)

Four arrow buttons tilt the whole board; every animal slides until it
hits a wall. Get each animal into its matching pen. The puzzle is that
they all move together.

- Grid + entity model like letter-push; movement resolves all entities
  per tilt (sort by direction so leading animals settle first).
- Undo, reset (restore original puzzle), hand-authored levels, BFS
  solvability checker in `tools/`.
- Difficulty knobs for later levels: ice patches (slide through pens),
  one-way fences, mixed pen shapes.
- Animals + pens distinguished by shape *and* color (constraints.md).
- Done when: ~12 levels verified solvable, hub tile, sw.js precache,
  works offline, completion events recorded for the pet meta.

## 2. pet meta v1 (hub companion)

A critter that lives on the hub and grows as Max finishes levels in any
game. Collection mechanics are allowed; grind and guilt are not.

Behavioral guardrails (these are the design, not afterthoughts):
- The pet is **never** hungry, sad, sick, or waiting. Absence has zero
  effect. There is nothing to lose, ever.
- Progress is purely additive: level completions accumulate into growth
  stages and a sticker book of animals helped.
- No counters that imply obligation (no "3 more to evolve!" nagging on
  the hub). Growth moments are discovered, not dangled.
- No pacing pressure: nothing is time-limited, nothing decays.

Mechanics:
- Games write completion events to a shared localStorage key
  (`maxs-games:meta:completions`); same-origin iframes make this free.
  Hub reads it on focus/visibility change — no postMessage protocol
  needed for v1.
- Hub renders the pet (inline SVG, a few growth stages) plus a sticker
  book screen of animals collected from finished levels.
- Retrofit ball-sort and letter-push to record completions; new games
  record from day one.
- Done when: pet visible on hub, grows from existing games' play,
  sticker book opens from the hub, all offline.

## 3. switch-tracks (routing prediction)

A train branches through junctions. Max sets the switches first, then
releases the animals and watches them ride to their homes.

- Predict-then-verify loop: set state, tap go, watch the run. The train
  waits at stations until tapped — no time pressure anywhere.
- Later levels send several animals in sequence so one switch setting
  can't serve them all; re-flipping between runs is the puzzle.
- Track is a small graph; animation is an SVG dot following path
  segments (transform animations only — fine on the low-end GPU).
- Done when: ~10 levels (checker can be a simple graph walk), hub tile,
  precache, completion events, offline.

## 4. pair-paths (numberlink)

Drag a path from each animal to its match (mama duck → ducklings, fox →
den). Paths can't cross; solved when every pair connects and the grid
is full.

- Fat grid cells, drag with generous touch slop; a misdrag never
  destroys other paths (only the path being drawn changes).
- Hand-authored levels with unique solutions, verified by a checker in
  `tools/`.
- Letter variant for later levels: connect lowercase b to uppercase B
  through a field of d's — the path is the answer, not a tap.
- Done when: ~12 levels verified, hub tile, precache, completion
  events, offline.

## 5. key-maze (letter keys, letter doors)

A grid maze where the b key opens the b door — and the d door beside it
stays shut. Carry one key at a time; door order is the real puzzle, the
letter match is incidental but constant.

- Wrong key on a door: door wiggles, key glows for a second look. No
  penalty, no sound of failure.
- Lowercase only on keys/doors (b/d/p/q confusion lives there); TTS
  speaks the letter on pickup, reusing letter-push's audio/voice code —
  promote shared pieces into `shared/` when this lands.
- Sequencing depth: keys behind doors, multi-key routes; BFS checker.
- Done when: ~12 levels verified, hub tile, precache, completion
  events, offline.

---

## Per-game checklist (applies to all)

- Self-contained under `games/<id>/`, registry entry in `hub/games.js`,
  files in `PRECACHE` in `sw.js`, `CACHE_VERSION` bump on deploy.
- Relative paths only; no new dependencies; synthesized audio only.
- Big tap targets, `touch-action: manipulation`, ~76px top-left clear
  for the hub back button.
- Undo and reset where the mechanic allows a stuck state.
- Solvability/uniqueness checker in `tools/` for any hand-authored
  levels.
