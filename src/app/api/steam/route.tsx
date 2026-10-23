import { NextResponse } from 'next/server';
import { shapeSteamGames } from './steamGames';

const API = 'https://api.steampowered.com/IPlayerService';

export async function GET() {
  const { STEAM_API_KEY, STEAM_ID } = process.env;

  if (!STEAM_API_KEY || !STEAM_ID) {
    return NextResponse.json({ error: 'Missing Steam credentials' }, { status: 500 });
  }

  const auth = `key=${STEAM_API_KEY}&steamid=${STEAM_ID}`;

  try {
    // Free games (e.g. Counter-Strike 2) are left out unless include_played_free_games is set
    const [ownedRes, recentRes] = await Promise.all([
      fetch(`${API}/GetOwnedGames/v1/?${auth}&include_appinfo=1&include_played_free_games=1`, { next: { revalidate: 3600 } }),
      fetch(`${API}/GetRecentlyPlayedGames/v1/?${auth}&count=5`, { next: { revalidate: 3600 } }),
    ]);

    if (!ownedRes.ok || !recentRes.ok) {
      console.error('[steam] Request failed:', ownedRes.status, recentRes.status);
      return NextResponse.json({ error: 'Steam request failed' }, { status: 500 });
    }

    const [owned, recent] = await Promise.all([ownedRes.json(), recentRes.json()]);
    return NextResponse.json(shapeSteamGames(owned, recent));

  } catch (err) {
    console.error('[steam] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
