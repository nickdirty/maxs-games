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

  // L9 "pad" — no flips, but letters scattered diagonally so the kid has
  // to figure out which letter goes to which target column.
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
      [3, 2, 'd'],
      [4, 3, 'p'],
      [5, 4, 'a'],
    ],
    targets: [
      [2, 6, 'p'],
      [3, 6, 'a'],
      [4, 6, 'd'],
    ],
  },

  // L10 "bed" — two b's at scrambled positions; kid has to decide which
  // one to flip into the d. The b nearer the gate is the natural pick.
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
      [3, 2, 'b'],
      [5, 3, 'b'],
      [3, 4, 'e'],
    ],
    targets: [
      [2, 6, 'b'],
      [3, 6, 'e'],
      [4, 6, 'd'],
    ],
  },

  // L11 "bid" — sideways push, two d's at scrambled positions. One d goes
  // through the top-row gate (flips to b for the b target), the other goes
  // straight to the d target. Player picks which.
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
      [2, 3, 'd'],
      [4, 2, 'i'],
      [4, 4, 'd'],
    ],
    targets: [
      [7, 2, 'b'],
      [7, 3, 'i'],
      [7, 4, 'd'],
    ],
  },

  // L12 "dad" — letters scrambled across the upper area. One b must flip
  // into a d (using the left-column gate); the existing d already matches
  // a target. Player has to recognise that one of the two d-targets gets
  // its letter directly and the other has to come from the b via the gate.
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
      [4, 2, 'b'],
      [3, 3, 'a'],
      [2, 3, 'd'],
    ],
    targets: [
      [2, 6, 'd'],
      [3, 6, 'a'],
      [4, 6, 'd'],
    ],
  },

  // L13 "pop" — letters scrambled across two rows. The q is offset from
  // the others; player has to figure out the flip happens via the
  // left-column gate, while the p must avoid it (would flip to q).
  {
    grid: [
      '##########',
      '#........#',
      '#........#',
      '#........#',
      '#.H......#',
      '#........#',
      '##########',
    ],
    player: [1, 1],
    letters: [
      [3, 2, 'q'],
      [5, 2, 'o'],
      [6, 3, 'p'],
    ],
    targets: [
      [2, 5, 'p'],
      [5, 5, 'o'],
      [7, 5, 'p'],
    ],
  },

  // L14 "dip" — sideways push, scrambled letters across rows. The q routes
  // through the gate (flips to p) for the bottom target; the d must avoid
  // the gate to stay as d for the top target. The kid has to recognise
  // that d going through the gate would flip to b and ruin it.
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
      [3, 2, 'q'],
      [4, 3, 'i'],
      [5, 2, 'd'],
    ],
    targets: [
      [7, 2, 'd'],
      [7, 3, 'i'],
      [7, 4, 'p'],
    ],
  },
];
