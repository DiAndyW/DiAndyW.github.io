import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CLOUDS, type Circle, cloudField, deckView, exitView, seeded } from './clouds.ts';

const covers = (circles: Circle[], x: number, y: number) => circles.some(([cx, cy, r]) => Math.hypot(x - cx, y - cy) <= r);

// Share of a deck's first view (the square that fills the screen when it appears) that is cloud.
function coverage(circles: Circle[], d: number): number {
    const n = 48;
    let hit = 0;
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            if (covers(circles, (((i + 0.5) / n) * 2 - 1) * d, (((j + 0.5) / n) * 2 - 1) * d)) hit++;
        }
    }
    return hit / (n * n);
}

test('seeded random numbers repeat for the same seed and stay in [0, 1)', () => {
    const a = seeded(11);
    const b = seeded(11);
    for (let i = 0; i < 1000; i++) {
        const x = a();
        assert.equal(x, b());
        assert.ok(x >= 0 && x < 1);
    }
});

test('cloudField is the same layout every visit', () => {
    assert.deepEqual(cloudField(), cloudField());
});

test('cloudField stacks the tuned number of decks, nearest first', () => {
    const { decks } = cloudField();
    assert.equal(decks.length, CLOUDS.layers);
    for (let i = 1; i < decks.length; i++) assert.ok(decks[i].d > decks[i - 1].d, 'decks out of depth order');
    for (const deck of decks) assert.ok(deck.base.length > 0 && deck.bumps.length > 0);
});

test('each deck down covers more of the ground, and the last is nearly overcast', () => {
    const { decks } = cloudField();
    const cover = decks.map((deck) => coverage(deck.base, deck.d));
    for (let i = 1; i < cover.length; i++) assert.ok(cover[i] > cover[i - 1], `deck ${i} covers ${cover[i]}, above it ${cover[i - 1]}`);
    assert.ok(cover[0] < 0.5, `top deck covers ${cover[0]}`);
    assert.ok(cover[cover.length - 1] > 0.85, `last deck covers ${cover[cover.length - 1]}`);
});

test('upper decks leave a gap dead ahead to dive through; the last is solid there', () => {
    const { decks } = cloudField();
    const last = decks[decks.length - 1];
    for (const deck of decks.slice(0, -1)) {
        const clear = Math.min(...deck.base.map(([x, y, r]) => Math.hypot(x, y) - r));
        assert.ok(clear > 0.2, `deck at depth ${deck.d} is only clear to ${clear}`);
    }
    // Solid out past the screen corners (1.42 half-sizes away) by the time the whiteout sheet fades in.
    const reach = 1.42 * deckView(0.93, last).z;
    for (let a = 0; a < 64; a++) {
        for (const k of [0, 0.5, 1]) {
            const x = Math.cos((a / 64) * Math.PI * 2) * reach * k;
            const y = Math.sin((a / 64) * Math.PI * 2) * reach * k;
            assert.ok(covers(last.base, x, y), `last deck has a hole at ${x}, ${y}`);
        }
    }
});

test('decks come up out of the haze, pass the camera in turn, and the last arrives at the whiteout', () => {
    const { decks } = cloudField();
    assert.equal(deckView(0, decks[0]).alpha, 0);
    // Passing order: the depth at which each deck is dropped is reached nearest-first.
    const passedAt = decks.map((deck) => {
        for (let into = 0; into <= 0.99; into += 0.01) if (!deckView(into, deck).visible) return into;
        return Infinity;
    });
    for (let i = 1; i < decks.length; i++) assert.ok(passedAt[i] > passedAt[i - 1], `deck ${i} passes out of turn`);
    // The whiteout sheet is opaque for the last sliver of the dive, so the last deck only has to hold until then.
    const end = deckView(0.99, decks[decks.length - 1]);
    assert.ok(end.visible && end.alpha === 1 && end.z < 0.2, `last deck at ${end.z}`);
});

test('the break-through starts fully covered, opens from the middle, and ends clear', () => {
    const { exit } = cloudField();
    // Screen corners in units of the larger half-size, for landscape, portrait and square.
    for (const [w, h] of [[1280, 800], [390, 844], [1920, 1080], [768, 1024], [1024, 1024], [2560, 1080]]) {
        const R = Math.max(w, h) / 2;
        const start = exitView(0, exit).base;
        for (let i = 0; i <= 24; i++) {
            for (let j = 0; j <= 24; j++) {
                const x = ((i / 24) * w - w / 2) / R;
                const y = ((j / 24) * h - h / 2) / R;
                assert.ok(covers(start, x, y), `gap at the start at ${w}x${h}: ${x}, ${y}`);
            }
        }
    }
    const mid = exitView(0.5, exit).base;
    assert.ok(!covers(mid, 0, 0), 'the middle is still covered halfway through');
    assert.ok(mid.length > 0, 'nothing left halfway through');
    assert.ok(mid.length < exitView(0.25, exit).base.length, 'cloud is not thinning');
    assert.equal(exitView(1, exit).base.length, 0);
});

test('the break-through never sits still: it is moving and lumpy from the first frame and tears within a tenth', () => {
    const { exit } = cloudField();
    const start = exitView(0, exit);
    assert.ok(start.lumps.length > 50, `only ${start.lumps.length} lumps to show movement`);
    // Already spreading at full speed, not easing in from rest.
    assert.ok(exitView(0.05, exit).scale - start.scale > 0.15, 'the sheet starts from rest');
    // Some point near the middle of the screen shows the page by a tenth of the way in.
    const early = exitView(0.1, exit).base;
    let open = false;
    for (let i = -10; i <= 10 && !open; i++) for (let j = -10; j <= 10 && !open; j++) open = !covers(early, i * 0.05, j * 0.05);
    assert.ok(open, 'still fully covered a tenth of the way in');
});
