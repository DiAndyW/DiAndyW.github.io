import { test } from 'node:test';
import assert from 'node:assert/strict';
import { shapeWeather, weatherURL } from './weatherData.ts';

const now = Date.parse('2026-10-24T19:00:00Z');
const payload = {
    current: { time: now / 1000 - 300, weather_code: 3 },
    daily: { time: [1792825200], sunrise: [1792850700], sunset: [1792890480] },
};
test('weather query requests only LA current code and daily solar times, in absolute seconds', () => {
    const url = new URL(weatherURL());
    assert.equal(url.hostname, 'api.open-meteo.com');
    assert.equal(url.searchParams.get('latitude'), '34.0522');
    assert.equal(url.searchParams.get('longitude'), '-118.2437');
    assert.equal(url.searchParams.get('current'), 'weather_code');
    assert.equal(url.searchParams.get('daily'), 'sunrise,sunset');
    assert.equal(url.searchParams.get('timezone'), 'America/Los_Angeles');
    assert.equal(url.searchParams.get('timeformat'), 'unixtime');
});
test('provider seconds become validated milliseconds with an LA date', () => {
    assert.deepEqual(shapeWeather(payload, now), { code: 3, observedAt: now - 300_000,
        date: '2026-10-24', sunrise: 1792850700000, sunset: 1792890480000 });
});
test('missing, stale, future or malformed responses cannot become usable weather', () => {
    for (const bad of [null, {}, { ...payload, current: { time: now / 1000 - 7201, weather_code: 0 } },
        { ...payload, current: { time: now / 1000 + 601, weather_code: 0 } },
        { ...payload, current: { time: now / 1000, weather_code: '0' } },
        { ...payload, daily: { time: [], sunrise: [], sunset: [] } },
        { ...payload, daily: { ...payload.daily, sunset: [0] } },
    ]) assert.equal(shapeWeather(bad, now), null);
});
