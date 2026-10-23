import { test } from 'node:test';
import assert from 'node:assert/strict';
import { STEAM_MS, catIdleAt, flickerAt, steamAt, tailFlickAt, twitchAt } from './motion.ts';

const close = (actual: number, expected: number, eps = 1e-6) =>
    assert.ok(Math.abs(actual - expected) <= eps, `expected ${expected}, got ${actual}`);

test('flickerAt steps through the screen flicker every 1.1s', () => {
    assert.equal(flickerAt(0), 1);
    assert.equal(flickerAt(0.2 * 1100), 0.7);
    assert.equal(flickerAt(0.3 * 1100), 1);
    assert.equal(flickerAt(0.63 * 1100), 0.82);
    assert.equal(flickerAt(0.8 * 1100), 1);
    assert.equal(flickerAt(1100 + 0.2 * 1100), 0.7);
});

test('twitchAt tips the ear to -12deg at 6% of 2.4s and rests after 12%', () => {
    close(twitchAt(0), 0);
    close(twitchAt(0.06 * 2400), -12);
    close(twitchAt(0.12 * 2400), 0);
    close(twitchAt(0.5 * 2400), 0);
    const midway = twitchAt(0.03 * 2400);
    assert.ok(midway < 0 && midway > -12);
});

test('tailFlickAt swings to -14deg over 0.5s and back', () => {
    close(tailFlickAt(0), 0);
    close(tailFlickAt(500), -14);
    close(tailFlickAt(1000), 0);
    close(tailFlickAt(250), -7);
    close(tailFlickAt(750), -7);
});

test('steamAt fades in to 0.7 at 30% and rises from 6 below to 16 above', () => {
    const start = steamAt(0);
    close(start.opacity, 0);
    close(start.rise, -6);
    close(steamAt(0.3 * STEAM_MS).opacity, 0.7);
    const end = steamAt(STEAM_MS - 1e-6);
    close(end.opacity, 0, 1e-4);
    close(end.rise, 16, 1e-4);
});

test('steamAt eases in, so the rise is slower at the start', () => {
    const quarter = steamAt(0.25 * STEAM_MS).rise - steamAt(0).rise;
    const lastQuarter = steamAt(STEAM_MS - 1e-6).rise - steamAt(0.75 * STEAM_MS).rise;
    assert.ok(quarter < lastQuarter);
});

test('catIdleAt sways the tail gently and breathes, starting from rest', () => {
    const rest = catIdleAt(0, false);
    close(rest.tail, 0);
    close(rest.breath, 1);
    for (let ms = 0; ms < 8000; ms += 50) {
        const { tail, breath } = catIdleAt(ms, false);
        assert.ok(Math.abs(tail) <= 4 + 1e-9);
        assert.ok(breath >= 1 && breath <= 1.02 + 1e-9);
    }
    assert.ok(Math.abs(catIdleAt(1000, false).tail) > 1);
});

test('catIdleAt holds still under reduced motion', () => {
    assert.deepEqual(catIdleAt(1234, true), { tail: 0, breath: 1 });
});
