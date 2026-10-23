import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CLOUDS, TYPE_WEIGHTS, cloudField, revealLayout, seeded } from './clouds.ts';

test('seeded random numbers repeat for the same seed and stay in [0, 1)', () => {
    const a = seeded(11);
    const b = seeded(11);
    for (let i = 0; i < 1000; i++) {
        const x = a();
        assert.equal(x, b());
        assert.ok(x >= 0 && x < 1);
    }
});

test('type weights cover every pick', () => {
    const total = TYPE_WEIGHTS.reduce((sum, [, w]) => sum + w, 0);
    assert.ok(Math.abs(total - 1) < 1e-9, `weights sum to ${total}`);
});

test('cloudField is the same layout every visit', () => {
    assert.deepEqual(cloudField(), cloudField());
});

test('cloudField uses the tuned amount and mixes every cloud type', () => {
    const field = cloudField();
    assert.equal(field.tunnel.length, CLOUDS.amount);
    const types = new Set(field.tunnel.map((c) => c.shape.type));
    assert.deepEqual([...types].sort(), TYPE_WEIGHTS.map(([type]) => type).sort());
});

test('the cloud flown into and the reveal ring are puffy, so the hole has a bumpy edge', () => {
    const field = cloudField();
    assert.equal(field.hero.type, 'cumulus');
    assert.equal(field.ring.length, 14);
    for (const c of field.ring) assert.equal(c.shape.type, 'cumulus');
});

test('tunnel clouds start out ahead of the camera and are placed off-center', () => {
    for (const c of cloudField().tunnel) {
        assert.ok(c.z >= 1 && c.z < 5.6, `z ${c.z}`);
        assert.ok(c.r > c.shape.hw * CLOUDS.baseSize * c.s, 'cloud placed over the center');
    }
});

test('the reveal leaves the screen clear at the end, so nothing pops when the overlay is removed', () => {
    const { ring } = cloudField();
    for (const [w, h] of [[1280, 800], [390, 844], [1920, 1080], [768, 1024], [1024, 1024], [2560, 1080]]) {
        const end = revealLayout(1, w, h, ring);
        assert.ok(end.hole >= Math.hypot(w / 2, h / 2), `hole doesn't reach the corners at ${w}x${h}`);
        for (const c of end.clouds) {
            for (const part of c.shape.parts) {
                if (!Array.isArray(part)) continue; // ring clouds are cumulus: circles only
                const [px, py, r] = part;
                const x = c.flip ? -px : px;
                const X = c.x + c.size * (x * Math.cos(c.rot) - py * Math.sin(c.rot));
                const Y = c.y + c.size * (x * Math.sin(c.rot) + py * Math.cos(c.rot));
                const gap = Math.hypot(X - Math.min(w, Math.max(0, X)), Y - Math.min(h, Math.max(0, Y)));
                assert.ok(gap >= r * c.size, `ring cloud still on screen at ${w}x${h}`);
            }
        }
    }
});
