// The hub pet: a critter that grows as levels get finished anywhere.
// Stage and stickers are pure functions of the completion total — nothing
// decays, nothing is time-based, nothing nags (see docs/roadmap.md).

// Total completions needed to *reach* each stage.
const STAGE_AT = [0, 3, 10, 25, 60];

export function petStage(total) {
  let s = 0;
  for (let i = 0; i < STAGE_AT.length; i++) if (total >= STAGE_AT[i]) s = i;
  return s;
}

// One sticker per finished level, in roster order. Caps at the roster;
// the pet just stays at full glow after that.
export const STICKER_ROSTER = [
  '🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯',
  '🦁','🐮','🐷','🐸','🐵','🐔','🐧','🐦','🐤','🦆',
  '🦉','🐴','🦄','🐝','🦋','🐌','🐞','🐠','🐟','🐬',
  '🐳','🐢','🦎','🐙','🦀','🐿','🦔','🐘','🦒','🦓',
];

export function stickersEarned(total) {
  return STICKER_ROSTER.slice(0, Math.min(total, STICKER_ROSTER.length));
}

const SHADOW = '<ellipse cx="60" cy="103" rx="32" ry="7" fill="rgba(40,70,50,0.12)"/>';
const EGG_BOTTOM = `
  <path d="M 30 62 C 30 88 42 102 60 102 C 78 102 90 88 90 62
           L 82 68 L 74 60 L 66 68 L 58 60 L 50 68 L 42 60 L 34 68 Z"
        fill="#fff6e4" stroke="#e8d9b8" stroke-width="3"/>
  <circle cx="48" cy="80" r="6" fill="#cde8d0"/>
  <circle cx="70" cy="86" r="5" fill="#cde8d0"/>`;

function face(cx, cy, scale = 1) {
  const s = scale;
  return `
  <circle cx="${cx - 11 * s}" cy="${cy}" r="${3.4 * s}" fill="#2a3a2e"/>
  <circle cx="${cx + 11 * s}" cy="${cy}" r="${3.4 * s}" fill="#2a3a2e"/>
  <path d="M ${cx - 6 * s} ${cy + 8 * s} Q ${cx} ${cy + 13 * s} ${cx + 6 * s} ${cy + 8 * s}"
        stroke="#2a3a2e" stroke-width="${2.5 * s}" fill="none" stroke-linecap="round"/>`;
}

const STAGE_SVG = [
  // 0: an egg with green speckles
  `${SHADOW}
   <path d="M 60 20 C 81 20 92 46 92 68 C 92 90 78 103 60 103
            C 42 103 28 90 28 68 C 28 46 39 20 60 20 Z"
         fill="#fff6e4" stroke="#e8d9b8" stroke-width="3"/>
   <circle cx="49" cy="56" r="6" fill="#cde8d0"/>
   <circle cx="70" cy="74" r="8" fill="#cde8d0"/>
   <circle cx="63" cy="42" r="5" fill="#cde8d0"/>`,

  // 1: hatching — head out, shell still on
  `${SHADOW}
   <circle cx="60" cy="46" r="24" fill="#7fcf90"/>
   ${face(60, 44)}
   ${EGG_BOTTOM}`,

  // 2: hatchling with a sprout
  `${SHADOW}
   <path d="M 60 30 Q 58 18 48 16 Q 58 14 62 22 Q 66 12 74 14 Q 66 18 64 30 Z" fill="#4ea060"/>
   <circle cx="60" cy="66" r="34" fill="#7fcf90"/>
   <ellipse cx="60" cy="80" rx="20" ry="14" fill="#d8f0dc"/>
   ${face(60, 60, 1.1)}`,

  // 3: grown — ears, tail, blush
  `${SHADOW}
   <path d="M 36 36 Q 28 18 44 22 Q 50 24 46 38 Z" fill="#4ea060"/>
   <path d="M 84 36 Q 92 18 76 22 Q 70 24 74 38 Z" fill="#4ea060"/>
   <path d="M 90 84 Q 106 80 102 66 Q 112 78 98 90 Z" fill="#4ea060"/>
   <circle cx="60" cy="64" r="38" fill="#7fcf90"/>
   <ellipse cx="60" cy="80" rx="22" ry="16" fill="#d8f0dc"/>
   <circle cx="42" cy="68" r="5" fill="#f2a0b5" opacity="0.7"/>
   <circle cx="78" cy="68" r="5" fill="#f2a0b5" opacity="0.7"/>
   ${face(60, 58, 1.2)}`,

  // 4: full glow — sparkles
  `${SHADOW}
   <path d="M 36 36 Q 28 18 44 22 Q 50 24 46 38 Z" fill="#4ea060"/>
   <path d="M 84 36 Q 92 18 76 22 Q 70 24 74 38 Z" fill="#4ea060"/>
   <path d="M 90 84 Q 106 80 102 66 Q 112 78 98 90 Z" fill="#4ea060"/>
   <circle cx="60" cy="64" r="38" fill="#7fcf90"/>
   <ellipse cx="60" cy="80" rx="22" ry="16" fill="#d8f0dc"/>
   <circle cx="42" cy="68" r="5" fill="#f2a0b5" opacity="0.7"/>
   <circle cx="78" cy="68" r="5" fill="#f2a0b5" opacity="0.7"/>
   ${face(60, 58, 1.2)}
   <path d="M 18 30 L 21 37 L 28 40 L 21 43 L 18 50 L 15 43 L 8 40 L 15 37 Z" fill="#ffd14d"/>
   <path d="M 100 18 L 102.5 24 L 108 26 L 102.5 28 L 100 34 L 97.5 28 L 92 26 L 97.5 24 Z" fill="#ffd14d"/>
   <path d="M 96 98 L 98 103 L 103 105 L 98 107 L 96 112 L 94 107 L 89 105 L 94 103 Z" fill="#ffd14d"/>`,
];

export function petSVG(stage) {
  return `<svg viewBox="0 0 120 120" aria-hidden="true">${STAGE_SVG[stage] ?? STAGE_SVG[0]}</svg>`;
}
