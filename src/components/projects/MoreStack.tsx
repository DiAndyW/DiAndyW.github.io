'use client';

import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react';
import FeaturedStar from './FeaturedStar';
import { TWO_TONE, type Project } from './projectsData';

const SLIVERS = 5;
const SLIVER_STEP = 6; // vertical offset between slivers
const SLIVER_SHRINK = 4; // each sliver is this much narrower than the one above
const SLIVER_WIDTH = 112; // the first sliver, 16px narrower than a pinned tab
const TAB_HEIGHT = 44;
const STACK_HEIGHT = 100;
const PANEL_WIDTH = 196;
const PANEL_HEIGHT = 300;
const PANEL_RISE = 92; // the panel starts this far above the stack, so it covers the stack
const HOVER_OPEN_MS = 150;
const HOVER_CLOSE_MS = 300;
const MOTION_MS = 150;
const SLIDE_PX = 8;

// The projects that don't fit on the pinned tabs, piled under them. Hover or click opens a scrolling list.
export default function MoreStack({
    projects,
    rest,
    page,
    onPick,
}: {
    projects: Project[];
    rest: number[];
    page: number;
    onPick: (page: number) => void;
}) {
    const [open, setOpen] = useState(false);
    const rootRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    const bodyRef = useRef<HTMLDivElement>(null);
    const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);
    const openTimer = useRef<number | undefined>(undefined);
    const closeTimer = useRef<number | undefined>(undefined);
    const focusFirst = useRef(false);

    const clearTimers = () => {
        window.clearTimeout(openTimer.current);
        window.clearTimeout(closeTimer.current);
    };
    useEffect(() => clearTimers, []);

    // Focus inside the panel would fall to <body> when it unmounts: hand it to the stack button.
    // `toPage`: the caller is about to move focus to the new page's title, so leave it be.
    const close = (toPage = false) => {
        clearTimers();
        if (!toPage && panelRef.current?.contains(document.activeElement)) buttonRef.current?.focus({ preventScroll: true });
        setOpen(false);
    };

    // Move focus to an option and keep it in view by scrolling only the list body, never the window
    const focusOption = (k: number) => {
        const el = optionRefs.current[k];
        const body = bodyRef.current;
        if (!el || !body) return;
        el.focus({ preventScroll: true });
        if (el.offsetTop < body.scrollTop) body.scrollTop = el.offsetTop;
        else if (el.offsetTop + el.offsetHeight > body.scrollTop + body.clientHeight)
            body.scrollTop = el.offsetTop + el.offsetHeight - body.clientHeight;
    };

    // Fade in, with an 8px slide unless the visitor prefers reduced motion
    useLayoutEffect(() => {
        const el = panelRef.current;
        if (!open || !el) return;
        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const animation = el.animate(
            reduced
                ? [{ opacity: 0 }, { opacity: 1 }]
                : [
                      { opacity: 0, transform: `translateX(-${SLIDE_PX}px)` },
                      { opacity: 1, transform: 'translateX(0)' },
                  ],
            { duration: MOTION_MS, easing: 'ease-out' },
        );
        return () => animation.cancel();
    }, [open]);

    // Opened from the keyboard or a click: focus the first option
    useLayoutEffect(() => {
        if (open && focusFirst.current) focusOption(0);
        focusFirst.current = false;
    }, [open]);

    // Esc closes (back to the stack button); a press outside closes without moving focus
    useEffect(() => {
        if (!open) return;
        const onKey = (e: globalThis.KeyboardEvent) => {
            if (e.key !== 'Escape') return;
            e.preventDefault();
            close();
            buttonRef.current?.focus({ preventScroll: true });
        };
        const onDown = (e: PointerEvent) => {
            if (!rootRef.current?.contains(e.target as Node)) close();
        };
        document.addEventListener('keydown', onKey);
        document.addEventListener('pointerdown', onDown);
        return () => {
            document.removeEventListener('keydown', onKey);
            document.removeEventListener('pointerdown', onDown);
        };
    }, [open]);

    const onPointerEnter = (e: React.PointerEvent) => {
        if (e.pointerType !== 'mouse') return;
        window.clearTimeout(closeTimer.current);
        if (!open) {
            window.clearTimeout(openTimer.current);
            openTimer.current = window.setTimeout(() => setOpen(true), HOVER_OPEN_MS);
        }
    };
    const onPointerLeave = (e: React.PointerEvent) => {
        if (e.pointerType !== 'mouse') return;
        window.clearTimeout(openTimer.current);
        if (open) {
            window.clearTimeout(closeTimer.current);
            closeTimer.current = window.setTimeout(() => close(), HOVER_CLOSE_MS);
        }
    };

    const onListKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
        const at = optionRefs.current.findIndex((el) => el === document.activeElement);
        let to: number;
        switch (e.key) {
            case 'ArrowDown':
                to = Math.min(at + 1, rest.length - 1);
                break;
            case 'ArrowUp':
                to = Math.max(at - 1, 0);
                break;
            case 'Home':
                to = 0;
                break;
            case 'End':
                to = rest.length - 1;
                break;
            default:
                return;
        }
        e.preventDefault();
        focusOption(to);
    };

    // Tabbing out of the open list closes it
    const onBlur = (e: React.FocusEvent) => {
        if (open && e.relatedTarget && !rootRef.current?.contains(e.relatedTarget as Node)) close();
    };

    const slivers = rest.slice(0, SLIVERS).map((p, k) => ({ p, k }));

    return (
        <div
            ref={rootRef}
            className="relative mt-1.5"
            style={{ width: SLIVER_WIDTH + 16, height: STACK_HEIGHT }}
            onPointerEnter={onPointerEnter}
            onPointerLeave={onPointerLeave}
            onBlur={onBlur}
        >
            <button
                ref={buttonRef}
                type="button"
                aria-expanded={open}
                aria-controls="more-projects"
                aria-label={`Show ${rest.length} more projects`}
                onClick={() => {
                    clearTimers();
                    if (open) {
                        close();
                    } else {
                        focusFirst.current = true;
                        setOpen(true);
                    }
                }}
                className="relative block h-full w-full cursor-pointer border-0 bg-transparent p-0 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
                {/* back to front, so the first (top) sliver is drawn last */}
                {[...slivers].reverse().map(({ p, k }) => {
                    const { light } = TWO_TONE[projects[p].color];
                    return (
                        <span
                            key={p}
                            aria-hidden="true"
                            className="absolute left-0 overflow-hidden rounded-r-[10px]"
                            style={{
                                top: k * SLIVER_STEP,
                                width: SLIVER_WIDTH - k * SLIVER_SHRINK,
                                height: TAB_HEIGHT,
                                background: light,
                            }}
                        />
                    );
                })}
                <span
                    className="absolute inline-flex h-[22px] items-center whitespace-nowrap rounded-full bg-[#111827] px-2 text-[11px] font-semibold leading-none text-white"
                    style={{ left: 30, top: (SLIVERS - 1) * SLIVER_STEP + TAB_HEIGHT + 2 }}
                >
                    +{rest.length} more
                </span>
            </button>

            {open && (
                <div
                    ref={panelRef}
                    id="more-projects"
                    role="listbox"
                    aria-label="More projects"
                    data-more-list=""
                    onKeyDown={onListKeyDown}
                    className="absolute left-0 z-20 box-border flex flex-col gap-1.5 rounded-r-[12px] border border-l-0 border-[rgba(123,179,209,.5)] bg-[#17232c] py-2 pl-0 pr-2"
                    style={{ top: -PANEL_RISE, width: PANEL_WIDTH, height: PANEL_HEIGHT }}
                >
                    <div className="flex items-baseline justify-between pb-0.5 pl-3.5 pr-2.5 pt-1">
                        <span className="text-[11px] font-semibold uppercase tracking-[.08em] text-[#7bb3d1]">More projects</span>
                        <span className="text-[11px] text-[#9ca3af]">{rest.length} more</span>
                    </div>
                    <div ref={bodyRef} className="relative flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto pr-1">
                        {rest.map((p, k) => {
                            const project = projects[p];
                            const { light } = TWO_TONE[project.color];
                            return (
                                <button
                                    key={p}
                                    ref={(el) => {
                                        optionRefs.current[k] = el;
                                    }}
                                    type="button"
                                    role="option"
                                    aria-selected={p === page}
                                    tabIndex={-1}
                                    title={project.title}
                                    onClick={() => {
                                        // A different page takes focus itself (go); re-picking the current one doesn't
                                        close(p !== page);
                                        onPick(p);
                                    }}
                                    className="relative flex w-full flex-none cursor-pointer items-center gap-1.5 overflow-hidden rounded-r-[10px] border-0 pl-3.5 pr-3 text-left text-xs font-semibold leading-none text-[#1f2937] hover:brightness-[.9] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#1f2937]"
                                    style={{ height: TAB_HEIGHT, background: light }}
                                >
                                    {project.featured && <FeaturedStar />}
                                    <span className="relative truncate">{project.title}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
