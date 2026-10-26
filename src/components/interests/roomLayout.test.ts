import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
    ANCHORS,
    reframeViewport,
    FOCUS_ZOOM,
    HIT_BOXES,
    INTEREST_IDS,
    SHELL_POINTS,
    easeSwoop,
    easeReturn,
    focusFrame,
    glowAt,
    lerpFrame,
    projectToScreen,
    restFrame,
    screenRect,
    type CameraFrame,
    type Rect,
    type Viewport,
} from './roomLayout.ts';

const DESKTOP: Viewport = { width: 1000, height: 680 };
const MOBILE: Viewport = { width: 358, height: 448 };
const PHONE: Viewport = { width: 390, height: 844 };

const close = (a: number, b: number, eps: number, msg?: string) =>
    assert.ok(Math.abs(a - b) <= eps, `${msg ?? ''} expected ${b}, got ${a}`);

test('return camera retraces the opening camera at every mirrored time', () => {
    const inline = { left: 8, top: 180, width: 359, height: 449 };
    const fullscreen = { left: 0, top: 0, width: 375, height: 812 };
    const rest = reframeViewport(restFrame(inline), inline, fullscreen);
    const focused = focusFrame('music', fullscreen, true);
    for (let i = 0; i <= 100; i++) {
        const t = i / 100;
        const opening = lerpFrame(rest, focused, easeSwoop(1 - t));
        const returning = lerpFrame(focused, rest, easeReturn(t));
        close(returning.zoom, opening.zoom, 1e-9);
        returning.target.forEach((value, axis) => close(value, opening.target[axis], 1e-9));
    }
});

test('rest frame fits the shell with a 4% margin', () => {
    for (const vp of [DESKTOP, MOBILE, PHONE]) {
        const frame = restFrame(vp);
        let minMargin = 1;
        for (const p of SHELL_POINTS) {
            const { x, y } = projectToScreen(p, frame, vp);
            for (const v of [x, y]) {
                assert.ok(v >= 0.04 - 1e-9 && v <= 0.96 + 1e-9, `${JSON.stringify(vp)} point ${p} → ${v}`);
                minMargin = Math.min(minMargin, v, 1 - v);
            }
        }
        assert.ok(minMargin < 0.05, `fit is not tight on ${JSON.stringify(vp)}: ${minMargin}`);
    }
});

test('the shell includes the slab bottom and wall tops', () => {
    const ys = SHELL_POINTS.map((p) => p[1]);
    assert.equal(Math.min(...ys), -0.4);
    assert.equal(Math.max(...ys), 6);
});

test('desktop focus lands at 27% / 49%', () => {
    for (const id of INTEREST_IDS) {
        const p = projectToScreen(ANCHORS[id], focusFrame(id, DESKTOP), DESKTOP);
        close(p.x, 0.27, 1e-6, id);
        close(p.y, 0.49, 1e-6, id);
    }
});

test('phone focus lands at 50% / 22%', () => {
    for (const id of INTEREST_IDS) {
        const p = projectToScreen(ANCHORS[id], focusFrame(id, PHONE), PHONE);
        close(p.x, 0.5, 1e-6, id);
        close(p.y, 0.22, 1e-6, id);
    }
});

test('the bottom sheet frames at 50% / 22% on a wider screen too', () => {
    const tablet: Viewport = { width: 768, height: 1024 };
    for (const id of INTEREST_IDS) {
        const p = projectToScreen(ANCHORS[id], focusFrame(id, tablet, true), tablet);
        close(p.x, 0.5, 1e-6, id);
        close(p.y, 0.22, 1e-6, id);
    }
});

test('focus zoom is relative to the rest zoom', () => {
    close(focusFrame('food', DESKTOP).zoom / restFrame(DESKTOP).zoom, 3.2, 1e-9);
    assert.deepEqual(FOCUS_ZOOM, { music: 2.5, games: 2.4, food: 3.2, cats: 3.0 });
});

const inside = (r: Rect, p: { x: number; y: number }) => p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;
const overlaps = (a: Rect, b: Rect) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

