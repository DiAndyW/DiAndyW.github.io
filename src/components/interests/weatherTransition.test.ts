import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createWeatherTransition, transitionDuration } from './weatherTransition.ts';

const night = { weather: 'rainy', time: 'night' } as const;
const day = { weather: 'clear', time: 'day' } as const;
test('time, weather and rain have independent durations; reduced/offscreen are instant', () => {
    assert.equal(transitionDuration(night, { ...night, time: 'dawn' }, false, true), 1200);
    assert.equal(transitionDuration(night, day, false, true), 1600);
    assert.equal(transitionDuration(night, day, true, true), 0);
    assert.equal(transitionDuration(night, day, false, false), 0);
    const t = createWeatherTransition(night);
    t.set(day, 100, false, true);
    const halfRain = t.frame(400);
    assert.equal(halfRain.rain, 0.5);
    assert.equal(halfRain.from.weather, 'rainy');
    assert.equal(halfRain.to.weather, 'clear');
    assert.equal(t.frame(700).rain, 0);
    assert.equal(t.frame(900).mix, 0.5);
    assert.equal(t.frame(1700).mix, 1);
    assert.equal(t.frame(1700).animating, false);
});

test('latest interrupted request is queued without dropping the opaque outgoing layer', () => {
    const t = createWeatherTransition(night);
    t.set(day, 0, false, true);
    t.set({ weather: 'cloudy', time: 'dusk' }, 400, false, true);
    assert.equal(t.frame(800).to.weather, 'clear');
    const next = t.frame(1600);
    assert.deepEqual(next.from, day);
    assert.equal(next.to.weather, 'cloudy');
    assert.equal(next.mix, 0);
    t.set(night, 1700, false, false);
    assert.equal(t.frame(1700).animating, false);
    assert.deepEqual(t.frame(1700).to, night);
});

test('hiding during a transition settles to the latest queued state without a partial resume', () => {
    const t = createWeatherTransition(night);
    t.set(day, 0, false, true);
    t.set({ weather: 'cloudy', time: 'dusk' }, 200, false, true);
    t.finish();
    const resumed = t.frame(500);
    assert.deepEqual(resumed.to, { weather: 'cloudy', time: 'dusk' });
    assert.deepEqual(resumed.from, resumed.to);
    assert.equal(resumed.mix, 1);
    assert.equal(resumed.animating, false);
});
