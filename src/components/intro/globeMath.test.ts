import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MAP_W, LA, LA_TARGET_X, lonLatToMap, finalStripOffset, spinStartOffset } from './globeMath.ts';

const close = (a: number, b: number, eps = 0.01) =>
    assert.ok(Math.abs(a - b) <= eps, `${a} not within ${eps} of ${b}`);

test('lonLatToMap places LA', () => {
    const { x, y } = lonLatToMap(LA.lon, LA.lat);
    close(x, 34.31);
    close(y, 31.08);
});

test('lonLatToMap corners', () => {
    assert.deepEqual(lonLatToMap(-180, 90), { x: 0, y: 0 });
    assert.deepEqual(lonLatToMap(180, -90), { x: 200, y: 100 });
});

test('finalStripOffset lands LA on its target', () => {
    close(finalStripOffset(LA.lon, LA_TARGET_X), -196.31);
});

test('finalStripOffset is in (-MAP_W, 0] and hits the target mod MAP_W', () => {
    for (const lon of [-180, -90, 0, 45, 179.9]) {
        for (const targetX of [0, 38, 99]) {
            const t = finalStripOffset(lon, targetX);
            assert.ok(t > -MAP_W && t <= 0, `offset ${t} out of range`);
            const r = (((lonLatToMap(lon, 0).x + t - targetX) % MAP_W) + MAP_W) % MAP_W;
            assert.ok(r < 1e-9 || MAP_W - r < 1e-9, `residual ${r}`);
        }
    }
});

test('spinStartOffset is one rotation behind and stays coverable by 3 strip copies', () => {
    const f = finalStripOffset(LA.lon, LA_TARGET_X);
    assert.equal(spinStartOffset(f), f - 200);
    assert.ok(spinStartOffset(f) >= -400);
});
