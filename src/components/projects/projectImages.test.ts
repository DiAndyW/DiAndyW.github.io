import { test } from 'node:test';
import assert from 'node:assert/strict';
import { imageAfterSwipe, stepImage } from './projectImages.ts';

test('image navigation stops at the first and last screenshot', () => {
    assert.equal(stepImage(0, -1, 2), 0);
    assert.equal(stepImage(0, 1, 2), 1);
    assert.equal(stepImage(1, 1, 2), 1);
    assert.equal(stepImage(0, 1, 1), 0);
});

test('horizontal swipes navigate images while vertical drags and taps do not', () => {
    assert.equal(imageAfterSwipe(0, 2, -80, 10), 1);
    assert.equal(imageAfterSwipe(1, 2, 80, 10), 0);
    assert.equal(imageAfterSwipe(0, 2, -20, 0), 0);
    assert.equal(imageAfterSwipe(0, 2, -80, 100), 0);
    assert.equal(imageAfterSwipe(0, 1, -80, 0), 0);
});
