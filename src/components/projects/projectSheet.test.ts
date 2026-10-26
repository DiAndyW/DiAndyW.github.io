import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dismissProjectSheet } from './projectSheet.ts';

test('a deliberate downward header drag dismisses, but a short slow drag does not', () => {
    assert.equal(dismissProjectSheet(0, 96, 600), true);
    assert.equal(dismissProjectSheet(0, 30, 600), false);
});

test('a downward flick can dismiss before the distance threshold', () => {
    assert.equal(dismissProjectSheet(2, 35, 45), true);
    assert.equal(dismissProjectSheet(0, 4, 1), false);
});

test('upward, horizontal and diagonal sideways drags do not dismiss', () => {
    assert.equal(dismissProjectSheet(0, -150, 50), false);
    assert.equal(dismissProjectSheet(150, 80, 50), false);
    assert.equal(dismissProjectSheet(-100, 50, 50), false);
});

test('zero elapsed time stays finite and still requires deliberate downward travel', () => {
    assert.equal(dismissProjectSheet(0, 0, 0), false);
    assert.equal(dismissProjectSheet(0, 25, 0), true);
});
