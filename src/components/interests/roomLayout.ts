// Camera and screen math for the Interests room, shared by the three.js scene and the React overlays.
// World axes: X along the right-hand back wall, Y up, Z along the left-hand back wall.
// The handoff's (x, depth, height) maps to [x, height, depth].

export type InterestId = 'music' | 'games' | 'food' | 'cats';
export const INTEREST_IDS: readonly InterestId[] = ['music', 'games', 'food', 'cats'];

export type Vec3 = [number, number, number];
export type Viewport = { width: number; height: number };
export type CameraFrame = { target: Vec3; zoom: number };
export type Box = { min: Vec3; max: Vec3 };
// Fractions of the viewport, origin top-left
export type Rect = { x: number; y: number; w: number; h: number };

export const ROOM = { width: 12, depth: 8, wallHeight: 6 } as const;
const SLAB = 0.4;
const WALL = 0.3;

const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const scale = (a: Vec3, k: number): Vec3 => [a[0] * k, a[1] * k, a[2] * k];
const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const normalize = (a: Vec3): Vec3 => scale(a, 1 / Math.hypot(...a));

// The camera sits at target + ISO_DIRECTION * distance, looking back at the target.
export const ISO_DIRECTION: Vec3 = normalize([1, 1, 1]);
const FORWARD = scale(ISO_DIRECTION, -1);
export const CAMERA_RIGHT: Vec3 = normalize(cross(FORWARD, [0, 1, 0]));
export const CAMERA_UP: Vec3 = cross(CAMERA_RIGHT, FORWARD);

// World units visible vertically at zoom 1
export const VIEW_HEIGHT = 10;
export const REST_TARGET: Vec3 = [6, 0.9, 4];

// Outer corners of the floor slab, walls and wall caps: what the rest view has to fit.
export const SHELL_POINTS: readonly Vec3[] = [
    [-WALL, -SLAB, -WALL], [ROOM.width, -SLAB, -WALL], [-WALL, -SLAB, ROOM.depth], [ROOM.width, -SLAB, ROOM.depth],
    [-WALL, ROOM.wallHeight, -WALL], [ROOM.width, ROOM.wallHeight, -WALL], [-WALL, ROOM.wallHeight, ROOM.depth],
];

// Invisible click targets, a little larger than each object
export const HIT_BOXES: Record<InterestId, Box> = {
    music: { min: [1.0, 1.6, 0.1], max: [3.2, 2.1, 1.4] },
    games: { min: [5.8, 2.5, 0.3], max: [8.8, 4.7, 1.0] },
    food: { min: [1.0, 1.55, 4.3], max: [3.0, 2.3, 6.3] },
    cats: { min: [6.4, 0, 4.4], max: [8.4, 0.8, 5.6] },
};

export const ANCHORS = Object.fromEntries(
    INTEREST_IDS.map((id) => [id, scale(add(HIT_BOXES[id].min, HIT_BOXES[id].max), 0.5)]),
) as Record<InterestId, Vec3>;

// Multipliers on the rest zoom
export const FOCUS_ZOOM: Record<InterestId, number> = { music: 2.5, games: 2.4, food: 3.2, cats: 3.0 };
export const SWOOP_MS = 850;
export const GLOW_OFFSET_MS: Record<InterestId, number> = { music: 0, cats: -750, food: -1500, games: -2250 };

const REST_MARGIN = 0.04;
// Where the focused object lands: left of the desktop panel, or above the phone's bottom sheet
const FOCUS_DESKTOP = { x: 0.27, y: 0.49 };
const FOCUS_SHEET = { x: 0.5, y: 0.22 };

export const isMobile = (vp: Viewport) => vp.width < 640;

const halfExtents = (zoom: number, vp: Viewport) => {
    const halfH = VIEW_HEIGHT / (2 * zoom);
    return { halfW: (halfH * vp.width) / vp.height, halfH };
};

export function projectToScreen(p: Vec3, frame: CameraFrame, vp: Viewport): { x: number; y: number } {
    const { halfW, halfH } = halfExtents(frame.zoom, vp);
    const d = sub(p, frame.target);
    return { x: 0.5 + dot(d, CAMERA_RIGHT) / (2 * halfW), y: 0.5 - dot(d, CAMERA_UP) / (2 * halfH) };
}

