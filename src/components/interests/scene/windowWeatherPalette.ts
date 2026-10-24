import type { DayTime, Weather, WindowState } from '../weather';

export type ExteriorPalette = {
    sky: string; horizon: string | null; cloudBack: string | null; cloudFront: string | null;
    treesBack: string; treesFront: string; rain: string; drop: string;
};
type ExteriorRow = [string, string | null, string | null, string | null, string, string, string?, string?];
const exterior = ([sky, horizon, cloudBack, cloudFront, treesBack, treesFront, rain = '#8fb0dc', drop = '#b9d0ee']: ExteriorRow): ExteriorPalette =>
    ({ sky, horizon, cloudBack, cloudFront, treesBack, treesFront, rain, drop });

// Handoff §3 / LiveTable. Artwork-only changes (including pending phone legibility) stay here.
export const EXTERIOR: Record<Weather, Record<DayTime, ExteriorPalette>> = {
    clear: {
        dawn: exterior(['#a9bde6', '#f7c9a3', '#fde8d6', '#f6d2bd', '#5b6c96', '#4a5a84']),
        day: exterior(['#7fb2f0', '#b4d4f7', '#ffffff', '#e6f0fc', '#6f9a52', '#5a8444']),
        dusk: exterior(['#6c6fae', '#f4a072', '#f6b49a', '#e39a92', '#3d3962', '#312e53']),
        night: exterior(['#1b2747', '#22325a', null, null, '#141e36', '#0f1729']),
    },
    cloudy: {
        dawn: exterior(['#b9bccb', '#e6c6b8', '#cfd0db', '#dcd9e2', '#5e677c', '#4e566c']),
        day: exterior(['#bccad8', '#d3dbe4', '#dfe6ee', '#eaeff4', '#66806b', '#566e5b']),
        dusk: exterior(['#807a98', '#c4989b', '#938caa', '#a39bb6', '#423f58', '#36344a']),
        night: exterior(['#222c45', '#273150', '#2c3754', '#333f5e', '#18203a', '#131a30']),
    },
    rainy: {
        dawn: exterior(['#8f95ad', '#b9a5aa', '#a1a7bc', '#afb4c7', '#4c5571', '#3f4761', '#eef2f8', '#f4f7fb']),
        day: exterior(['#95a8bc', '#abbacb', '#aab9c9', '#b9c6d4', '#50675a', '#43594d', '#f0f4f8', '#f7f9fc']),
        dusk: exterior(['#5f5b7d', '#8d748a', '#6f6b8d', '#7c789a', '#302e49', '#28263e', '#cbc5e2', '#ddd9ef']),
        night: exterior(['#26365a', null, '#2f4168', '#35497a', '#1f2d4d', '#18233d', '#8fb0dc', '#b9d0ee']),
    },
};
export const EXTERIOR_PATHS = {
    horizon: 'M-4 86 L-4 50 C20 46 40 48 60 46 C76 44 90 47 104 45 L104 86 Z',
    puffBack: 'M14 27 C13 22 19 19 23 21 C25 16 33 16 35 22 C39 21 42 24 41 27 Z',
    puffFront: 'M62 17 C61 13 66 10 69 12 C71 8 77 8 78 13 C81 13 83 15 82 17 Z',
    heavyBack: 'M-4 36 C8 28 20 32 30 26 C42 20 54 26 64 21 C76 15 90 22 104 17 L104 -4 L-4 -4 Z',
    cloudBack: 'M-4 22 C8 14 18 18 26 14 C36 8 50 12 58 9 C70 4 84 10 104 6 L104 -4 L-4 -4 Z',
    cloudyUpper: 'M-4 22 C8 14 18 18 26 14 C36 8 50 12 58 9 C70 4 84 10 104 6 L104 -4 L-4 -4 Z',
    cloudFront: 'M-4 10 C10 6 22 8 34 4 C46 0 60 4 74 1 C86 -2 96 2 104 0 L104 -4 L-4 -4 Z',
    treesBack: 'M-4 86 L-4 64 C2 58 8 58 12 62 C16 54 24 54 28 61 C33 57 39 57 43 63 C48 56 56 56 60 62 C64 58 70 58 74 63 C79 55 88 55 92 61 C96 58 100 58 104 61 L104 86 Z',
    treesFront: 'M-4 86 L-4 72 C6 68 16 70 24 73 C36 67 50 68 60 72 C72 67 86 68 104 71 L104 86 Z',
};
// New SVG artwork uses a negative-X window mapping. Existing rainy paths retain today's
// canvas orientation so rainy-night remains pixel-identical; new paths follow the boards.
export const REFLECT_PATHS = new Set(['horizon', 'puffBack', 'puffFront', 'heavyBack', 'cloudyUpper']);
export const STARS = { color: '#ffe9b0', dots: [[12, 10, 0.8], [31, 21, 0.7], [52, 8, 1], [71, 25, 0.7], [88, 12, 0.9], [40, 34, 0.7]] };
export const DIFFUSE_COLORS: Record<Weather, Record<DayTime, [string, string]>> = {
    clear: { dawn: ['#f7c78c', '#f7c78c'], day: ['#f6cf98', '#f6cf98'], dusk: ['#e8b07b', '#edba88'], night: ['#dcab7c', '#dfb186'] },
    cloudy: { dawn: ['#e8b47b', '#ecbd87'], day: ['#e9b67d', '#eec18c'], dusk: ['#e3ab79', '#e6b283'], night: ['#e0ab74', '#e2b07c'] },
    rainy: { dawn: ['#e7b178', '#eab882'], day: ['#e8b37a', '#ebbb85'], dusk: ['#e2a977', '#e4ae7e'], night: ['#e0ab74', '#e2b07c'] },
};
export const DIRECT_COLORS = { dawn: { floor: '#f7c78c', rug: '#c5e07e', table: '#e8ab70' }, day: { floor: '#f6cf98', rug: '#c8e389', table: '#e6b27d' } };
export const exteriorFor = (s: WindowState) => EXTERIOR[s.weather][s.time];
