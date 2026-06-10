// Hand-authored levels. Static grid uses:
//   '#' wall
//   '.' floor
// Entities are layered on top:
//   player: [x, y]
//   keys:   [[x, y, letter], ...]   lowercase; carry ONE at a time
//   doors:  [[x, y, letter], ...]   a door opens with (and consumes) its key
//   friend: [x, y, kind]            reach the friend to win
//
// Walking onto a key while carrying another SWAPS them (the carried key
// drops where the new one was) — nothing is ever lost, no stuck states
// beyond what undo fixes. Wrong key on a door: the door stays shut and
// wiggles; no penalty. Letters stay in the b/d/p/q confusion set.
//
// Authoring rules:
//  - Door cells are floor; the surrounding walls must make them gates.
//  - Decoy keys are encouraged (reading the letter IS the game).
//  - Every level must be solvable; verify with tools/check-key-maze.mjs.

export const LEVELS = [
  // L1: one key, one door. Teaches: key opens door.
  {
    grid: [
      '########',
      '#...#..#',
      '#......#',
      '#...#..#',
      '########',
    ],
    player: [1, 2],
    keys: [[1, 1, 'b']],
    doors: [[4, 2, 'b']],
    friend: [6, 2, 'bunny'],
  },

  // L2: two keys, one door — read the letter, the d is a decoy.
  {
    grid: [
      '########',
      '#...#..#',
      '#......#',
      '#...#..#',
      '########',
    ],
    player: [1, 2],
    keys: [
      [1, 1, 'b'],
      [1, 3, 'd'],
    ],
    doors: [[4, 2, 'b']],
    friend: [6, 2, 'chick'],
  },

  // L3: two doors in series; the d key waits between them.
  {
    grid: [
      '##########',
      '#..#...#.#',
      '#........#',
      '#..#...#.#',
      '##########',
    ],
    player: [1, 2],
    keys: [
      [1, 1, 'b'],
      [5, 1, 'd'],
    ],
    doors: [
      [3, 2, 'b'],
      [7, 2, 'd'],
    ],
    friend: [8, 2, 'frog'],
  },

  // L4: p and q doors with b and d decoys — all four confusables at once.
  {
    grid: [
      '##########',
      '#..#...#.#',
      '#........#',
      '#..#...#.#',
      '##########',
    ],
    player: [1, 2],
    keys: [
      [1, 1, 'p'],
      [1, 3, 'q'],
      [5, 1, 'b'],
      [5, 3, 'd'],
    ],
    doors: [
      [3, 2, 'p'],
      [7, 2, 'q'],
    ],
    friend: [8, 2, 'duck'],
  },

  // L5: four rooms; p door down, q door up — carry keys the long way round.
  {
    grid: [
      '#########',
      '#...#...#',
      '#...#...#',
      '##.###.##',
      '#.......#',
      '#.......#',
      '#########',
    ],
    player: [1, 1],
    keys: [
      [3, 2, 'p'],
      [1, 5, 'q'],
    ],
    doors: [
      [2, 3, 'p'],
      [6, 3, 'q'],
    ],
    friend: [6, 1, 'pig'],
  },

  // L6: q then p doors, with b and d decoys lying closest to the player.
  {
    grid: [
      '##########',
      '#..#..#..#',
      '#........#',
      '#..#..#..#',
      '##########',
    ],
    player: [1, 2],
    keys: [
      [1, 3, 'b'],
      [2, 1, 'q'],
      [4, 3, 'd'],
      [5, 1, 'p'],
    ],
    doors: [
      [3, 2, 'q'],
      [6, 2, 'p'],
    ],
    friend: [8, 2, 'bunny'],
  },

  // L7: twin b doors — both need their own b key; the d is a decoy.
  {
    grid: [
      '##########',
      '#..#..#..#',
      '#........#',
      '#..#..#..#',
      '##########',
    ],
    player: [1, 2],
    keys: [
      [1, 1, 'b'],
      [2, 3, 'b'],
      [1, 3, 'd'],
    ],
    doors: [
      [3, 2, 'b'],
      [6, 2, 'b'],
    ],
    friend: [8, 2, 'duck'],
  },

  // L8: the q key sits ON the path between the twin p doors — walking over
  // it swaps it into your hand, and the second p door won't open until you
  // swap back. Teaches the swap.
  {
    grid: [
      '##########',
      '#.#....#.#',
      '#........#',
      '#.#....#.#',
      '##########',
    ],
    player: [1, 2],
    keys: [
      [1, 1, 'p'],
      [4, 2, 'p'],
      [5, 2, 'q'],
    ],
    doors: [
      [2, 2, 'p'],
      [7, 2, 'p'],
    ],
    friend: [8, 2, 'sheep'],
  },

  // L9: a chain — the b room holds the d key, the d room holds the p key.
  {
    grid: [
      '##########',
      '#..#..#..#',
      '##.##.##.#',
      '#........#',
      '##.##.##.#',
      '#..#..#..#',
      '##########',
    ],
    player: [1, 3],
    keys: [
      [1, 1, 'b'],
      [4, 1, 'd'],
      [7, 1, 'p'],
      [2, 5, 'q'],
    ],
    doors: [
      [5, 2, 'b'],
      [8, 2, 'd'],
      [5, 4, 'p'],
    ],
    friend: [4, 5, 'frog'],
  },

  // L10: q opens the room with the d key; d opens the friend's room.
  // The b and p keys open nothing on the route — pure decoys.
  {
    grid: [
      '##########',
      '#..#..#..#',
      '##.##.##.#',
      '#........#',
      '##.##.##.#',
      '#..#..#..#',
      '##########',
    ],
    player: [8, 3],
    keys: [
      [1, 5, 'q'],
      [2, 5, 'b'],
      [1, 1, 'd'],
      [4, 1, 'p'],
    ],
    doors: [
      [2, 2, 'q'],
      [5, 2, 'b'],
      [5, 4, 'd'],
    ],
    friend: [4, 5, 'pig'],
  },

  // L11: a four-door chain — p unlocks q's room, q unlocks d's, d unlocks
  // b's, b unlocks the friend. A spare q in the open room tempts shortcuts.
  {
    grid: [
      '##########',
      '#..#..#..#',
      '##.##.##.#',
      '#........#',
      '##.##.##.#',
      '#..#..#..#',
      '##########',
    ],
    player: [1, 3],
    keys: [
      [1, 5, 'p'],
      [2, 5, 'q'],
      [1, 1, 'q'],
      [4, 1, 'd'],
      [7, 1, 'b'],
    ],
    doors: [
      [2, 2, 'p'],
      [5, 2, 'q'],
      [8, 2, 'd'],
      [5, 4, 'b'],
    ],
    friend: [4, 5, 'bunny'],
  },

  // L12: finale — the full b→d→q→p chain starting from the far side of the
  // hall, with decoys in the gated side rooms.
  {
    grid: [
      '##########',
      '#..#..#..#',
      '##.##.##.#',
      '#........#',
      '##.##.##.#',
      '#..#..#..#',
      '##########',
    ],
    player: [8, 3],
    keys: [
      [1, 3, 'b'],
      [1, 1, 'd'],
      [4, 1, 'q'],
      [7, 1, 'p'],
      [2, 5, 'q'],
      [1, 5, 'd'],
    ],
    doors: [
      [2, 2, 'b'],
      [5, 2, 'd'],
      [8, 2, 'q'],
      [5, 4, 'p'],
    ],
    friend: [4, 5, 'frog'],
  },
];
