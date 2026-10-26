import { NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { spotifyJSON, SpotifyError } from './spotifyData';

async function fetchSpotify() {
  const { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REFRESH_TOKEN } = process.env;

  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET || !SPOTIFY_REFRESH_TOKEN) {
    throw new SpotifyError(503);
  }

  // Get access token
  const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64'),
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: SPOTIFY_REFRESH_TOKEN,
    }).toString(),
    cache: 'no-store',
    signal: AbortSignal.timeout(8000),
  });

  const tokenData = await spotifyJSON(tokenRes);
  const { access_token } = tokenData;

  if (!access_token) {
    throw new SpotifyError(503);
  }

  const authHeaders = { Authorization: `Bearer ${access_token}` };

  // fetch top 20 tracks
  const tracksRes = await fetch(
    'https://api.spotify.com/v1/me/top/tracks?limit=20&time_range=short_term',
    { headers: authHeaders, cache: 'no-store', signal: AbortSignal.timeout(8000) }
  );
  const tracksData = await spotifyJSON(tracksRes);

  if (!tracksData.items) {
    throw new SpotifyError(503);
  }

  // deduplicate by primary artist, take first 5 pairs
  const seen = new Set<string>();
  const pairs: { artistId: string; artistHref: string; track: any }[] = [];

  for (const track of tracksData.items) {
    if (pairs.length === 5) break;
    const primaryArtist = track.artists[0];
    if (seen.has(primaryArtist.id)) continue;
    seen.add(primaryArtist.id);
    pairs.push({ artistId: primaryArtist.id, artistHref: primaryArtist.href, track });
  }

  // fetch each artist individually in parallel
  const artistResponses = await Promise.all(
    pairs.map(({ artistHref }) => fetch(artistHref, { headers: authHeaders, cache: 'no-store', signal: AbortSignal.timeout(8000) }).then(spotifyJSON))
  );

  const result = pairs.map(({ track }, i) => {
    const artist = artistResponses[i];
    return {
      artist: {
        id: artist.id,
        name: artist.name,
        image: artist.images?.[0]?.url ?? null,
        spotifyUrl: artist.external_urls.spotify,
      },
      track: {
        id: track.id,
        name: track.name,
        albumArt: track.album.images[0]?.url ?? null,
        spotifyUrl: track.external_urls.spotify,
      },
    };
  });

  return { artists: result };
}

// Cache only successful, complete results; throwing preserves a stale good entry.
const cachedSpotify = unstable_cache(refreshSpotify, ['spotify-top-pairs-v1'], { revalidate: 604800 });
let retryAt = 0;
let pending: ReturnType<typeof fetchSpotify> | undefined;

async function refreshSpotify() {
  if (Date.now() < retryAt) throw new SpotifyError(429, Math.ceil((retryAt - Date.now()) / 1000));
  if (!pending) {
    pending = fetchSpotify().catch((error: unknown) => {
      const delay = error instanceof SpotifyError ? error.retryAfter : 60;
      retryAt = Date.now() + delay * 1000;
      throw error;
    }).finally(() => { pending = undefined; });
  }
  return pending;
}

export async function GET() {
  try {
    return NextResponse.json(await cachedSpotify());
  } catch (error) {
    const retryAfter = error instanceof SpotifyError ? error.retryAfter : 60;
    return NextResponse.json({ error: 'Spotify temporarily unavailable' }, {
      status: 503,
      headers: { 'Retry-After': String(retryAfter), 'Cache-Control': 'no-store' },
    });
  }
}
