// Hand-authored levels. Static grid uses:
//   '#' wall
//   '.' floor
//   'H' horizontal-flip gate (flips a letter when the letter enters)
// Entities are layered on top:
//   player: [x, y]
//   letters: [[x, y, char], ...] (char in {b, d, p, q})
//   targets: [[x, y, desired-char], ...]
//
// Authoring rules:
//  - Targets sit on floor cells (not on walls or gates).
//  - Gates only flip on entry, not on exit.
//  - Every level must be solvable; verify with tools/check-letter-push.mjs.

export const LEVELS = [
  // L1: pure push, no flip needed. Teaches movement + push.
  {
    grid: [
      '########',
      '#......#',
      '#......#',
      '#......#',
      '########',
    ],
    player: [1, 2],
    letters: [[3, 2, 'b']],
    targets: [[6, 2, 'b']],
  },

  // L2: gate inline between letter and target. Teaches the flip.
  {
    grid: [
      '########',
      '#......#',
      '#...H..#',
      '#......#',
      '########',
    ],
    player: [1, 2],
    letters: [[2, 2, 'b']],
    targets: [[6, 2, 'd']],
  },

  // L3: gate is off-path; must push letter LEFT through gate, then back RIGHT.
  // Teaches detour planning.
  {
    grid: [
      '########',
      '#......#',
      '#......#',
      '#.H....#',
      '#......#',
      '########',
    ],
    player: [4, 1],
    letters: [[4, 3, 'b']],
    targets: [[6, 3, 'd']],
  },

  // L4: same shape as L2 but with p→q. Different letters, same idea.
  {
    grid: [
      '########',
      '#......#',
      '#...H..#',
      '#......#',
      '########',
    ],
    player: [1, 2],
    letters: [[2, 2, 'p']],
    targets: [[6, 2, 'q']],
  },

  // L5: two letters, two targets. Both straight pushes through their own gate.
  {
    grid: [
      '#########',
      '#.......#',
      '#...H...#',
      '#.......#',
      '#...H...#',
      '#.......#',
      '#########',
    ],
    player: [1, 1],
    letters: [
      [2, 2, 'b'],
      [2, 4, 'p'],
    ],
    targets: [
      [7, 2, 'd'],
      [7, 4, 'q'],
    ],
  },

  // L6: two letters; one needs flip, one doesn't. Gate is shared danger.
  {
    grid: [
      '#########',
      '#.......#',
      '#.......#',
      '#...H...#',
      '#.......#',
      '#.......#',
      '#########',
    ],
    player: [1, 1],
    letters: [
      [2, 3, 'b'],
      [2, 5, 'p'],
    ],
    targets: [
      [7, 3, 'd'],
      [7, 5, 'p'],
    ],
  },

  // L7: walls partially block the natural path; player must route around to
  // line up the push. After flipping, the player has to loop back over the top.
  {
    grid: [
      '##########',
      '#........#',
      '#.####...#',
      '#........#',
      '#..H.....#',
      '##########',
    ],
    player: [1, 1],
    letters: [[5, 4, 'b']],
    targets: [[8, 4, 'd']],
  },

  // L8: two letters, both need flips.
  {
    grid: [
      '##########',
      '#........#',
      '#....H...#',
      '#........#',
      '#....H...#',
      '#........#',
      '##########',
    ],
    player: [1, 1],
    letters: [
      [3, 2, 'b'],
      [3, 4, 'q'],
    ],
    targets: [
      [8, 2, 'd'],
      [8, 4, 'p'],
    ],
  },

  // ----- Word-spelling levels -----
  // Each word level uses at most ONE flip gate so the kid has to figure out
  // how to share/route through it. Layouts vary direction (up/down/right) and
  // shape so the puzzles don't all feel like the same template rotated.
  // Letters not in the b/d/p/q flip set (a, e, i, o, u) pass through gates
  // unchanged — they behave like inert blocks for routing purposes.

  // L9 "pad" — no flips. Push UP this time (letters at the bottom, targets
  // at the top) instead of the usual push-down.
  {
    grid: [
      '########',
      '#......#',
      '#......#',
      '#......#',
      '#......#',
      '#......#',
      '#......#',
      '########',
    ],
    player: [1, 6],
    letters: [
      [2, 5, 'p'],
      [3, 5, 'a'],
      [4, 5, 'd'],
    ],
    targets: [
      [2, 1, 'p'],
      [3, 1, 'a'],
      [4, 1, 'd'],
    ],
  },

  // L10 "bed" — push DOWN, one flip on the right column (b→d). The classic
  // setup, kept as a familiar shape after L9.
  {
    grid: [
      '########',
      '#......#',
      '#......#',
      '#......#',
      '#...H..#',
      '#......#',
      '#......#',
      '########',
    ],
    player: [1, 1],
    letters: [
      [2, 2, 'b'],
      [3, 2, 'e'],
      [4, 2, 'b'],
    ],
    targets: [
      [2, 6, 'b'],
      [3, 6, 'e'],
      [4, 6, 'd'],
    ],
  },

  // L11 "bid" — push RIGHT (sideways!) with the gate near the source.
  // Same idea as L10's flip-as-you-pass, but rotated 90° so direction isn't
  // always vertical.
  {
    grid: [
      '##########',
      '#........#',
      '#..H.....#',
      '#........#',
      '#........#',
      '##########',
    ],
    player: [1, 1],
    letters: [
      [2, 2, 'd'],
      [2, 3, 'i'],
      [2, 4, 'd'],
    ],
    targets: [
      [5, 2, 'b'],
      [5, 3, 'i'],
      [5, 4, 'd'],
    ],
  },

  // L12 "dad" — push DOWN, one flip on the LEFT column this time (b→d).
  // The middle 'a' and right 'd' pass straight through. Same shape as L10
  // but with the flip column mirrored, reinforcing "either end can be the
  // one that needs flipping."
  {
    grid: [
      '########',
      '#......#',
      '#......#',
      '#......#',
      '#.H....#',
      '#......#',
      '#......#',
      '########',
    ],
    player: [1, 1],
    letters: [
      [2, 2, 'b'],
      [3, 2, 'a'],
      [4, 2, 'd'],
    ],
    targets: [
      [2, 6, 'd'],
      [3, 6, 'a'],
      [4, 6, 'd'],
    ],
  },

  // L13 "pop" — internal wall makes most columns blocked between the upper
  // and lower halves. The q's column has a flip gate (so q → p as it passes
  // through), while the other letters must route around via the open columns
  // on the right. The existing 'p' must NOT go through the gate — it'd
  // flip to q. Recognising "this letter has to take the long way" is the
  // new puzzle insight.
  {
    grid: [
      '##########',
      '#........#',
      '#........#',
      '#.H####..#',
      '#........#',
      '##########',
    ],
    player: [1, 1],
    letters: [
      [2, 2, 'q'],
      [5, 2, 'o'],
      [8, 2, 'p'],
    ],
    targets: [
      [2, 4, 'p'],
      [5, 4, 'o'],
      [8, 4, 'p'],
    ],
  },

  // L14 "dip" — push RIGHT (sideways) with one gate on the BOTTOM row this
  // time. Touches the OTHER letter pair (q→p), so the kid sees that the
  // same flip mechanic also handles p/q — not just b/d.
  {
    grid: [
      '##########',
      '#........#',
      '#........#',
      '#........#',
      '#...H....#',
      '##########',
    ],
    player: [1, 1],
    letters: [
      [2, 2, 'd'],
      [2, 3, 'i'],
      [2, 4, 'q'],
    ],
    targets: [
      [6, 2, 'd'],
      [6, 3, 'i'],
      [6, 4, 'p'],
    ],
  },
];
