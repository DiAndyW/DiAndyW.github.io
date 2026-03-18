'use client';

import React, { useState, useEffect, useRef } from 'react';

interface Track {
  id: string;
  name: string;
  artist: string;
  albumArt: string | null;
  previewUrl: string | null;
  spotifyUrl: string;
}

const SpotifySection: React.FC = () => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    fetch('/api/spotify')
      .then(r => r.json())
      .then(data => {
        if (data.error) {
          console.error('[SpotifySection] API error:', data);
          setError(data.error + (data.detail ? ': ' + JSON.stringify(data.detail) : ''));
        } else {
          setTracks(data.tracks);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('[SpotifySection] Fetch error:', err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    return () => { audioRef.current?.pause(); };
  }, []);

  const togglePlay = (track: Track) => {
    if (!track.previewUrl) return;

    if (playingId === track.id) {
      audioRef.current?.pause();
      setPlayingId(null);
    } else {
      if (audioRef.current) audioRef.current.pause();
      audioRef.current = new Audio(track.previewUrl);
      audioRef.current.play();
      audioRef.current.onended = () => setPlayingId(null);
      setPlayingId(track.id);
    }
  };

  return (
    <div className="mt-8 font-normal">
      <h1 className="text-3xl sm:text-4xl lg:text-5xl p-2 sm:p-4">Music</h1>
      <h2 className="text-white mb-6 mt-4 px-4">My recent top tracks</h2>

      {loading && (
        <p className="px-4 text-white/50 text-sm">Loading tracks...</p>
      )}

      {error && (
        <p className="px-4 text-white/50 text-sm">Error: {error}</p>
      )}

      {!loading && !error && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 px-4">
            {tracks.map((track) => (
              <div key={track.id} className="group">
                <div className="relative aspect-square rounded-lg overflow-hidden mb-2">
                  {track.albumArt && (
                    <img
                      src={track.albumArt}
                      alt={`${track.name} album art`}
                      className="w-full h-full object-cover"
                    />
                  )}

                  {track.previewUrl && (
                    <button
                      onClick={() => togglePlay(track)}
                      className={`absolute inset-0 flex items-center justify-center bg-black/40 transition-opacity duration-200
                        ${playingId === track.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                      aria-label={playingId === track.id ? 'Pause preview' : 'Play 30s preview'}
                    >
                      <div className="w-12 h-12 rounded-full bg-[#1DB954] flex items-center justify-center shadow-lg">
                        {playingId === track.id ? (
                          <svg viewBox="0 0 24 24" className="w-6 h-6 fill-black">
                            <rect x="6" y="4" width="4" height="16"/>
                            <rect x="14" y="4" width="4" height="16"/>
                          </svg>
                        ) : (
                          <svg viewBox="0 0 24 24" className="w-6 h-6 fill-black ml-0.5">
                            <path d="M8 5v14l11-7z"/>
                          </svg>
                        )}
                      </div>
                    </button>
                  )}

                  {playingId === track.id && (
                    <div className="absolute bottom-2 left-2 flex items-end gap-0.5 h-4 pointer-events-none">
                      {[60, 100, 40].map((h, i) => (
                        <div
                          key={i}
                          className="w-1 bg-[#1DB954] rounded-full animate-pulse"
                          style={{ height: `${h}%`, animationDelay: `${i * 0.15}s` }}
                        />
                      ))}
                    </div>
                  )}
                </div>

                <a
                  href={track.spotifyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <p className="text-white text-sm font-medium truncate hover:text-[#1DB954] transition-colors">
                    {track.name}
                  </p>
                  <p className="text-white/60 text-xs truncate">{track.artist}</p>
                </a>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 px-4 mt-6">
            <span className="text-white/40 text-xs">Powered by</span>
            <a
              href="https://spotify.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-white/50 hover:text-[#1DB954] transition-colors"
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