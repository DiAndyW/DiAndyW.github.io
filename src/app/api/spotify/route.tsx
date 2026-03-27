import { NextResponse } from 'next/server';

export async function GET() {
  const { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REFRESH_TOKEN } = process.env;

  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET || !SPOTIFY_REFRESH_TOKEN) {
    return NextResponse.json({ error: 'Missing Spotify credentials' }, { status: 500 });
  }

  try {
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
    });

    const tokenData = await tokenRes.json();
    const { access_token } = tokenData;

    if (!access_token) {
      console.error('[spotify] Token error:', tokenData);
      return NextResponse.json({ error: 'Failed to get access token', detail: tokenData }, { status: 500 });
    }

    const authHeaders = { Authorization: `Bearer ${access_token}` };

    // fetch top 20 tracks
    const tracksRes = await fetch(
      'https://api.spotify.com/v1/me/top/tracks?limit=20&time_range=short_term',
      { headers: authHeaders }
    );
    const tracksData = await tracksRes.json();

    if (!tracksData.items) {
      return NextResponse.json({ error: 'Failed to fetch tracks', detail: tracksData }, { status: 500 });
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
      pairs.map(({ artistHref }) => fetch(artistHref, { headers: authHeaders }).then(r => r.json()))
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

    return NextResponse.json({ artists: result });

  } catch (err) {
    console.error('[spotify] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error', detail: String(err) }, { status: 500 });
  }
}
