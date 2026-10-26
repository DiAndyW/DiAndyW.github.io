import { test } from 'node:test';
import assert from 'node:assert/strict';
import { weatherPreset, laClock, solarTimes, timeOfDay, roomDescription, readWeatherData, forcedWindowState } from './weather.ts';

test('maps fog and marine layer to cloudy, precipitation to rainy, and rejects unknown codes', () => {
    for (const code of [0, 1]) assert.equal(weatherPreset(code), 'clear');
    for (const code of [2, 3, 45, 48]) assert.equal(weatherPreset(code), 'cloudy');
    for (const code of [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 71, 73, 75, 77, 80, 81, 82, 85, 86, 95, 96, 99, -1, 4, NaN]) {
        assert.equal(weatherPreset(code), 'rainy');
    }
});

test('LA civil clock handles midnight and both DST offsets independently of host timezone', () => {
    assert.deepEqual(laClock(new Date('2026-07-02T06:59:00Z')), { date: '2026-07-01', minutes: 1439 });
    assert.deepEqual(laClock(new Date('2026-12-02T08:00:00Z')), { date: '2026-12-02', minutes: 0 });
    assert.equal(laClock(new Date('2026-11-01T08:30:00Z')).minutes, 90);
    assert.equal(laClock(new Date('2026-11-01T09:30:00Z')).minutes, 90);
});

test('dawn and dusk use half-open 60-minute windows around real solar events', () => {
    const sun = { date: '2026-10-24', sunrise: Date.parse('2026-10-24T14:05:00Z'), sunset: Date.parse('2026-10-25T01:08:00Z') };
    for (const [iso, want] of [
        ['2026-10-24T13:34:59Z', 'night'], ['2026-10-24T13:35:00Z', 'dawn'],
        ['2026-10-24T14:34:59Z', 'dawn'], ['2026-10-24T14:35:00Z', 'day'],
        ['2026-10-25T00:38:00Z', 'dusk'], ['2026-10-25T01:38:00Z', 'night'],
    ] as const) assert.equal(timeOfDay(new Date(iso), sun), want);
});

test('local solar estimates work without fetching, and stale dates are ignored', () => {
    const now = new Date('2026-10-24T19:00:00Z');
    const sun = solarTimes(now);
    assert.ok(Math.abs(sun.sunrise - Date.parse('2026-10-24T14:05:00Z')) < 5 * 60_000);
    assert.ok(Math.abs(sun.sunset - Date.parse('2026-10-25T01:08:00Z')) < 5 * 60_000);
    assert.equal(timeOfDay(now), 'day');
    assert.equal(timeOfDay(now, { date: '2026-10-23', sunrise: 0, sunset: 1 }), 'day');
    assert.match(roomDescription({ weather: 'clear', time: 'dawn' }), /clear at dawn in Los Angeles/);
    assert.match(roomDescription(), /rainy night/);
    assert.doesNotMatch(roomDescription(), /Los Angeles|live/);
});

test('client rejects malformed/stale data and dev overrides require a complete valid state', () => {
    const now = Date.parse('2026-10-24T19:00:00Z');
    const valid = { date: '2026-10-24', code: 3, observedAt: now, sunrise: now - 5 * 3600_000, sunset: now + 6 * 3600_000 };
    assert.deepEqual(readWeatherData(valid, now), valid);
    for (const bad of [null, {}, { ...valid, code: '3' }, { ...valid, observedAt: now - 3 * 3600_000 }, { ...valid, sunrise: Infinity }]) {
        assert.equal(readWeatherData(bad, now), null);
    }
    assert.deepEqual(forcedWindowState('?roomWeather=clear&roomTime=dawn', true), { weather: 'clear', time: 'dawn' });
    assert.equal(forcedWindowState('?roomWeather=clear&roomTime=dawn', false), null);
    assert.equal(forcedWindowState('?roomWeather=clear&roomTime=invalid', true), null);
    assert.equal(forcedWindowState('?roomWeather=clear', true), null);
});
