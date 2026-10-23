import React from 'react';
import type { Loadable, SpotifyEntry } from '../useInterestData';
import PanelShell, { LABEL_ICONS } from './PanelShell';
import PanelState, { ERROR_ICON, RECORD_ICON, SkeletonBar } from './PanelState';

const ROWS = 5;
const SKELETON: [string, string][] = [
    ['62%', '38%'],
    ['74%', '46%'],
    ['55%', '30%'],
    ['68%', '42%'],
    ['50%', '34%'],
];

// Spotify's icon, carried over from the old Spotify section
const SPOTIFY_ICON = (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4 flex-none fill-[#1db954]">
        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
    </svg>
);

export default function MusicPanel(props: { compact: boolean; data: Loadable<SpotifyEntry[]>; onRetry: () => void }) {
    const { compact, data, onRetry } = props;
    const entries = data.status === 'ready' ? data.data.slice(0, ROWS) : [];
    return (
        <PanelShell
            kind="music"
            icon={LABEL_ICONS.music}
            title="On repeat lately"
            compact={compact}
            titleId="music-panel-title"
            footer={
                <span className="flex min-w-0 items-center gap-2">
                    {SPOTIFY_ICON}
                    <span className="truncate">Data from Spotify</span>
                </span>
            }
        >
            {data.status === 'loading' && (
                <div aria-busy="true" aria-label="Loading tracks" className="flex flex-col gap-1">
                    {SKELETON.map(([a, b], i) => (
                        <div key={i} className="flex h-16 items-center gap-3">
                            <div className="size-12 flex-none rounded-md bg-white/6" />
                            <div className="flex flex-1 flex-col gap-2">
                                <SkeletonBar width={a} height={12} strong />
                                <SkeletonBar width={b} height={10} />
                            </div>
                        </div>
                    ))}
                </div>
            )}
            {data.status === 'error' && (
                <PanelState icon={ERROR_ICON} headline="Couldn’t load from Spotify" line="This usually clears up in a minute." onRetry={onRetry} />
            )}
            {data.status === 'ready' && entries.length === 0 && (
                <PanelState icon={RECORD_ICON} headline="Nothing on repeat right now" line="The record player’s taking a break." />
            )}
            {entries.length > 0 && (
                <ol className="m-0 flex list-none flex-col gap-1 p-0">
                    {entries.map(({ artist, track }) => (
                        <li key={track.id}>
                            <a
                                href={track.spotifyUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="-mx-2 flex h-16 items-center gap-3 rounded-lg px-2 text-inherit no-underline hover:bg-[#2d4a57]/20 focus-visible:outline-2 focus-visible:outline-[#7bb3d1]"
                            >
                                {track.albumArt ? (
                                    <img src={track.albumArt} alt="" className="size-12 flex-none rounded-md object-cover" />
                                ) : (
                                    <div aria-hidden="true" className="flex size-12 flex-none items-center justify-center rounded-md bg-[#2d4a57]">
                                        <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth={1.4}>
                                            <circle cx="8" cy="8" r="6" />
                                            <circle cx="8" cy="8" r="1.5" />
                                        </svg>
                                    </div>
                                )}
                                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                                    {/* Cut off with an ellipsis; the browser's tooltip shows the full text on hover */}
                                    <span title={track.name} className="truncate text-[15px] leading-5 font-medium">
                                        {track.name}
                                    </span>
                                    <span title={artist.name} className="truncate text-[13px] leading-[18px] text-[#9ca3af]">
                                        {artist.name}
                                    </span>
                                </div>
                            </a>
                        </li>
                    ))}
                </ol>
            )}
        </PanelShell>
    );
}
