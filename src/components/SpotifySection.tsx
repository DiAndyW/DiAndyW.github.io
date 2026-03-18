'use client';

import React, { useState, useEffect } from 'react';

interface ArtistEntry {
  artist: {
    id: string;
    name: string;
    image: string | null;
    spotifyUrl: string;
  };
  track: {
    id: string;
    name: string;
    albumArt: string | null;
    spotifyUrl: string;
  };
}

const SpotifySection: React.FC = () => {
  const [artists, setArtists] = useState<ArtistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/spotify')
      .then(r => r.json())
      .then(data => {
        if (data.error) {
          console.error('[SpotifySection] API error:', data);
          setError(data.error);
        } else {
          setArtists(data.artists);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('[SpotifySection] Fetch error:', err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return (
    <div className="mt-4 font-normal">
      <h2 className="text-white mb-6 px-4">My recent top artists</h2>

      {loading && (
        <p className="px-4 text-white/50 text-sm">Loading...</p>
      )}

      {error && (
        <p className="px-4 text-white/50 text-sm">Error: {error}</p>
      )}

      {!loading && !error && (
        <>
          <div className="flex flex-col gap-3 px-4">
            {artists.map(({ artist, track }) => (
              <div key={artist.id} className="flex items-center gap-4">

                {/* Artist */}
                <a
                  href={artist.spotifyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-3 w-48 flex-shrink-0"
                >
                  <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/10 group-hover:border-[#7bb3d1] transition-colors duration-200 flex-shrink-0">
                    {artist.image ? (
                      <img src={artist.image} alt={artist.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-[#2d4a57]/40" />
                    )}
                  </div>
                  <p className="text-white text-sm font-semibold truncate group-hover:text-[#7bb3d1] transition-colors duration-200">
                    {artist.name}
                  </p>
                </a>

                {/* Divider */}
                <div className="w-px h-8 bg-white/10 flex-shrink-0" />

                {/* Top track */}
                <a
                  href={track.spotifyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-3 flex-1 min-w-0 bg-[#2d4a57]/20 hover:bg-[#2d4a57]/40 border border-white/10 rounded-lg px-3 py-2 transition-colors duration-200"
                >
                  {track.albumArt && (
                    <img src={track.albumArt} alt={track.name} className="w-8 h-8 rounded flex-shrink-0 object-cover" />
                  )}
                  <p className="text-white/70 text-sm truncate group-hover:text-white transition-colors duration-200">
                    {track.name}
                  </p>
                </a>

              </div>
            ))}
          </div>

          {/* Spotify attribution */}
          <div className="flex items-center gap-2 px-4 mt-6">
            <span className="text-white/40 text-xs">Powered by</span>
            <a
              href="https://spotify.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-white/50 hover:text-[#1db954] transition-colors"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
              </svg>
              <span className="text-xs font-medium">Spotify</span>
            </a>
          </div>
        </>
      )}
    </div>
  );
};

export default SpotifySection;
