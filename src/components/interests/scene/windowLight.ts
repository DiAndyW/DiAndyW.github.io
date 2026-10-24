import type { WindowState } from '../weather.ts';
import { TABLE, RUG_SURFACE, WINDOW_GLASS as G } from './roomSurfaces.ts';
export type Point = [number, number];
export type Surface = 'floor' | 'table' | 'rug';
export const SUN = { dawn: { s: 1.25, sy: 0.30 }, day: { s: 0.55, sy: 0.25 } } as const;
export const DIFFUSE_OUTER: Point[] = [[0, 2], [0, 5.8], [2, 6.3], [2, 2.5]];
export const DIFFUSE_INNER: Point[] = [[0, 2.4], [0, 5.4], [1.1, 5.7], [1.1, 2.7]];
export const surfaceHeight = (surface: Surface) => surface === 'table' ? TABLE.top : surface === 'rug' ? RUG_SURFACE.top : 0;
export function projectedGlass(time: keyof typeof SUN, height: number): Point[] {
    const { s, sy } = SUN[time];
    return [[G.zMin, G.yMin], [G.zMin, G.yMax], [G.zMax, G.yMax], [G.zMax, G.yMin]]
        .map(([z, y]) => [s * (y - height), z + sy * (y - height)]);
}
export function capsuleDistance(p: Point, a: Point, b: Point) {
    const dx = b[0] - a[0], dz = b[1] - a[1];
    const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dz) / (dx * dx + dz * dz || 1)));
    return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dz);
}
const disc = (p: Point, x: number, z: number, r: number) => Math.hypot(p[0] - x, p[1] - z) <= r;
// Distance in the SVG projection, for the design's screen-space bar/pole stroke widths.
export const screenPoint = ([x, z]: Point): Point => [(x - z) * 34.641, (x + z) * 20];
export function directShadow(p: Point, surface: Surface, time: keyof typeof SUN) {
    const { s, sy } = SUN[time];
    const h = surfaceHeight(surface);
    const project = (z: number, y: number): Point => [s * (y - h), z + sy * (y - h)];
    const q = screenPoint(p);
    if (capsuleDistance(q, screenPoint(project(3.9, 2)), screenPoint(project(3.9, 4.8))) <= 2.25) return true;
    if (surface !== 'rug' && capsuleDistance(q, screenPoint(project(2.2, 3.4)), screenPoint(project(5.6, 3.4))) <= Math.max(3, 6 * s) / 2) return true;
    if (surface === 'floor') {
        if (disc(p, TABLE.x + TABLE.top * s, TABLE.z + TABLE.top * sy, TABLE.radius)) return true;
        if (capsuleDistance(q, screenPoint([TABLE.x, TABLE.z]), screenPoint([TABLE.x + TABLE.poleTop * s, TABLE.z + TABLE.poleTop * sy])) <= 4.5) return true;
    }
    return surface === 'table' && disc(p, TABLE.x + TABLE.bowlHeight * s, TABLE.z + TABLE.bowlHeight * sy, TABLE.bowlRadius);
}
export function lightAt(p: Point, surface: Surface, state: WindowState): 'direct' | 'inner' | 'outer' | null {
    if (surface === 'table' && !disc(p, TABLE.x, TABLE.z, TABLE.radius)) return null;
    if (surface === 'rug' && !disc(p, RUG_SURFACE.x, RUG_SURFACE.z, RUG_SURFACE.radius)) return null;
    const direct = state.weather === 'clear' && (state.time === 'dawn' || state.time === 'day');
    if (direct) {
        const { s, sy } = SUN[state.time as keyof typeof SUN];
        const height = surfaceHeight(surface) + p[0] / s;
        const depth = p[1] - sy * p[0] / s;
        if (height < G.yMin || height > G.yMax || depth < G.zMin || depth > G.zMax) return null;
        return directShadow(p, surface, state.time as keyof typeof SUN) ? null : 'direct';
    }
    if (surface !== 'floor') return null;
    if (p[0] >= 0 && p[0] <= 1.1 && p[1] >= 2.4 + p[0] * 0.3 / 1.1 && p[1] <= 5.4 + p[0] * 0.3 / 1.1) return 'inner';
    if (p[0] >= 0 && p[0] <= 2 && p[1] >= 2 + p[0] * 0.25 && p[1] <= 5.8 + p[0] * 0.25) return 'outer';
    return null;
}
