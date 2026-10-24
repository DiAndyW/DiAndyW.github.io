import { test } from 'node:test';
import assert from 'node:assert/strict';
import { navigationTarget } from './tabNavigation.ts';

test('tab arrow navigation wraps at both ends', () => {
    assert.equal(navigationTarget('ArrowUp', 0, 5, 'tabs'), 4);
    assert.equal(navigationTarget('ArrowDown', 4, 5, 'tabs'), 0);
    assert.equal(navigationTarget('ArrowDown', 1, 5, 'tabs'), 2);
    assert.equal(navigationTarget('ArrowUp', 2, 5, 'tabs'), 1);
});

test('More list arrow navigation stops at each end and supports Home/End', () => {
    assert.equal(navigationTarget('ArrowUp', 0, 5, 'list'), 0);
    assert.equal(navigationTarget('ArrowDown', 4, 5, 'list'), 4);
    assert.equal(navigationTarget('ArrowDown', 1, 5, 'list'), 2);
    assert.equal(navigationTarget('Home', 3, 5, 'list'), 0);
    assert.equal(navigationTarget('End', 1, 5, 'list'), 4);
});

test('unhandled keys remain available to activation and notepad navigation', () => {
    for (const key of ['ArrowLeft', 'ArrowRight', 'Enter', ' ', 'Tab', 'Escape']) {
        assert.equal(navigationTarget(key, 2, 5, 'tabs'), null);
        assert.equal(navigationTarget(key, 2, 5, 'list'), null);
    }
    assert.equal(navigationTarget('Home', 2, 5, 'tabs'), null);
    assert.equal(navigationTarget('End', 2, 5, 'tabs'), null);
});

test('empty and single-item lists have no invalid focus target', () => {
    for (const mode of ['tabs', 'list'] as const) {
        assert.equal(navigationTarget('ArrowDown', -1, 0, mode), null);
        assert.equal(navigationTarget('ArrowUp', 0, 1, mode), 0);
        assert.equal(navigationTarget('ArrowDown', 0, 1, mode), 0);
    }
    assert.equal(navigationTarget('ArrowDown', -1, 5, 'list'), 0);
    assert.equal(navigationTarget('ArrowUp', -1, 5, 'list'), 0);
});
