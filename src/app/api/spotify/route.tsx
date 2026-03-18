import { NextResponse } from 'next/server';

export async function GET() {
  const { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REFRESH_TOKEN } = process.env;

  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET || !SPOTIFY_REFRESH_TOKEN) {
    console.error('[spotify] Missing env vars:', {
      hasClientId: !!SPOTIFY_CLIENT_ID,
      hasClientSecret: !!SPOTIFY_CLIENT_SECRET,
      hasRefreshToken: !!SPOTIFY_REFRESH_TOKEN,
    });
    return NextResponse.json({ error: 'Missing Spotify credentials' }, { status: 500 });
  }

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

  const tracksRes = await fetch(
    'https://api.spotify.com/v1/me/top/tracks?limit=10&time_range=short_term',
    { headers: { Authorization: `Bearer ${access_token}` } }
  );

  const data = await tracksRes.json();

  if (!data.items) {
    console.error('[spotify] Tracks error:', data);
    return NextResponse.json({ error: 'No tracks returned', detail: data }, { status: 500 });
  }

  const tracks = data.items.map((track: any) => ({
    id: track.id,
    name: track.name,
    artist: track.artists.map((a: any) => a.name).join(', '),
    albumArt: track.album.images[0]?.url ?? null,
    previewUrl: track.preview_url,
    spotifyUrl: track.external_urls.spotify,
  }));

  return NextResponse.json({ tracks });
}
