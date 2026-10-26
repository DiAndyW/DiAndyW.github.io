import { test } from 'node:test';
import assert from 'node:assert/strict';
import { splitTabs } from './pinnedProjects.ts';
import { PROJECTS } from './projectsData.ts';

const list = Array.from({ length: 15 }, (_, i) => ({ featured: i === 3 || i === 9 }));

test('featured projects are pinned first, then the rest in list order, up to 5', () => {
    const { pinned, rest } = splitTabs(list, 0);
    assert.deepEqual(pinned, [3, 9, 0, 1, 2]);
    assert.deepEqual(rest, [4, 5, 6, 7, 8, 10, 11, 12, 13, 14]);
});

test('five or fewer projects leave nothing in the stack', () => {
    const { pinned, rest } = splitTabs(PROJECTS, 0);
    assert.deepEqual(rest, []);
    assert.deepEqual(pinned, [0, 1, 2, 3, 4]);
});

test('an unpinned current project is promoted but stays listed in the stack', () => {
    const { promoted, rest } = splitTabs(list, 12);
    assert.equal(promoted, 12);
    assert.ok(rest.includes(12));
});

test('a pinned current project promotes nothing', () => {
    assert.equal(splitTabs(list, 3).promoted, null);
});
