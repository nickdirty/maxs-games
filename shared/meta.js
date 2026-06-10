// Cross-game completion log feeding the hub pet. localStorage only.
// Schema: { total: n, byGame: { <game-id>: n } }. Pet growth stage and
// sticker book are DERIVED from total by the hub, so games only ever
// increment — nothing here can decay or be lost.

const KEY = 'maxs-games:meta:completions';

export function readCompletions() {
  try {
    const raw = localStorage.getItem(KEY);
    const v = raw ? JSON.parse(raw) : null;
    if (v && typeof v.total === 'number' && v.byGame) return v;
  } catch { /* corrupt or disabled — start fresh */ }
  return { total: 0, byGame: {} };
}

export function recordCompletion(gameId) {
  const v = readCompletions();
  v.total += 1;
  v.byGame[gameId] = (v.byGame[gameId] ?? 0) + 1;
  try { localStorage.setItem(KEY, JSON.stringify(v)); } catch { /* disabled */ }
  return v;
}
