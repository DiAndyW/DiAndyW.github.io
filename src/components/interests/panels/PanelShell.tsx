import React from 'react';
import { INTERESTS } from '../interestsData';
import type { InterestId } from '../roomLayout';

// The frame all four panels share (handoff §6 "Shared shell"); `compact` is the phone's bottom sheet.
// The header and footer stay put while the body scrolls.
export default function PanelShell(props: {
    kind: InterestId;
    icon: React.ReactNode;
    title: string;
    meta?: string;
    compact: boolean;
    titleId: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
    // Body padding differs between the list panels and the grid/card panels
    bodyClassName?: string;
}) {
    const { kind, icon, title, meta, compact, titleId, children, footer, bodyClassName } = props;
    const label = INTERESTS.find((i) => i.id === kind)!.label;
    return (
        <aside
            aria-labelledby={titleId}
            className={`flex h-full w-full flex-col overflow-hidden border border-[#7bb3d1]/50 bg-[#17232c] font-sans text-white ${
                compact ? 'rounded-t-2xl' : 'rounded-xl'
            }`}
        >
            {compact && (
                <div aria-hidden="true" className="flex justify-center pt-2">
                    <div className="h-1 w-9 rounded-sm bg-white/25" />
                </div>
            )}
            <header className={`flex flex-col gap-1 ${compact ? 'px-5 pt-3 pb-3.5' : 'px-6 pt-5 pb-4'}`}>
                <div className="flex items-center gap-1.5 text-xs leading-4 font-semibold tracking-[0.08em] text-[#7bb3d1] uppercase">
                    {icon}
                    {label}
                </div>
                <h3 id={titleId} tabIndex={-1} className="m-0 text-xl leading-7 font-semibold tracking-[-0.01em] outline-none">
                    {title}
                </h3>
                {meta && <p className="m-0 truncate text-[13px] leading-[18px] text-[#9ca3af]">{meta}</p>}
            </header>
            <div className="h-px flex-none bg-white/8" />
            <div className={`flex min-h-0 flex-1 flex-col overflow-y-auto ${bodyClassName ?? (compact ? 'px-5 py-3' : 'px-6 py-4')}`}>{children}</div>
            {footer && (
                <footer
                    className={`flex flex-none items-center justify-between gap-3 border-t border-white/8 text-xs leading-4 text-[#9ca3af] ${
                        compact ? 'px-5 pt-3 pb-5' : 'px-6 py-3'
                    }`}
                >
                    {footer}
                </footer>
            )}
        </aside>
    );
}

// 14px stroke icons for the panel labels, from the design
const labelIcon = (children: React.ReactNode) => (
    <svg aria-hidden="true" width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
        {children}
    </svg>
);

export const LABEL_ICONS: Record<InterestId, React.ReactNode> = {
    music: labelIcon(
        <>
            <circle cx="8" cy="8" r="6.25" />
            <circle cx="8" cy="8" r="1.75" />
        </>,
    ),
    games: labelIcon(
        <>
            <rect x="1.75" y="2.75" width="12.5" height="8.5" rx="1.25" />
            <path d="M5.5 14h5M8 11.25V14" />
        </>,
    ),
    food: labelIcon(
        <>
            <path d="M1.75 7.5h12.5a6.25 5.5 0 0 1-12.5 0Z" />
            <path d="M6 4.5c-.6-.8.6-1.5 0-2.5M9.5 4.5c-.6-.8.6-1.5 0-2.5" />
        </>,
    ),
    cats: labelIcon(<path d="M3 6.5V2l3 2.5h4L13 2v4.5c0 3.5-2.2 6.5-5 6.5s-5-3-5-6.5Z" />),
};