// Centres the room on screen, then takes the largest zoom that keeps a 4% margin on every side.
export function restFrame(vp: Viewport): CameraFrame {
    const xs = SHELL_POINTS.map((p) => dot(sub(p, REST_TARGET), CAMERA_RIGHT));
    const ys = SHELL_POINTS.map((p) => dot(sub(p, REST_TARGET), CAMERA_UP));
    const [minX, maxX, minY, maxY] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
    const target = add(REST_TARGET, add(scale(CAMERA_RIGHT, (minX + maxX) / 2), scale(CAMERA_UP, (minY + maxY) / 2)));
    const usable = 1 - 2 * REST_MARGIN;
    const zoom = Math.min(
        (usable * VIEW_HEIGHT * vp.width) / vp.height / (maxX - minX),
        (usable * VIEW_HEIGHT) / (maxY - minY),
    );
    return { target, zoom };
}

// `sheet` says whether the panel is the bottom sheet; it defaults to the phone layout's own test
export function focusFrame(id: InterestId, vp: Viewport, sheet = isMobile(vp)): CameraFrame {
    const zoom = restFrame(vp).zoom * FOCUS_ZOOM[id];
    const { halfW, halfH } = halfExtents(zoom, vp);
    const at = sheet ? FOCUS_SHEET : FOCUS_DESKTOP;
    const shift = add(scale(CAMERA_RIGHT, (at.x - 0.5) * 2 * halfW), scale(CAMERA_UP, (0.5 - at.y) * 2 * halfH));
    return { target: sub(ANCHORS[id], shift), zoom };
}

export function screenRect(box: Box, frame: CameraFrame, vp: Viewport): Rect {
    const pts = [0, 1, 2, 3, 4, 5, 6, 7].map((i) =>
        projectToScreen(
            [i & 1 ? box.max[0] : box.min[0], i & 2 ? box.max[1] : box.min[1], i & 4 ? box.max[2] : box.min[2]],
            frame,
            vp,
        ),
    );
    const x = Math.min(...pts.map((p) => p.x));
    const y = Math.min(...pts.map((p) => p.y));
    return { x, y, w: Math.max(...pts.map((p) => p.x)) - x, h: Math.max(...pts.map((p) => p.y)) - y };
}

export function lerpFrame(a: CameraFrame, b: CameraFrame, t: number): CameraFrame {
    return { target: add(a.target, scale(sub(b.target, a.target), t)), zoom: a.zoom + (b.zoom - a.zoom) * t };
}

// CSS-style cubic-bezier timing function
export function cubicBezier(x1: number, y1: number, x2: number, y2: number): (t: number) => number {
    const bez = (a: number, b: number, s: number) => 3 * a * s * (1 - s) ** 2 + 3 * b * s * s * (1 - s) + s ** 3;
    const slope = (a: number, b: number, s: number) => 3 * a * (1 - s) ** 2 + 6 * (b - a) * s * (1 - s) + 3 * (1 - b) * s * s;
    return (t) => {
        if (t <= 0) return 0;
        if (t >= 1) return 1;
        let s = t;
        for (let i = 0; i < 8; i++) {
            const d = slope(x1, x2, s);
            if (Math.abs(d) < 1e-6) break;
            s -= (bez(x1, x2, s) - t) / d;
        }
        if (s < 0 || s > 1 || Math.abs(bez(x1, x2, s) - t) > 1e-6) {
            let lo = 0;
            let hi = 1;
            for (let i = 0; i < 40; i++) {
                s = (lo + hi) / 2;
                if (bez(x1, x2, s) < t) lo = s;
                else hi = s;
            }
        }
        return bez(y1, y2, s);
    };
}

export const easeSwoop = cubicBezier(0.7, 0, 0.2, 1);

const PULSE_MS = 3000;

export function glowAt(nowMs: number, id: InterestId, reducedMotion: boolean): { opacity: number; scale: number } {
    if (reducedMotion) return { opacity: 0.23, scale: 1 };
    const phase = ((((nowMs - GLOW_OFFSET_MS[id]) % PULSE_MS) + PULSE_MS) % PULSE_MS) / PULSE_MS;
    const k = (1 - Math.cos(2 * Math.PI * phase)) / 2;
    return { opacity: 0.12 + 0.22 * k, scale: 0.96 + 0.07 * k };
}
