import React from 'react';

// Error and empty states, centred in a panel's body (handoff §6 "States")
export default function PanelState(props: { icon?: React.ReactNode; headline: string; line: string; onRetry?: () => void }) {
    const { icon, headline, line, onRetry } = props;
    return (
        <div role={onRetry ? 'alert' : undefined} className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
            {icon}
            <div className="flex flex-col gap-1">
                <p className="m-0 text-[15px] leading-5 font-medium">{headline}</p>
                <p className="m-0 text-[13px] leading-[18px] text-[#9ca3af]">{line}</p>
            </div>
            {onRetry && (
                <button
                    type="button"
                    onClick={onRetry}
                    className="h-9 cursor-pointer rounded-lg border border-white/30 bg-transparent px-4 text-sm leading-none font-medium text-white hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7bb3d1]"
                >
                    Try again
                </button>
            )}
        </div>
    );
}

const stateIcon = (children: React.ReactNode) => (
    <svg aria-hidden="true" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#7bb3d1" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
        {children}
    </svg>
);

export const ERROR_ICON = stateIcon(
    <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7.5v5.5M12 16.5h.01" />
    </>,
);

export const RECORD_ICON = stateIcon(
    <>
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="12" r="2.5" />
    </>,
);

export const MONITOR_ICON = stateIcon(
    <>
        <rect x="3" y="4" width="18" height="12.5" rx="1.75" />
        <path d="M8.5 20h7M12 16.5V20" />
    </>,
);

// A grey bar standing in for a line of text while loading
export function SkeletonBar({ width, height, strong = false }: { width: string; height: number; strong?: boolean }) {
    return <div className={`rounded ${strong ? 'bg-white/8' : 'bg-white/5'}`} style={{ width, height }} />;
}
