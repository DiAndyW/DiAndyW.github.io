import React, { useEffect, useRef, useState } from 'react';
import { DISHES } from '../interestsData';
import PanelShell, { LABEL_ICONS } from './PanelShell';
import PanelState from './PanelState';

// One photo: a skeleton tile while it loads, the placeholder tile if it fails
function Photo({ src, name, height }: { src: string; name: string; height: number }) {
    const [state, setState] = useState<'loading' | 'ready' | 'broken'>('loading');
    const img = useRef<HTMLImageElement>(null);
    // A cached photo can finish before React attaches onLoad
    useEffect(() => {
        const el = img.current;
        if (el?.complete) setState(el.naturalWidth > 0 ? 'ready' : 'broken');
    }, []);
    if (state === 'broken') {
        return (
            <div
                role="img"
                aria-label={`Photo of ${name}`}
                className="flex items-center justify-center rounded-lg border border-white/8 bg-[#22313b] text-[#6b7280]"
                style={{ height }}
            >
                <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round">
                    <rect x="1.75" y="3" width="12.5" height="10" rx="1.5" />
                    <circle cx="5.5" cy="6.5" r="1.25" />
                    <path d="m14.25 10.5-3.5-3.5-6.5 6" />
                </svg>
            </div>
        );
    }
    return (
        <div className={`overflow-hidden rounded-lg ${state === 'loading' ? 'bg-white/6' : ''}`} style={{ height }}>
            <img
                ref={img}
                src={src}
                alt={`Photo of ${name}`}
                onLoad={() => setState('ready')}
                onError={() => setState('broken')}
                className={`h-full w-full object-cover transition-opacity duration-200 ${state === 'ready' ? 'opacity-100' : 'opacity-0'}`}
            />
        </div>
    );
}

export default function FoodPanel(props: { compact: boolean }) {
    const { compact } = props;
    const [hero, tile] = compact ? [168, 112] : [184, 124];
    return (
        <PanelShell
            kind="food"
            icon={LABEL_ICONS.food}
            title="Good food I’ve enjoyed"
            compact={compact}
            titleId="food-panel-title"
            bodyClassName={compact ? 'px-5 pt-4 pb-6' : 'px-6 pt-5 pb-6'}
        >
            {DISHES.length === 0 ? (
                <PanelState headline="The table’s empty for now" line="More dishes coming soon." />
            ) : (
                <ul className="m-0 grid list-none grid-cols-2 gap-x-3 gap-y-4 p-0">
                    {DISHES.map((dish, i) => (
                        <li key={dish.name} className={`min-w-0 ${i === 0 ? 'col-span-2' : ''}`}>
                            <figure className="m-0 flex flex-col gap-2">
                                <Photo src={dish.src} name={dish.name} height={i === 0 ? hero : tile} />
                                <figcaption className="flex flex-col gap-0.5">
                                    {/* Cut off with an ellipsis; the browser's tooltip shows the full text on hover */}
                                    <span title={dish.name} className="truncate text-sm leading-5 font-medium">
                                        {dish.name}
                                    </span>
                                    <span title={dish.caption} className="line-clamp-2 h-9 text-[13px] leading-[18px] text-[#9ca3af]">
                                        {dish.caption}
                                    </span>
                                </figcaption>
                            </figure>
                        </li>
                    ))}
                </ul>
            )}
        </PanelShell>
    );
}
