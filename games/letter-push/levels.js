// Hand-authored levels. Static grid uses:
//   '#' wall
//   '.' floor
//   'H' flip gate (mirrors a letter when the letter enters)
//   'R' rotation gate (spins a letter 180° when the letter enters)
// Entities are layered on top:
//   player: [x, y]
//   letters: [[x, y, char], ...] (char in {b, d, p, q})
//   targets: [[x, y, desired-char], ...]
//
// Transform pairs — flip: b↔d, p↔q; rotate: b↔q, d↔p. Chaining one of
// each reaches the remaining pairs (b↔p, d↔q), so any of the four letters
// can become any other, but only via both gate types.
//
// Authoring rules:
//  - Targets sit on floor cells (not on walls or gates).
//  - Gates only transform on entry, not on exit.
//  - Every level must be solvable; verify with tools/check-letter-push.mjs.

export const LEVELS = [
  // L1: pure push, no gates. Teaches movement + push.
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

  // L2: flip gate inline between letter and target. Teaches the flip: b mirrors to d.
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

  // L3: same shape, rotation gate. Same b, different gate: b spins to q.
  {
    grid: [
      '########',
      '#......#',
      '#...R..#',
      '#......#',
      '########',
    ],
    player: [1, 2],
    letters: [[2, 2, 'b']],
    targets: [[6, 2, 'q']],
  },

  // L4: gate is off-path; must push letter LEFT through gate, then back RIGHT.
  // Teaches detour planning. p flips to q.
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
    letters: [[4, 3, 'p']],
    targets: [[6, 3, 'q']],
  },

  // L5: two identical b's, two different gates. The flip row makes a d,
  // the rotate row makes a q — same letter in, different letter out.
  {
    grid: [
      '#########',
      '#.......#',
      '#...H...#',
      '#.......#',
      '#...R...#',
      '#.......#',
      '#########',
    ],
    player: [1, 1],
    letters: [
      [2, 2, 'b'],
      [2, 4, 'b'],
    ],
    targets: [
      [7, 2, 'd'],
      [7, 4, 'q'],
    ],
  },

  // L6: two letters; one needs the flip, one doesn't. Gate is shared danger.
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
  // line up the push. After the spin, the player has to loop back over the top.
  {
    grid: [
      '##########',
      '#........#',
      '#.####...#',
      '#........#',
      '#..R.....#',
      '##########',
    ],
    player: [1, 1],
    letters: [[5, 4, 'q']],
    targets: [[8, 4, 'b']],
  },

  // L8: gate chaining. One straight push through BOTH gates: b flips to d,
  // then d spins to p. Neither gate alone can make a p from a b.
  {
    grid: [
      '##########',
      '#........#',
      '#..H.R...#',
      '#........#',
      '##########',
    ],
    player: [1, 2],
    letters: [[2, 2, 'b']],
    targets: [[8, 2, 'p']],
  },

  // L9: two letters, one gate of each kind: p flips to q, q spins to b.
  {
    grid: [
      '##########',
      '#........#',
      '#....H...#',
      '#........#',
      '#....R...#',
      '#........#',
      '##########',
    ],
    player: [1, 1],
    letters: [
      [3, 2, 'p'],
      [3, 4, 'q'],
    ],
    targets: [
      [8, 2, 'q'],
      [8, 4, 'b'],
    ],
  },

  // ----- Word-spelling levels -----
  // Word levels use few gates (one, or one of each at the end) so the kid
  // has to figure out how to share/route through them. Layouts vary
  // direction (up/down/right) and shape so the puzzles don't all feel like
  // the same template rotated. Letters outside the b/d/p/q set (a, e, i,
  // o, u) pass through gates unchanged — inert blocks for routing purposes.

  // L10 "pad" — no gates, but letters scattered diagonally so the kid has
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

  // L11 "bed" — two b's at scrambled positions; kid has to decide which
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

  // L12 "bid" — sideways push. The q routes through the top-row rotation
  // gate (spins to b); the d goes straight and must avoid the gate
  // (would spin to p).
  {
    grid: [
      '##########',
      '#........#',
      '#..R.....#',
      '#........#',
      '#........#',
      '##########',
    ],
    player: [1, 1],
    letters: [
      [2, 3, 'q'],
      [4, 2, 'i'],
      [4, 4, 'd'],
    ],
    targets: [
      [7, 2, 'b'],
      [7, 3, 'i'],
      [7, 4, 'd'],
    ],
  },

  // L13 "dad" — letters scrambled across the upper area. The b must flip
  // into a d (using the left-column gate); the existing d already matches
  // a target and has to route AROUND the gate (would flip to b). Player
  // has to recognise which d-target gets its letter directly.
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

  // L14 "pop" — letters scrambled across two rows. The q flips to p via
  // the left-column gate, while the p must avoid it (would flip to q).
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

  // L15 "dip" — two identical d's at scrambled positions; kid has to decide
  // which one spins into the p (via the rotation gate) and which stays a d.
  {
    grid: [
      '##########',
      '#........#',
      '#........#',
      '#........#',
      '#...R....#',
      '##########',
    ],
    player: [1, 1],
    letters: [
      [3, 2, 'd'],
      [4, 3, 'i'],
      [5, 2, 'd'],
    ],
    targets: [
      [7, 2, 'd'],
      [7, 3, 'i'],
      [7, 4, 'p'],
    ],
  },

  // L16 "dab" — capstone. The q can only become a d by passing through
  // BOTH gates (stacked in the left column: flip, then spin, two changes
  // back to back); the a and b must route around the gate column.
  {
    grid: [
      '########',
      '#......#',
      '#......#',
      '#.H....#',
      '#.R....#',
      '#......#',
      '########',
    ],
    player: [1, 1],
    letters: [
      [3, 3, 'q'],
      [4, 2, 'a'],
      [5, 4, 'b'],
    ],
    targets: [
      [2, 5, 'd'],
      [3, 5, 'a'],
      [4, 5, 'b'],
    ],
  },
];
