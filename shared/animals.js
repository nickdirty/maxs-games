// Animal sprites shared across games. Distinguished by shape AND color
// (constraints.md). 40x40 viewBox, drop in any sized container.

export const ANIMAL_SVG = {
  sheep: `
<svg viewBox="0 0 40 40" aria-hidden="true">
  <circle cx="14" cy="16" r="7" fill="#f4f1e8"/>
  <circle cx="22" cy="13" r="7" fill="#f4f1e8"/>
  <circle cx="27" cy="19" r="7" fill="#f4f1e8"/>
  <circle cx="16" cy="23" r="8" fill="#f4f1e8"/>
  <circle cx="24" cy="25" r="7" fill="#f4f1e8"/>
  <ellipse cx="29" cy="13" rx="5" ry="6" fill="#5a5048"/>
  <circle cx="27.5" cy="11.5" r="1" fill="#fff"/>
  <circle cx="31" cy="11.5" r="1" fill="#fff"/>
</svg>`,
  pig: `
<svg viewBox="0 0 40 40" aria-hidden="true">
  <path d="M 9 12 L 14 16 L 8 17 Z" fill="#e8849e"/>
  <path d="M 31 12 L 26 16 L 32 17 Z" fill="#e8849e"/>
  <circle cx="20" cy="22" r="13" fill="#f2a0b5"/>
  <circle cx="15" cy="18" r="2" fill="#3a2530"/>
  <circle cx="25" cy="18" r="2" fill="#3a2530"/>
  <ellipse cx="20" cy="25" rx="6" ry="4.5" fill="#e8849e"/>
  <circle cx="17.8" cy="25" r="1.3" fill="#a05570"/>
  <circle cx="22.2" cy="25" r="1.3" fill="#a05570"/>
</svg>`,
  frog: `
<svg viewBox="0 0 40 40" aria-hidden="true">
  <circle cx="13" cy="12" r="5.5" fill="#6fcf6f"/>
  <circle cx="27" cy="12" r="5.5" fill="#6fcf6f"/>
  <circle cx="13" cy="11" r="2.4" fill="#26431f"/>
  <circle cx="27" cy="11" r="2.4" fill="#26431f"/>
  <ellipse cx="20" cy="24" rx="13" ry="11" fill="#6fcf6f"/>
  <path d="M 13 26 Q 20 31 27 26" stroke="#26431f" stroke-width="2" fill="none" stroke-linecap="round"/>
</svg>`,
  chick: `
<svg viewBox="0 0 40 40" aria-hidden="true">
  <circle cx="20" cy="22" r="12" fill="#ffd14d"/>
  <circle cx="20" cy="13" r="7.5" fill="#ffd14d"/>
  <circle cx="17.5" cy="12" r="1.6" fill="#3a2c10"/>
  <circle cx="22.5" cy="12" r="1.6" fill="#3a2c10"/>
  <path d="M 18 15.5 L 20 18 L 22 15.5 Z" fill="#f08c3a"/>
  <path d="M 9 24 Q 5 22 7 27 Q 9 29 11 27 Z" fill="#f0b93c"/>
  <path d="M 31 24 Q 35 22 33 27 Q 31 29 29 27 Z" fill="#f0b93c"/>
</svg>`,
  bunny: `
<svg viewBox="0 0 40 40" aria-hidden="true">
  <ellipse cx="14" cy="10" rx="3.6" ry="9" fill="#cfa6e8"/>
  <ellipse cx="26" cy="10" rx="3.6" ry="9" fill="#cfa6e8"/>
  <ellipse cx="14" cy="11" rx="1.8" ry="6" fill="#eed6f8"/>
  <ellipse cx="26" cy="11" rx="1.8" ry="6" fill="#eed6f8"/>
  <circle cx="20" cy="25" r="12" fill="#cfa6e8"/>
  <circle cx="15.5" cy="23" r="1.8" fill="#3a2545"/>
  <circle cx="24.5" cy="23" r="1.8" fill="#3a2545"/>
  <path d="M 18.5 27 L 20 28.5 L 21.5 27" stroke="#3a2545" stroke-width="1.8" fill="none" stroke-linecap="round"/>
</svg>`,
  duck: `
<svg viewBox="0 0 40 40" aria-hidden="true">
  <ellipse cx="21" cy="26" rx="13" ry="9" fill="#fff"/>
  <circle cx="13" cy="15" r="7.5" fill="#fff"/>
  <circle cx="11" cy="13.5" r="1.6" fill="#2a3540"/>
  <path d="M 5 15 Q 1 16 5 18 Q 7 19 8 17 Z" fill="#f08c3a"/>
  <path d="M 22 22 Q 30 18 32 24 Q 28 27 22 26 Z" fill="#e8e4da"/>
</svg>`,
};

export const ANIMAL_COLOR = {
  sheep: '#e8e2d0',
  pig: '#f2a0b5',
  frog: '#6fcf6f',
  chick: '#ffd14d',
  bunny: '#cfa6e8',
  duck: '#9ecfe8',
};
