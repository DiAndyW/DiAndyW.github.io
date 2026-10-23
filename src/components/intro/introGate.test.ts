import { test } from 'node:test';
import assert from 'node:assert/strict';
import { INTRO_GATE_SCRIPT, INTRO_STARTED_FLAG, INTRO_STORAGE_KEY } from './introGate.ts';

type Env = { stored?: string | null; reduce?: boolean; storageThrows?: boolean; hidden?: boolean };

const run = ({ stored = null, reduce = false, storageThrows = false, hidden = false }: Env) => {
    const data = new Map<string, string>();
    if (stored !== null) data.set(INTRO_STORAGE_KEY, stored);
    const sessionStorage = {
        getItem: (k: string) => {
            if (storageThrows) throw new Error('SecurityError');
            return data.get(k) ?? null;
        },
        setItem: (k: string, v: string) => {
            if (storageThrows) throw new Error('SecurityError');
            data.set(k, v);
        },
    };
    const timers: (() => void)[] = [];
    const window: Record<string, unknown> = {
        sessionStorage,
        setTimeout: (fn: () => void) => timers.push(fn),
        matchMedia: (q: string) => ({ matches: reduce && q === '(prefers-reduced-motion: reduce)' }),
    };
    const document = {
        visibilityState: hidden ? 'hidden' : 'visible',
        documentElement: { dataset: {} as Record<string, string> },
    };
    new Function('window', 'document', INTRO_GATE_SCRIPT)(window, document);
    return { intro: document.documentElement.dataset.intro, data, timers, document, window };
};

test('fresh session plays and remembers', () => {
    const { intro, data } = run({});
    assert.equal(intro, 'play');
    assert.equal(data.get(INTRO_STORAGE_KEY), '1');
});

test('already seen this session does not play', () => {
    assert.equal(run({ stored: '1' }).intro, undefined);
});

test('reduced motion does not play', () => {
    assert.equal(run({ reduce: true }).intro, undefined);
});

test('storage that throws does not play and does not throw', () => {
    assert.doesNotThrow(() => run({ storageThrows: true }));
    assert.equal(run({ storageThrows: true }).intro, undefined);
});

test('hidden (background) tab does not play or use up the intro', () => {
    const { intro, data } = run({ hidden: true });
    assert.equal(intro, undefined);
    assert.equal(data.get(INTRO_STORAGE_KEY), undefined);
});

test('start deadline cancels the intro if the page JS has not started it', () => {
    const { timers, document } = run({});
    assert.equal(timers.length, 1);
    timers[0]();
    assert.equal(document.documentElement.dataset.intro, undefined);
});

test('start deadline leaves a started intro alone', () => {
    const { timers, document, window } = run({});
    window[INTRO_STARTED_FLAG] = true;
    timers[0]();
    assert.equal(document.documentElement.dataset.intro, 'play');
});
