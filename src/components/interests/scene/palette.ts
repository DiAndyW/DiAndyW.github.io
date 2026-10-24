// Every colour in the room, from the handoff's palette table (§3). Keep the greens and blues exact:
// they come straight from the globe favicon.

export type Tones = { top: string; lit: string; shade: string };

export const WALL_RIGHT = '#6c97d8';
export const WALL_LEFT = '#5b84c4';
export const WALL_CAP = { top: '#93b8ee', shade: '#4a6fae' } as const;

export const FLOOR = '#e3ab6e';
export const PLANK_LINE = '#d49c60';
export const SLAB = { lit: '#c98d52', shade: '#b37b45' } as const;

export const WOOD: Tones = { top: '#d0915a', lit: '#bd7e4a', shade: '#a46a3d' };
export const WOOD_LINE = '#a46a3d';
export const CRATE_INSIDE = '#7a4f2e';
export const KNOB = '#ffe3b0';

export const CREAM: Tones = { top: '#fff7ea', lit: '#f1e4cc', shade: '#ddccb0' };
export const SILL_TOP = '#fffaf2';

export const VINYL = { lit: '#2d2f3a', shade: '#23252e' } as const;
export const VINYL_GROOVE = '#464959';
export const RECORD_LABEL = '#f59a45';
export const TONEARM = '#dfe5ee';

export const BEZEL: Tones = { top: '#4b5a70', lit: '#2c3646', shade: '#232b38' };
export const STAND: Tones = { top: '#4b5a70', lit: '#3e4b5e', shade: '#333e4f' };
export const KEYS: Tones = { top: '#dfe5ee', lit: '#c7cfdb', shade: '#b3bccb' };
export const KEY_LINE = '#b3bccb';

export const MUG = { rim: '#f59585', coffee: '#6b4430', lit: '#ef7d6a', shade: '#d9695a' } as const;

export const BOWL = { rim: '#fffaf2', rice: '#ffffff', lit: '#fff7ea', shade: '#ecdcc0' } as const;
export const TOPPINGS = ['#c8743a', '#d98a4a', '#b5652f'] as const;
export const SCALLION = '#8fbf4f';
export const CHOPSTICKS = '#fff7ea';

export const RUG = { top: '#a9cd62', lip: '#8fad55', ring: '#c6e08a' } as const;

export const CAT = {
    lit: '#f59a45',
    shade: '#e0853a',
    stripe: '#d9762c',
    cream: '#ffe3c2',
    innerEar: '#ffb3a0',
    eye: '#4a2c1a',
    nose: '#ef8e86',
} as const;

export const LEAF = { lit: '#a9cd62', shade: '#8fad55' } as const;
export const POT = { soil: '#6b4430', lit: '#ef8a5c', shade: '#d97549', lipLit: '#f59a6c', lipShade: '#e0835a' } as const;

export const SLEEVES = ['#6fa0e6', '#ef7d6a', '#ffd76e'] as const;

export const GLOW = '#7bb3d1';

export const SCREEN = {
    sky: '#6fa0e6',
    sun: '#ffd76e',
    hill: '#a9cd62',
    hillShade: '#8fad55',
    platform: '#fff7ea',
    hero: '#f59a45',
} as const;
