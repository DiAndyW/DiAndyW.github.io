import { test } from 'node:test';
import assert from 'node:assert/strict';
import { bindingPoint, bindingProgress, BINDING_TURN_MS } from './bindingMotion.ts';

test('approved 2.35x speed uses the prototype duration and constant progress', () => {
    assert.equal(BINDING_TURN_MS, 1800 / 2.35);
    assert.equal(bindingProgress(BINDING_TURN_MS / 2, BINDING_TURN_MS, 1), 0.5);
    assert.equal(bindingProgress(0, BINDING_TURN_MS, -1), 1);
    assert.equal(bindingProgress(BINDING_TURN_MS, BINDING_TURN_MS, -1), 0);
});

test('the punched hole follows the wire radius throughout the flip', () => {
    for (const progress of [0, 0.1, 0.25, 0.5, 0.75, 1]) {
        const point = bindingPoint(14, 500, 14, progress);
        assert.ok(Math.abs(Math.hypot(point.y, point.z) - 14) < 1e-8);
    }
});

test('resting paper is flat and the free edge bends separately from the binding', () => {
    assert.deepEqual(bindingPoint(500, 500, 14, 0), { y: -500, z: 0 });
    const hole = bindingPoint(14, 500, 14, 0.3);
    const tip = bindingPoint(500, 500, 14, 0.3);
    assert.ok(Number.isFinite(tip.y) && Number.isFinite(tip.z));
    assert.ok(Math.abs(tip.y * hole.z - tip.z * hole.y) > 1);
});
