import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
    announcement,
    hashForPage,
    layoutForWidth,
    pageFromHash,
    releaseSpeed,
    sheetTimings,
    stepPage,
    swipeOutcome,
    turningPages,
} from './notepadNav.ts';
import { PROJECTS } from './projectsData.ts';

test('stepPage wraps from the last page to the first and back', () => {
    assert.equal(stepPage(0, -1, 5), 4);
    assert.equal(stepPage(4, 1, 5), 0);
    assert.equal(stepPage(1, 1, 5), 2);
    assert.equal(stepPage(2, -1, 5), 1);
});

test('turningPages turns every page between, in order', () => {
    // 1 -> 5: pages 1 to 4 turn away
    assert.deepEqual(turningPages(0, 4, 1, 5), [0, 1, 2, 3]);
    // 5 -> 1: pages 4 down to 1 come back
    assert.deepEqual(turningPages(4, 0, -1, 5), [3, 2, 1, 0]);
    // neighbours, and the arrow keys wrapping round: one sheet
    assert.deepEqual(turningPages(2, 3, 1, 5), [2]);
    assert.deepEqual(turningPages(2, 1, -1, 5), [1]);
    assert.deepEqual(turningPages(4, 0, 1, 5), [4]);
    assert.deepEqual(turningPages(0, 4, -1, 5), [4]);
});

test('sheetTimings riffles a run and turns the last sheet at full speed', () => {
    assert.deepEqual(sheetTimings(1), [{ delay: 0, duration: 750 }]);
    assert.deepEqual(
        sheetTimings(4).map((t) => [t.delay, t.duration]),
        [
            [0, 420],
            [90, 420],
            [180, 420],
            [270, 750],
        ],
    );
    // a long run is squeezed so its last sheet starts within the span
    const long = sheetTimings(15);
    assert.equal(long.length, 15);
    assert.ok(long[14].delay <= 450);
    assert.equal(long[14].duration, 750);
});

test('pageFromHash maps known slugs and rejects the rest', () => {
    assert.equal(pageFromHash('#projects/morii', PROJECTS), 2);
    // the old Index page's link falls back to the default page
    for (const h of ['#projects', '#projects/index', '#projects/nope', '#about', '']) {
        assert.equal(pageFromHash(h, PROJECTS), null);
    }
});

test('hashForPage', () => {
    assert.equal(hashForPage(0, PROJECTS), '#projects/mosaic');
    assert.equal(hashForPage(4, PROJECTS), '#projects/temple-of-doom');
});

test('announcement', () => {
    assert.equal(announcement(2, PROJECTS), 'Page 3 of 5: Morii');
});

test('swipeOutcome commits past 30% of the width or on a flick, and ignores vertical drags', () => {
    assert.equal(swipeOutcome(-110, 0, 340, 0.1), 'next');
    assert.equal(swipeOutcome(110, 0, 340, 0.1), 'prev');
    assert.equal(swipeOutcome(-40, 0, 340, 0.6), 'next');
    assert.equal(swipeOutcome(-40, 0, 340, 0.2), 'stay');
    assert.equal(swipeOutcome(-120, 150, 340, 0.1), 'stay');
});

test('releaseSpeed feeds swipeOutcome: reversed flicks stay, same-direction flicks and long drags commit', () => {
    const outcome = (samples: { x: number; t: number }[], x: number, t: number, dx: number) =>
        swipeOutcome(dx, 0, 340, releaseSpeed(samples, x, t, dx));
    // dragged left 80px, then flicked back right fast at release
    assert.equal(outcome([{ x: 220, t: 0 }, { x: 160, t: 50 }], 260, 80, -80), 'stay');
    // a fast flick the same way as the drag
    assert.equal(outcome([{ x: 300, t: 0 }, { x: 270, t: 50 }], 240, 80, -60), 'next');
    // a slow drag past 30% of the width
    assert.equal(outcome([{ x: 300, t: 0 }, { x: 250, t: 400 }], 190, 800, -110), 'next');
    // no elapsed time: no division by zero, no speed
    assert.equal(releaseSpeed([{ x: 300, t: 50 }], 200, 50, -100), 0);
    assert.equal(outcome([{ x: 300, t: 50 }], 200, 50, -40), 'stay');
});

test('layoutForWidth', () => {
    assert.equal(layoutForWidth(719), 'single');
    assert.equal(layoutForWidth(720), 'notepad');
});

test('PROJECTS matches the handoff', () => {
    assert.deepEqual(
        PROJECTS.map((p) => p.slug),
        ['mosaic', 'true-talent', 'morii', 'btd-training-camp', 'temple-of-doom'],
    );
    assert.equal(PROJECTS[0].status, 'In App Store private preview');
    assert.equal(PROJECTS[0].link, undefined);
    assert.equal(PROJECTS[1].org, 'LA Hacks 2025');
    for (const p of PROJECTS) assert.equal(p.bullets.length, 2);
});
