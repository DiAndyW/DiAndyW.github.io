'use client';

import { useCallback, useEffect, useState } from 'react';
import type { SteamGamesResponse } from '../../app/api/steam/steamGames';

export type Loadable<T> = { status: 'loading' } | { status: 'error' } | { status: 'ready'; data: T };

export type SpotifyEntry = {
    artist: { id: string; name: string; image: string | null; spotifyUrl: string };
    track: { id: string; name: string; albumArt: string | null; spotifyUrl: string };
};

// A failed request or a JSON `error` field both count as an error
async function load<T>(url: string, pick: (json: Record<string, unknown>) => T): Promise<Loadable<T>> {
    try {
        const res = await fetch(url);
        const json = await res.json();
        if (!res.ok || json.error) return { status: 'error' };
        return { status: 'ready', data: pick(json) };
    } catch {
        return { status: 'error' };
    }
}

const loadMusic = () => load('/api/spotify', (json) => (json.artists as SpotifyEntry[]) ?? []);
const loadGames = () => load('/api/steam', (json) => json as unknown as SteamGamesResponse);

export function useInterestData(): {
    music: Loadable<SpotifyEntry[]>;
    games: Loadable<SteamGamesResponse>;
    retryMusic: () => void;
    retryGames: () => void;
} {
    const [music, setMusic] = useState<Loadable<SpotifyEntry[]>>({ status: 'loading' });
    const [games, setGames] = useState<Loadable<SteamGamesResponse>>({ status: 'loading' });

    useEffect(() => {
        let live = true;
        loadMusic().then((r) => live && setMusic(r));
        loadGames().then((r) => live && setGames(r));
        return () => {
            live = false;
        };
    }, []);

    const retryMusic = useCallback(() => {
        setMusic({ status: 'loading' });
        loadMusic().then(setMusic);
    }, []);
    const retryGames = useCallback(() => {
        setGames({ status: 'loading' });
        loadGames().then(setGames);
    }, []);

    return { music, games, retryMusic, retryGames };
}