test('rest hit rects contain their anchors and lie inside the stage', () => {
    for (const vp of [DESKTOP, MOBILE]) {
        const frame = restFrame(vp);
        for (const id of INTEREST_IDS) {
            const r = screenRect(HIT_BOXES[id], frame, vp);
            assert.ok(inside(r, projectToScreen(ANCHORS[id], frame, vp)), id);
            assert.ok(r.x >= 0 && r.y >= 0 && r.x + r.w <= 1 && r.y + r.h <= 1, `${id} ${JSON.stringify(r)}`);
        }
    }
});

test('rest hit rects do not overlap', () => {
    for (const vp of [DESKTOP, MOBILE]) {
        const frame = restFrame(vp);
        const rects = INTEREST_IDS.map((id) => [id, screenRect(HIT_BOXES[id], frame, vp)] as const);
        for (let i = 0; i < rects.length; i++) {
            for (let j = i + 1; j < rects.length; j++) {
                assert.ok(!overlaps(rects[i][1], rects[j][1]), `${rects[i][0]} overlaps ${rects[j][0]}`);
            }
        }
    }
});

test('lerpFrame hits its endpoints and retargets without a jump', () => {
    const a: CameraFrame = { target: [0, 0, 0], zoom: 1 };
    const b: CameraFrame = { target: [4, 2, -2], zoom: 3 };
    const c: CameraFrame = { target: [-1, 5, 1], zoom: 2 };
    assert.deepEqual(lerpFrame(a, b, 0), a);
    assert.deepEqual(lerpFrame(a, b, 1), b);
    const m = lerpFrame(a, b, 0.4);
    assert.deepEqual(lerpFrame(m, c, 0), m);
});

test('easeSwoop starts slow, ends at 1, and never goes backwards', () => {
    assert.equal(easeSwoop(0), 0);
    close(easeSwoop(1), 1, 1e-9);
    assert.ok(easeSwoop(0.2) < 0.1, `easeSwoop(0.2) = ${easeSwoop(0.2)}`);
    let prev = 0;
    for (let i = 1; i <= 50; i++) {
        const v = easeSwoop(i / 50);
        assert.ok(v >= prev - 1e-9, `not monotonic at ${i / 50}`);
        prev = v;
    }
});

test('glowAt pulses in size at steady brightness on a staggered 4s cycle', () => {
    const lo = glowAt(0, 'music', false);
    close(lo.opacity, 0.3, 1e-9);
    close(lo.scale, 0.94, 1e-9);
    const hi = glowAt(2000, 'music', false);
    close(hi.opacity, 0.3, 1e-9);
    close(hi.scale, 1.08, 1e-9);
    const cats = glowAt(0, 'cats', false);
    const music = glowAt(1000, 'music', false);
    close(cats.opacity, music.opacity, 1e-9);
    close(cats.scale, music.scale, 1e-9);
});

test('glowAt holds still under reduced motion', () => {
    assert.deepEqual(glowAt(1234, 'games', true), { opacity: 0.3, scale: 1 });
});

// The fullscreen layer changes bounds; every world point must keep its screen pixels
// before the camera starts moving. This also checks that the room is never stretched.
test('viewport reframing preserves screen pixels and proportions when opening and closing', () => {
    const inline = { left: 12, top: 180, width: 351, height: 439 };
    const fullscreen = { left: 0, top: 0, width: 375, height: 812 };
    for (const [from, to] of [[inline, fullscreen], [fullscreen, inline]]) {
        const frame = restFrame(from);
        const reframed = reframeViewport(frame, from, to);
        for (const point of [...SHELL_POINTS, ...Object.values(ANCHORS)]) {
            const before = projectToScreen(point, frame, from);
            const after = projectToScreen(point, reframed, to);
            close(from.left + before.x * from.width, to.left + after.x * to.width, 1e-8);
            close(from.top + before.y * from.height, to.top + after.y * to.height, 1e-8);
        }
    }
});

test('hover settles the halo above its pulse peak and blends back without a jump', () => {
    for (const now of [0, 1000, 2000, 3000, 4000]) {
        const idle = glowAt(now, 'music', false);
        const hovered = glowAt(now, 'music', false, 1);
        const halfway = glowAt(now, 'music', false, 0.5);
        close(hovered.scale, 1.14, 1e-9);
        close(halfway.scale, (idle.scale + hovered.scale) / 2, 1e-9);
        close(glowAt(now, 'music', false, 0).scale, idle.scale, 1e-9);
        assert.deepEqual(glowAt(now, 'music', true, 1), { opacity: 0.3, scale: 1 });
    }
});
