// Timing curves for the room's small animations, taken from the design's CSS keyframes.
// Angles are in degrees with CSS's sign (negative = counter-clockwise on screen).
import { cubicBezier } from './roomLayout.ts';

const easeInOut = cubicBezier(0.42, 0, 0.58, 1);
const easeIn = cubicBezier(0.42, 0, 1, 1);
const cycle = (ms: number, period: number) => (((ms % period) + period) % period) / period;

const FLICKER_MS = 1100;
// steps(1): each value holds until the next keyframe
const FLICKER_STEPS: [number, number][] = [
    [0, 1],
    [0.18, 0.7],
    [0.24, 1],
    [0.61, 0.82],
    [0.66, 1],
];

// Screen opacity while the computer is hovered
export function flickerAt(ms: number): number {
    const p = cycle(ms, FLICKER_MS);
    let value = 1;
    for (const [at, v] of FLICKER_STEPS) if (p >= at) value = v;
    return value;
}

const TWITCH_MS = 2400;

// Ear angle while the cat is hovered: a quick flick at the start of every 2.4s
export function twitchAt(ms: number): number {
    const p = cycle(ms, TWITCH_MS);
    if (p < 0.06) return -12 * easeInOut(p / 0.06);
    if (p < 0.12) return -12 * (1 - easeInOut((p - 0.06) / 0.06));
    return 0;
}

const FLICK_MS = 500;

// Tail angle while the cat is hovered: 0 → -14deg over 0.5s, alternating
export function tailFlickAt(ms: number): number {
    const p = cycle(ms, FLICK_MS * 2) * 2;
    return -14 * (p <= 1 ? easeInOut(p) : easeInOut(2 - p));
}

export const STEAM_MS = 3400;
export const STEAM_HOVER_MS = 1500;
// Each wisp starts this far into its cycle
export const STEAM_OFFSETS = [0, 1100 / STEAM_MS, 2200 / STEAM_MS];

// One steam wisp at a point in its cycle. `rise` is in SVG units, up positive (the design moves 6 down to 16 up).
// `ms` is measured against STEAM_MS; callers speeding the steam up advance it faster.
export function steamAt(ms: number): { opacity: number; rise: number } {
    const p = cycle(ms, STEAM_MS);
    const opacity = p < 0.3 ? 0.7 * easeIn(p / 0.3) : 0.7 * (1 - easeIn((p - 0.3) / 0.7));
    return { opacity, rise: -6 + 22 * easeIn(p) };
}

const SWAY_MS = 4200;
const BREATH_MS = 3600;

// Idle life for the sleeping cat: the tail sways a few degrees and the body breathes
export function catIdleAt(ms: number, reducedMotion: boolean): { tail: number; breath: number } {
    if (reducedMotion) return { tail: 0, breath: 1 };
    return {
        tail: -4 * Math.sin(2 * Math.PI * cycle(ms, SWAY_MS)),
        breath: 1 + 0.02 * ((1 - Math.cos(2 * Math.PI * cycle(ms, BREATH_MS))) / 2),
    };
}
