// Desktop tabs tuck under the paper; the active width sets the frame overhang.
export const TAB_TUCK = 20;
export const TAB_WIDTH = 128;
export const ACTIVE_TAB_WIDTH = 150;

// Desktop frame, after the BDesktop artboard. The rings sit at the top of the frame and overlap the paper's top edge.
export const TAB_OVERHANG = ACTIVE_TAB_WIDTH - TAB_TUCK; // the active tab sticks out 130px; it never slides, and the others slide only to 114
export const PAPER_TOP = 18;
export const PAPER_HEIGHT = 570;
export const PAPER_BORDER = 1;
export const PAPER_PAD = { top: 40, x: 28, bottom: 20 };
export const STACK_OFFSETS = [10, 5]; // back to front
export const TABS_TOP = PAPER_TOP + 34;
export const RING_INSET = 40;
// The whole notepad; the placeholder before the first measurement matches it.
export const FRAME_HEIGHT = 604;

// Single-column frame, after the BMobile artboard. The paper's height is CSS, so it can follow the viewport.
export const S_PAPER_HEIGHT = 'max(420px, min(620px, calc(100svh - 180px)))';
export const S_PAPER_TOP = 14; // the rings stand this far above the paper
export const S_PAPER_PAD_TOP = 22;
export const S_STRIP_TUCK = 8; // the tab strip's top sits this far under the paper
export const S_STRIP_HEIGHT = 64; // the active tab is 60 tall, plus room for its focus ring (more on fine pointers: see the strip)
export const S_STRIP_LEFT = 10;
export const S_STRIP_PAD_LEFT = 4; // TabStrip's own left padding, so the first tab still starts 10px in
export const S_RING_INSET = 20;
// How far the tab strip hangs below the paper
export const S_BELOW_PAPER = 0;
export const S_SIDE_WIDTH = 40;
// Wider than this, lines on the page get long, so the paper stops growing and stays left-aligned
export const S_MAX_WIDTH = 560;

// Desktop page geometry: side padding, and the sticker column's share of the width inside it.
export const PAGE_PAD_X = 24;
export const ART_SPLIT = 0.36;
export const ART_GAP = 32;

// The widest sticker that fits the sticker column of a desktop page `pageWidth` wide.
// Leaves a few pixels for the tilt and the lift; never wider than 240.
export function desktopStickerWidth(pageWidth: number): number {
    const column = (pageWidth - 2 * PAGE_PAD_X - ART_GAP) * ART_SPLIT;
    return Math.max(0, Math.min(240, Math.floor(column - 8)));
}

