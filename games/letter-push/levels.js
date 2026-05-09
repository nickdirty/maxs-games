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
];
