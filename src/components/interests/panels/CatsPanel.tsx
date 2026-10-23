import React from 'react';
import { CATS, type Cat } from '../interestsData';
import PanelShell, { LABEL_ICONS } from './PanelShell';

const COLOURS: Record<Cat['colour'], { fur: string; tile: string }> = {
    Orange: { fur: '#e8913f', tile: '#3a2a1f' },
    Calico: { fur: '#efe2cf', tile: '#33302b' },
    Gray: { fur: '#9aa3ad', tile: '#262d34' },
};

// A sitting cat tinted with the cat's colour, until real photos exist (design/CatsPanel.dc.html)
function Silhouette({ colour }: { colour: Cat['colour'] }) {
    const { fur } = COLOURS[colour];
    return (
        <svg aria-hidden="true" width="50" height="50" viewBox="0 0 56 56">
            <path d="M18 54 C13 54 12 48 13 41 C14 33 17 28 21 25 L19 11 L25 17.5 L31 17.5 L37 11 L35 25 C39 28 42 34 42 41 C42 48 39 54 35 54 Z" fill={fur} />
            <path d="M41 50 C50 50 52 42 47 36" fill="none" stroke={fur} strokeWidth={4} strokeLinecap="round" />
            {colour === 'Calico' && (
                <>
                    <path d="M21 25 L19 11 L25 17.5 L28 17.5 L27 31 C24 33 20 32 17 30 C18 28 19 26 21 25 Z" fill="#d9822f" />
                    <path d="M30 40 C34 36 40 36 42 40 C42 47 39 54 35 54 L30 54 C28 50 27 44 30 40 Z" fill="#2b2420" />
                    <path d="M33 22 L37 11 L35 25 Z" fill="#2b2420" />
                </>
            )}
        </svg>
    );
}

export default function CatsPanel(props: { compact: boolean }) {
    const { compact } = props;
    return (
        <PanelShell
            kind="cats"
            icon={LABEL_ICONS.cats}
            title="Cats I’ve had"
            compact={compact}
            titleId="cats-panel-title"
            bodyClassName={compact ? 'px-5 pt-4 pb-6' : 'px-6 pt-5 pb-6'}
        >
            <ul className="m-0 flex list-none flex-col gap-2 p-0">
                {CATS.map((cat) => (
                    <li key={cat.name} className="box-border flex h-20 items-center gap-3.5 rounded-lg border border-white/14 bg-[#2d4a57]/20 pr-3.5 pl-3">
                        {cat.photo ? (
                            <img src={cat.photo} alt={`Photo of ${cat.name}`} className="size-14 flex-none rounded-lg object-cover" />
                        ) : (
                            <div
                                role="img"
                                aria-label={`${cat.name}, a ${cat.colour.toLowerCase()} cat`}
                                className="flex size-14 flex-none items-end justify-center overflow-hidden rounded-lg"
                                style={{ background: COLOURS[cat.colour].tile }}
                            >
                                <Silhouette colour={cat.colour} />
                            </div>
                        )}
                        <div className="flex min-w-0 flex-1 flex-col gap-1">
                            <span className="truncate text-base leading-[22px] font-semibold">{cat.name}</span>
                            {/* An empty note still holds its line, so every card is the same height */}
                            <span className="h-[18px] truncate text-[13px] leading-[18px] text-[#9ca3af]">{cat.note}</span>
                        </div>
                    </li>
                ))}
            </ul>
        </PanelShell>
    );
}
