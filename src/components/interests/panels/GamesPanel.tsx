import React, { useEffect, useRef, useState } from 'react';
import type { SteamGame, SteamGamesResponse } from '../../../app/api/steam/steamGames';
import type { Loadable } from '../useInterestData';
import PanelShell, { LABEL_ICONS } from './PanelShell';
import PanelState, { ERROR_ICON, MONITOR_ICON, SkeletonBar } from './PanelState';

const SKELETON = ['58%', '46%', '64%'];
const hrs = (hours: number) => `${hours.toFixed(1)} hrs`;

// A Steam header image; a missing one falls back to the empty tile
function Header({ game, className }: { game: SteamGame; className: string }) {
    const [broken, setBroken] = useState(false);
    const img = useRef<HTMLImageElement>(null);
    // An image can fail before React attaches onError
    useEffect(() => {
        const el = img.current;
        if (el?.complete && el.naturalWidth === 0) setBroken(true);
    }, []);
    return broken ? (
        <div aria-hidden="true" className={`${className} bg-[#22313b]`} />
    ) : (
        <img ref={img} src={game.image} alt="" onError={() => setBroken(true)} className={`${className} object-cover`} />
    );
}

export default function GamesPanel(props: { compact: boolean; data: Loadable<SteamGamesResponse>; onRetry: () => void }) {
    const { compact, data, onRetry } = props;
    const imageSize = compact ? 'h-[45px] w-24' : 'h-[52px] w-28';
    const games = data.status === 'ready' ? data.data : null;
    const longest = games?.top[0]?.hours || 1;

    return (
        <PanelShell
            kind="games"
            icon={LABEL_ICONS.games}
            title="Most played"
            compact={compact}
            titleId="games-panel-title"
            bodyClassName={compact ? 'px-5 pt-3 pb-4' : 'px-6 pt-3 pb-5'}
            footer={<span className="truncate">Data from Steam</span>}
        >
            {data.status === 'loading' && (
                <div aria-busy="true" aria-label="Loading games" className="flex flex-col gap-1">
                    {SKELETON.map((width, i) => (
                        <div key={i} className="flex h-16 items-center gap-3.5">
                            <div className={`${imageSize} flex-none rounded-md bg-white/6`} />
                            <div className="flex flex-1 flex-col gap-2.5">
                                <div className="flex justify-between">
                                    <SkeletonBar width={width} height={12} strong />
                                    <div className="h-3 w-14 rounded bg-white/6" />
                                </div>
                                <div className="h-[3px] rounded-sm bg-white/6" />
                            </div>
                        </div>
                    ))}
                </div>
            )}
            {data.status === 'error' && (
                <PanelState icon={ERROR_ICON} headline="Couldn’t reach Steam" line="Steam’s API is having a moment. Try again shortly." onRetry={onRetry} />
            )}
            {games && games.top.length === 0 && (
                <PanelState icon={MONITOR_ICON} headline="No playtime to show yet" line="The computer’s been off. Check back soon." />
            )}
            {games && games.top.length > 0 && (
                <div className="flex flex-col gap-5">
                    <ol className="m-0 flex list-none flex-col gap-1 p-0">
                        {games.top.map((game) => (
                            <li key={game.appid} className="flex h-16 items-center gap-3.5">
                                <Header game={game} className={`${imageSize} flex-none rounded-md border border-white/8`} />
                                <div className="flex min-w-0 flex-1 flex-col gap-2">
                                    <div className="flex items-baseline gap-3">
                                        {/* Cut off with an ellipsis; the browser's tooltip shows the full text on hover */}
                                        <a
                                            title={game.name}
                                            href={game.storeUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="min-w-0 flex-1 truncate text-[15px] leading-5 font-medium text-inherit no-underline hover:underline"
                                        >
                                            {game.name}
                                        </a>
                                        <span className="w-[84px] flex-none text-right text-[13px] leading-[18px] whitespace-nowrap text-[#d1d5db] tabular-nums">
                                            {hrs(game.hours)}
                                        </span>
                                    </div>
                                    <div aria-hidden="true" className="h-[3px] rounded-sm bg-white/8">
                                        <div className="h-[3px] rounded-sm bg-[#5d97b3]" style={{ width: `${(game.hours / longest) * 100}%` }} />
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ol>
                    {games.recent.length > 0 && (
                        <section aria-labelledby="games-lately" className="flex flex-col gap-2.5">
                            <h4 id="games-lately" className="m-0 text-xs leading-4 font-semibold tracking-[0.08em] text-[#7bb3d1] uppercase">
                                Lately
                            </h4>
                            <ul className="m-0 grid list-none grid-cols-3 gap-3 p-0">
                                {games.recent.map((game) => (
                                    <li key={game.appid} className="flex min-w-0 flex-col gap-1.5">
                                        <Header game={game} className="aspect-[460/215] w-full rounded-md border border-white/8" />
                                        <span title={game.name} className="truncate text-[13px] leading-[18px] font-medium">
                                            {game.name}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}
                </div>
            )}
        </PanelShell>
    );
}
