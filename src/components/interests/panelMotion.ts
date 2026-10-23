// How the panel moves (handoff §4): it waits for the swoop to get going, then slides in from the right,
// or up from the bottom as the phone's sheet

const PANEL_DELAY_MS = 380;
const PANEL_MS = 420;
const PANEL_EASE = 'cubic-bezier(.2,.8,.2,1)';

// hidden: mounted, waiting a frame to enter; entering: sliding in after the delay;
// open: in place (also snapping back after a drag); dragging: following a swipe on the sheet
export type PanelPhase = 'hidden' | 'entering' | 'open' | 'dragging';

export function panelStyle(
    phase: PanelPhase,
    opts: { compact: boolean; reducedMotion: boolean; dragY: number },
): { transition?: string; transform: string; opacity: number } {
    const { compact, reducedMotion, dragY } = opts;
    const at = (shown: boolean, offset = 0) =>
        compact ? `translateY(${shown ? `${offset}px` : '100%'})` : `translateX(${shown ? '0' : 'calc(100% + 12px)'})`;
    if (reducedMotion) return { transform: at(true, dragY), opacity: 1 };
    if (phase === 'dragging') return { transition: 'none', transform: at(true, dragY), opacity: 1 };
    const delay = phase === 'entering' ? PANEL_DELAY_MS : 0;
    const shown = phase !== 'hidden';
    return {
        transition: `transform ${PANEL_MS}ms ${PANEL_EASE} ${delay}ms, opacity ${PANEL_MS}ms ${PANEL_EASE} ${delay}ms`,
        transform: at(shown),
        opacity: shown ? 1 : 0,
    };
}
