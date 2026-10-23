export type SteamGame = { appid: number; name: string; hours: number; image: string; storeUrl: string };
export type SteamGamesResponse = { top: SteamGame[]; recent: SteamGame[] };

type RawGame = { appid: number; name?: string; playtime_forever?: number; playtime_2weeks?: number };
type RawList = { response?: { games?: RawGame[] } };

const LIMIT = 3;

const toGame = (g: RawGame, minutes: number): SteamGame => ({
    appid: g.appid,
    name: g.name!,
    hours: Math.round((minutes / 60) * 10) / 10,
    image: `https://cdn.cloudflare.steamstatic.com/steam/apps/${g.appid}/header.jpg`,
    storeUrl: `https://store.steampowered.com/app/${g.appid}`,
});

// Turns the GetOwnedGames + GetRecentlyPlayedGames payloads into what the Games panel shows.
// A private profile comes back as `{ response: {} }`, which yields empty lists, not an error.
export function shapeSteamGames(owned: RawList, recent: RawList): SteamGamesResponse {
    const top = (owned.response?.games ?? [])
        .filter((g) => g.name && (g.playtime_forever ?? 0) > 0)
        .sort((a, b) => (b.playtime_forever ?? 0) - (a.playtime_forever ?? 0))
        .slice(0, LIMIT)
        .map((g) => toGame(g, g.playtime_forever ?? 0));

    const lately = (recent.response?.games ?? [])
        .filter((g) => g.name && (g.playtime_2weeks ?? 0) > 0)
        .slice(0, LIMIT)
        .map((g) => toGame(g, g.playtime_2weeks ?? 0));

    return { top, recent: lately };
}
