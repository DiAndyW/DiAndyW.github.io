import { test } from 'node:test';
import assert from 'node:assert/strict';
import { shapeSteamGames } from './steamGames.ts';

type Raw = { appid: number; name?: string; playtime_forever?: number; playtime_2weeks?: number };
const owned = (games: Raw[]) => ({ response: { game_count: games.length, games } });

test('top is sorted by playtime_forever desc and capped at 3', () => {
    const games = [10, 500, 30, 7000, 90, 2000, 60].map((m, i) => ({ appid: i + 1, name: `G${i + 1}`, playtime_forever: m }));
    const { top } = shapeSteamGames(owned(games), {});
    assert.deepEqual(top.map((g) => g.appid), [4, 6, 2]);
});

test('hours are minutes/60 rounded to 1 decimal', () => {
    const res = shapeSteamGames(
        owned([{ appid: 1, name: 'A', playtime_forever: 7385 }]),
        owned([{ appid: 1, name: 'A', playtime_2weeks: 95, playtime_forever: 7385 }]),
    );
    assert.equal(res.top[0].hours, 123.1);
    assert.equal(res.recent[0].hours, 1.6);
});

test('zero-playtime and nameless games are excluded', () => {
    const { top, recent } = shapeSteamGames(
        owned([
            { appid: 1, name: 'Never played', playtime_forever: 0 },
            { appid: 2, playtime_forever: 50 },
            { appid: 3, name: 'Played', playtime_forever: 50 },
        ]),
        owned([{ appid: 2, playtime_2weeks: 10 }]),
    );
    assert.deepEqual(top.map((g) => g.appid), [3]);
    assert.deepEqual(recent, []);
});

test('image and storeUrl come from the appid', () => {
    const { top } = shapeSteamGames(owned([{ appid: 1086940, name: "Baldur's Gate 3", playtime_forever: 60 }]), {});
    assert.equal(top[0].image, 'https://cdn.cloudflare.steamstatic.com/steam/apps/1086940/header.jpg');
    assert.equal(top[0].storeUrl, 'https://store.steampowered.com/app/1086940');
});

test('a private profile returns empty lists', () => {
    for (const empty of [{ response: {} }, {}]) {
        const res = shapeSteamGames(empty, empty);
        assert.deepEqual(res.top, []);
        assert.deepEqual(res.recent, []);
    }
});

test("recent keeps Steam's order and is capped at 3", () => {
    const games = [5, 90, 30, 60, 10, 20].map((m, i) => ({ appid: i + 1, name: `G${i + 1}`, playtime_2weeks: m }));
    const { recent } = shapeSteamGames({}, owned(games));
    assert.deepEqual(recent.map((g) => g.appid), [1, 2, 3]);
});
