import type { Project } from './projectsData.ts';

// Below this width the notepad gives way to the single-column phone layout.
export const NOTEPAD_MIN_WIDTH = 720;

const HASH_PREFIX = '#projects/';

// Pages run 0 ... count - 1, then wrap back to the first.
export function stepPage(page: number, delta: 1 | -1, count: number): number {
    return (page + delta + count) % count;
}

// The sheets that turn on the way from `from` to `to`, in the order they turn.
// Forward: each page from `from` up to (not including) `to` turns away over the rings.
// Backward: each page from just before `from` down to `to` comes back over the rings onto the pad.
export function turningPages(from: number, to: number, dir: 1 | -1, count: number): number[] {
    const pages: number[] = [];
    let p = from;
    while (p !== to) {
        if (dir === 1) pages.push(p);
        p = stepPage(p, dir, count);
        if (dir === -1) pages.push(p);
    }
    return pages;
}

export const FLIP_MS = 750; // one sheet turning on its own, and the last of a run
export const RIFFLE_MS = 420; // a sheet riffled past on the way
export const RIFFLE_GAP = 90; // between one sheet starting and the next
export const RIFFLE_SPAN = 450; // long runs start their sheets closer together, so they never drag on

// When each of `n` turning sheets starts, and how long it takes: the run riffles, the last sheet turns at full speed.
export function sheetTimings(n: number): { delay: number; duration: number }[] {
    const gap = n > 1 ? Math.min(RIFFLE_GAP, RIFFLE_SPAN / (n - 1)) : 0;
    return Array.from({ length: n }, (_, i) => ({
        delay: Math.round(i * gap),
        duration: i === n - 1 ? FLIP_MS : RIFFLE_MS,
    }));
}

export function pageFromHash(hash: string, projects: Pick<Project, 'slug'>[]): number | null {
    if (!hash.startsWith(HASH_PREFIX)) return null;
    const slug = hash.slice(HASH_PREFIX.length);
    const i = projects.findIndex((p) => p.slug === slug);
    return i === -1 ? null : i;
}

export function hashForPage(page: number, projects: Pick<Project, 'slug'>[]): string {
    return HASH_PREFIX + projects[page].slug;
}

export function announcement(page: number, projects: Pick<Project, 'title'>[]): string {
    return `Page ${page + 1} of ${projects.length}: ${projects[page].title}`;
}

// `velocity` is a speed (px/ms, never negative); direction comes from `dx`.
export function swipeOutcome(
    dx: number,
    dy: number,
    width: number,
    velocity: number,
): 'next' | 'prev' | 'stay' {
    if (Math.abs(dy) > Math.abs(dx)) return 'stay';
    if (Math.abs(dx) > 0.3 * width || velocity > 0.5) return dx < 0 ? 'next' : 'prev';
    return 'stay';
}

// Horizontal speed (px/ms, never negative) over the recent `samples` up to the release at (`x`, `t`).
// A flick that runs against the drag (left, then flicked back right) counts for nothing: swipeOutcome takes
// its direction from `dx`, the whole drag.
export function releaseSpeed(samples: { x: number; t: number }[], x: number, t: number, dx: number): number {
    const first = samples[0];
    const dt = t - first.t;
    const velocity = dt > 0 ? (x - first.x) / dt : 0;
    return Math.sign(velocity) === Math.sign(dx) ? Math.abs(velocity) : 0;
}

export function layoutForWidth(width: number): 'notepad' | 'single' {
    return width >= NOTEPAD_MIN_WIDTH ? 'notepad' : 'single';
}
