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
  // Targets are arranged left-to-right to spell a real short word. Letters
  // not in the b/d/p/q flip set ('a', 'e', 'i', 'o', 'u') pass through gates
  // unchanged, so they behave like inert blocks for routing purposes.

  // L9: "pad" — no flips needed. Introduces word-spelling: every letter is
  // already correct, just push each one down to its target.
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
    player: [1, 1],
    letters: [
      [2, 2, 'p'],
      [3, 2, 'a'],
      [4, 2, 'd'],
    ],
    targets: [
      [2, 6, 'p'],
      [3, 6, 'a'],
      [4, 6, 'd'],
    ],
  },

  // L10: "bed" — one flip on the right column (b → d).
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

  // L11: "bid" — one flip, but on the LEFT column this time (d → b).
  // Forces noticing that "the same letter shape" can need flipping at either
  // end depending on the target.
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
    player: [4, 1],
    letters: [
      [2, 2, 'd'],
      [3, 2, 'i'],
      [4, 2, 'd'],
    ],
    targets: [
      [2, 6, 'b'],
      [3, 6, 'i'],
      [4, 6, 'd'],
    ],
  },

  // L12: "dad" — both ends need flipping (b → d on each side).
  {
    grid: [
      '########',
      '#......#',
      '#......#',
      '#......#',
      '#.H.H..#',
      '#......#',
      '#......#',
      '########',
    ],
    player: [1, 1],
    letters: [
      [2, 2, 'b'],
      [3, 2, 'a'],
      [4, 2, 'b'],
    ],
    targets: [
      [2, 6, 'd'],
      [3, 6, 'a'],
      [4, 6, 'd'],
    ],
  },

  // L13: "pop" — two flips, q → p pair instead of b → d.
  {
    grid: [
      '########',
      '#......#',
      '#......#',
      '#......#',
      '#.H.H..#',
      '#......#',
      '#......#',
      '########',
    ],
    player: [1, 1],
    letters: [
      [2, 2, 'q'],
      [3, 2, 'o'],
      [4, 2, 'q'],
    ],
    targets: [
      [2, 6, 'p'],
      [3, 6, 'o'],
      [4, 6, 'p'],
    ],
  },

  // L14: "dip" — two flips that touch BOTH letter pairs (b→d on the left,
  // q→p on the right).
  {
    grid: [
      '########',
      '#......#',
      '#......#',
      '#......#',
      '#.H.H..#',
      '#......#',
      '#......#',
      '########',
    ],
    player: [1, 1],
    letters: [
      [2, 2, 'b'],
      [3, 2, 'i'],
      [4, 2, 'q'],
    ],
    targets: [
      [2, 6, 'd'],
      [3, 6, 'i'],
      [4, 6, 'p'],
    ],
  },
];
