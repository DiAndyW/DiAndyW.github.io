import { test } from 'node:test';
import assert from 'node:assert/strict';
import { panelStyle } from './panelMotion.ts';

const desk = { compact: false, reducedMotion: false, dragY: 0 };

test('entering waits 380ms for the swoop, then slides over 420ms', () => {
    const s = panelStyle('entering', desk);
    assert.equal(s.transform, 'translateX(0)');
    assert.equal(s.opacity, 1);
    assert.match(s.transition!, /transform 420ms cubic-bezier\(\.2,\.8,\.2,1\) 380ms/);
    assert.match(s.transition!, /opacity 420ms cubic-bezier\(\.2,\.8,\.2,1\) 380ms/);
});

test('hidden sits off the right edge, transparent', () => {
    const s = panelStyle('hidden', desk);
    assert.equal(s.transform, 'translateX(calc(100% + 12px))');
    assert.equal(s.opacity, 0);
});

test('open moves without the delay (snap back after a drag)', () => {
    const s = panelStyle('open', { ...desk, compact: true });
    assert.equal(s.transform, 'translateY(0px)');
    assert.match(s.transition!, /transform 420ms \S+ 0ms/);
});

test('dragging follows the finger with no transition', () => {
    const s = panelStyle('dragging', { ...desk, compact: true, dragY: 42 });
    assert.equal(s.transform, 'translateY(42px)');
    assert.equal(s.transition, 'none');
});

test('the sheet enters from below', () => {
    assert.equal(panelStyle('hidden', { ...desk, compact: true }).transform, 'translateY(100%)');
});

test('reduced motion shows the panel at once', () => {
    const s = panelStyle('hidden', { ...desk, reducedMotion: true });
    assert.equal(s.opacity, 1);
    assert.equal(s.transform, 'translateX(0)');
    assert.equal(s.transition, undefined);
});
