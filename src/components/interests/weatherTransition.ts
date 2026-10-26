import type { WindowState } from './weather.ts';

export type WeatherFrame = { from: WindowState; to: WindowState; mix: number; rain: number; animating: boolean };
const same = (a: WindowState, b: WindowState) => a.weather === b.weather && a.time === b.time;
const rainy = (s: WindowState) => s.weather === 'rainy' ? 1 : 0;
const ease = (t: number) => t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
export function transitionDuration(a: WindowState, b: WindowState, reduced: boolean, visible: boolean) {
    if (reduced || !visible || same(a, b)) return 0;
    return a.weather !== b.weather ? 1600 : 1200;
}

export function createWeatherTransition(initial: WindowState) {
    let from = initial;
    let to = initial;
    let start = 0;
    let duration = 0;
    let queued: WindowState | null = null;
    const begin = (next: WindowState, now: number, ms: number) => {
        from = to;
        to = next;
        start = now;
        duration = ms;
        if (!ms) from = to;
    };
    const frame = (now: number): WeatherFrame => {
        if (duration && now >= start + duration) {
            const ended = start + duration;
            from = to;
            duration = 0;
            if (queued) {
                const next = queued;
                queued = null;
                begin(next, ended, transitionDuration(to, next, false, true));
                return frame(now);
            }
        }
        const elapsed = Math.max(0, now - start);
        const mix = duration ? ease(Math.min(1, elapsed / duration)) : 1;
        const rainMix = duration ? ease(Math.min(1, elapsed / 600)) : 1;
        return { from, to, mix, rain: rainy(from) + (rainy(to) - rainy(from)) * rainMix, animating: duration > 0 };
    };
    return {
        frame,
        finish() {
            to = queued ?? to;
            from = to;
            queued = null;
            duration = 0;
        },
        set(next: WindowState, now: number, reduced: boolean, visible: boolean) {
            frame(now);
            if (reduced || !visible) {
                queued = null;
                begin(next, now, 0);
            } else if (duration) {
                queued = same(next, to) ? null : next;
            } else if (!same(next, to)) {
                begin(next, now, transitionDuration(to, next, reduced, visible));
            }
        },
    };
}
