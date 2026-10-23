import { test } from 'node:test';
import assert from 'node:assert/strict';
import { focusShowsLabel, visibilityGate } from './stageState.ts';

const fakeScene = () => {
    const calls: boolean[] = [];
    return { calls, setActive: (a: boolean) => void calls.push(a) };
};

test('a scene that loads after the stage left the screen starts paused', () => {
    const gate = visibilityGate();
    gate.setVisible(true);
    gate.setVisible(false);
    const scene = fakeScene();
    gate.attach(scene);
    assert.deepEqual(scene.calls, [false]);
});

test('visibility changes reach an attached scene, and stop after detach', () => {
    const gate = visibilityGate();
    const scene = fakeScene();
    gate.attach(scene);
    gate.setVisible(true);
    gate.detach();
    gate.setVisible(false);
    assert.deepEqual(scene.calls, [false, true]);
});

test('focus from a click does not show the label; keyboard focus does', () => {
    const el = (visible: boolean) => ({ matches: (s: string) => s === ':focus-visible' && visible });
    assert.equal(focusShowsLabel(el(false)), false);
    assert.equal(focusShowsLabel(el(true)), true);
});
