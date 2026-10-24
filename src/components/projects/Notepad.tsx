'use client';

import {
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
    type CSSProperties,
    type KeyboardEvent,
    type PointerEvent,
} from 'react';
import ProjectPage from './ProjectPage';
import Spiral from './Spiral';
import {
    TAB_TUCK,
    TAB_OVERHANG,
    PAPER_TOP,
    PAPER_HEIGHT,
    PAPER_BORDER,
    PAPER_PAD,
    STACK_OFFSETS,
    TABS_TOP,
    RING_INSET,
    FRAME_HEIGHT,
    S_PAPER_HEIGHT,
    S_PAPER_TOP,
    S_PAPER_PAD_TOP,
    S_STRIP_TUCK,
    S_STRIP_LEFT,
    S_STRIP_PAD_LEFT,
    S_RING_INSET,
    S_BELOW_PAPER,
    S_MAX_WIDTH,
    desktopStickerWidth,
} from './notepadGeometry';
import TabRail from './TabRail';
import { tabId } from './tabNavigation';
import TabStrip from './TabStrip';
import { PROJECTS, type Project } from './projectsData';
import {
    announcement,
    hashForPage,
    layoutForWidth,
    pageFromHash,
    releaseSpeed,
    sheetTimings,
    stepPage,
    swipeOutcome,
    turningPages,
} from './notepadNav';

const SWIPE_LOCK_PX = 10;
const SWIPE_VELOCITY_WINDOW_MS = 100;
const CLICK_GUARD_MS = 400; // how long after a swipe its release click is still swallowed
const SPRING_MS = 200;
const SPRING_EASE = 'cubic-bezier(.34,1.56,.64,1)';

const FADE_MS = 150; // reduced motion: a plain crossfade instead
const FLIP_EASE = 'cubic-bezier(.4,0,.2,1)';
// Far enough that the page doesn't balloon toward the viewer as it passes upright
const FLIP_PERSPECTIVE = 2400;
// Forward: a sheet swings up over the rings, bottom edge first, until it stands straight up with its back
// showing (180deg), then carries on down behind the pad until it's edge-on (270deg) and the pad hides it.
// Backward plays the same turn in reverse. Offsets are where the turn passes 180deg.
// Timings for a run of sheets come from sheetTimings.
const TURN_OUT: Keyframe[] = [
    { transform: 'rotateX(0deg)' },
    { transform: 'rotateX(180deg)', offset: 2 / 3 },
    { transform: 'rotateX(270deg)' },
];
const TURN_IN: Keyframe[] = [
    { transform: 'rotateX(270deg)' },
    { transform: 'rotateX(180deg)', offset: 1 / 3 },
    { transform: 'rotateX(0deg)' },
];
// A turning sheet is drawn over the pad until it passes straight up, then behind it, at depth `k` either side.
// Forward, the first sheet of a run starts on top and ends furthest back; backward, each sheet lands on the last.
function depthFrames(dir: 1 | -1, k: number): Keyframe[] {
    const [start, end, at] = dir === 1 ? [k, -k, 2 / 3] : [-k, k, 1 / 3];
    return [{ zIndex: start }, { zIndex: start, offset: at }, { zIndex: end, offset: at }, { zIndex: end }];
}
const sheetDepth = (dir: 1 | -1, i: number, n: number) => (dir === 1 ? n - i : i + 1);
const SLIDE_MS = 250;

// A change of page in progress. Its layers are copies of the pages, drawn over the real one.
// `fromX`: where a swipe let go of the page; the sheet slides home from there while the flip runs.
// `sheets`: the pages that turn, in order (every page between, for a jump).
type Flip = { id: number; from: number; to: number; dir: 1 | -1; fromX: number; sheets: number[] };

// A touch or pen on the paper. `axis` is null until it has moved SWIPE_LOCK_PX.
type Drag = {
    id: number;
    x: number;
    y: number;
    dx: number;
    dy: number;
    axis: 'x' | 'y' | null;
    samples: { t: number; x: number }[]; // recent positions, for the release speed
};

const PAPER: CSSProperties = {
    boxSizing: 'border-box',
    padding: `${PAPER_PAD.top}px ${PAPER_PAD.x}px ${PAPER_PAD.bottom}px`,
    borderRadius: 14,
    border: `${PAPER_BORDER}px solid rgba(123,179,209,.25)`,
    backgroundColor: '#17232c',
    backgroundImage: 'linear-gradient(rgba(123,179,209,.08) 1px, transparent 1px)',
    backgroundSize: '100% 24px',
};

// The single-column paper: rounded top, a straight bottom edge for the tabs to hang from, and 20px rules
const SINGLE_PAPER: CSSProperties = {
    ...PAPER,
    padding: `${S_PAPER_PAD_TOP}px 0 0`,
    borderRadius: '14px 14px 4px 4px',
    backgroundSize: '100% 20px',
    overflow: 'hidden',
};

// The back of a sheet: plain, darker paper, turned to face away until the sheet passes upright
const PAGE_BACK: CSSProperties = {
    transform: 'rotateX(180deg)',
    backgroundColor: '#22323e',
    backgroundImage: 'none',
};

export default function Notepad({ projects = PROJECTS }: { projects?: Project[] }) {
    const rootRef = useRef<HTMLDivElement>(null);
    const titleRef = useRef<HTMLHeadingElement>(null);
    const [width, setWidth] = useState<number | null>(null);
    const [reducedMotion, setReducedMotion] = useState(false);
    const [page, setPage] = useState(0);
    const [flip, setFlip] = useState<Flip | null>(null);
    const [live, setLive] = useState('');
    // The page as of the latest go(), so quick repeated clicks never step from a stale value
    const pageRef = useRef(0);
    const flipCount = useRef(0);
    const focusPending = useRef(false);
    const layoutRef = useRef<ReturnType<typeof layoutForWidth> | null>(null);
    const resizeFocus = useRef<{ id: string; href: string | null } | null>(null);
    const fadeLayer = useRef<HTMLDivElement>(null);
    const sheetLayers = useRef<(HTMLDivElement | null)[]>([]);
    // Single column: the paper plus its flip copies, moved together by a swipe
    const sheetRef = useRef<HTMLDivElement>(null);
    const drag = useRef<Drag | null>(null);
    const spring = useRef<Animation | null>(null);
    const returnSlide = useRef<Animation | null>(null);
    // Removes the pending one-shot click guard, if any
    const stopClickGuard = useRef<(() => void) | null>(null);

    useEffect(() => {
        const query = window.matchMedia('(prefers-reduced-motion: reduce)');
        const update = () => setReducedMotion(query.matches);
        update();
        query.addEventListener('change', update);
        return () => query.removeEventListener('change', update);
    }, []);

    // The layout follows the notepad's own width, since the page's side columns narrow it
    useEffect(() => {
        const root = rootRef.current!;
        const observer = new ResizeObserver(() => {
            const nextWidth = root.clientWidth;
            const active = document.activeElement;
            if (layoutRef.current && layoutRef.current !== layoutForWidth(nextWidth) && active instanceof HTMLElement && root.contains(active)) {
                resizeFocus.current = { id: active.id, href: active instanceof HTMLAnchorElement ? active.getAttribute('href') : null };
            }
            setWidth(nextWidth);
        });
        observer.observe(root);
        return () => observer.disconnect();
    }, []);

    // A deep link (#projects/<slug>) on load: show that page and scroll the section into view.
    // Only the default notepad reads the hash. The page is set directly: no flip, no focus move, no
    // announcement, and no hash rewrite (the URL is already right). Runs once, on mount.
    const usesDefaultProjects = projects === PROJECTS;
    useEffect(() => {
        if (!usesDefaultProjects) return;
        const target = pageFromHash(location.hash, projects);
        if (target === null) return;
        pageRef.current = target;
        setPage(target);

        // Same offset as the side nav's smoothScrollTo
        const scrollToSection = () => {
            const section = document.getElementById('projects');
            if (!section) return;
            const header = document.getElementById('main-header');
            window.scrollTo(0, section.getBoundingClientRect().top + window.scrollY - (header?.offsetHeight ?? 0));
        };
        const html = document.documentElement;
        if (html.dataset.intro !== 'play') {
            scrollToSection();
            return;
        }
        // The globe intro is playing: wait for it to end
        const observer = new MutationObserver(() => {
            if (html.dataset.intro === 'play') return;
            observer.disconnect();
            scrollToSection();
        });
        observer.observe(html, { attributes: true, attributeFilter: ['data-intro'] });
        return () => observer.disconnect();
        // mount only: the hash is read once
    }, []);

    const layout = width === null ? null : layoutForWidth(width);
    layoutRef.current = layout;

    // A breakpoint replaces the page and tabs. Restore the matching control, or the page title.
    useLayoutEffect(() => {
        const previous = resizeFocus.current;
        resizeFocus.current = null;
        const root = rootRef.current;
        if (!previous || !root) return;
        const byId = previous.id ? document.getElementById(previous.id) : null;
        const link = previous.href ? Array.from(root.querySelectorAll('a')).find((el) => el.getAttribute('href') === previous.href) : null;
        const target = byId && root.contains(byId) ? byId : link ?? titleRef.current;
        target?.focus({ preventScroll: true });
    }, [layout]);

    // Crossing the threshold mid-flip or mid-swipe: finish at once and keep the page.
    // Needed, not defensive: the new layout's flip copies would otherwise mount with no animation attached.
    useLayoutEffect(() => {
        setFlip(null);
        drag.current = null;
        spring.current?.cancel();
        spring.current = null;
    }, [layout]);

    // The only way the page changes. Everything a visitor notices about a page change happens here, never on mount.
    const go = (target: number, dir: 1 | -1, fromX = 0) => {
        const from = pageRef.current;
        if (target === from) return;
        pageRef.current = target;
        // Any swipe in progress gives way; the flip below takes the sheet home from fromX
        drag.current = null;
        spring.current?.cancel();
        spring.current = null;
        if (sheetRef.current) sheetRef.current.style.transform = '';
        // A flip still running is dropped (finished at once) by replacing it with this one
        flipCount.current += 1;
        setFlip({ id: flipCount.current, from, to: target, dir, fromX, sheets: turningPages(from, target, dir, projects.length) });
        setPage(target);
        history.replaceState(null, '', hashForPage(target, projects));
        focusPending.current = true;
        setLive(announcement(target, projects));
    };

    // Focus the new title once it's in the DOM, without scrolling the window
    useLayoutEffect(() => {
        if (!focusPending.current) return;
        focusPending.current = false;
        titleRef.current?.focus({ preventScroll: true });
    }, [page]);

    // Run the current flip's animations, then remove its layers
    useLayoutEffect(() => {
        if (!flip) return;
        const { dir, sheets } = flip;
        const animations: Animation[] = [];
        if (reducedMotion) {
            const fade = fadeLayer.current;
            if (fade) animations.push(fade.animate([{ opacity: 1 }, { opacity: 0 }], { duration: FADE_MS, fill: 'both' }));
        } else {
            sheetTimings(sheets.length).forEach(({ delay, duration }, i) => {
                const layer = sheetLayers.current[i];
                const turn = layer?.firstElementChild;
                if (!layer || !turn) return;
                const timing: KeyframeAnimationOptions = { delay, duration, easing: FLIP_EASE, fill: 'both' };
                animations.push(
                    turn.animate(dir === 1 ? TURN_OUT : TURN_IN, timing),
                    layer.animate(depthFrames(dir, sheetDepth(dir, i, sheets.length)), timing),
                );
            });
        }
        if (animations.length === 0) return;
        // A swipe let go of the page off to one side: bring the sheet home as the flip starts
        const sheet = sheetRef.current;
        const slide =
            flip.fromX && sheet
                ? sheet.animate([{ transform: `translateX(${flip.fromX}px)` }, { transform: 'translateX(0)' }], {
                      duration: SLIDE_MS,
                      easing: FLIP_EASE,
                  })
                : null;
        returnSlide.current = slide;
        const id = flip.id;
        Promise.all(animations.map((a) => a.finished)).then(
            () => setFlip((f) => (f?.id === id ? null : f)),
            () => {}, // cancelled because a newer flip replaced this one
        );
        return () => {
            animations.forEach((a) => a.cancel());
            slide?.cancel();
            if (returnSlide.current === slide) returnSlide.current = null;
        };
    }, [flip, reducedMotion]);

    const count = projects.length;

    // Swipe paging, single column only: touch and pen, never the mouse.
    // The page follows the finger (unless motion is reduced), then changes or springs back.
    const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
        if (e.pointerType === 'mouse' || !e.isPrimary) return;
        stopClickGuard.current?.();
        spring.current?.cancel();
        spring.current = null;
        // The return slide would otherwise override this drag's inline transform.
        returnSlide.current?.cancel();
        returnSlide.current = null;
        drag.current = {
            id: e.pointerId,
            x: e.clientX,
            y: e.clientY,
            dx: 0,
            dy: 0,
            axis: null,
            samples: [{ t: e.timeStamp, x: e.clientX }],
        };
    };

    const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
        const d = drag.current;
        if (!d || e.pointerId !== d.id) return;
        d.dx = e.clientX - d.x;
        d.dy = e.clientY - d.y;
        d.samples.push({ t: e.timeStamp, x: e.clientX });
        while (d.samples.length > 2 && e.timeStamp - d.samples[0].t > SWIPE_VELOCITY_WINDOW_MS) d.samples.shift();
        if (d.axis === null) {
            if (Math.hypot(d.dx, d.dy) < SWIPE_LOCK_PX) return;
            d.axis = Math.abs(d.dx) > Math.abs(d.dy) ? 'x' : 'y';
            // Mainly vertical: it's a scroll, and the browser has it (touch-action: pan-y pinch-zoom)
            if (d.axis === 'y') {
                drag.current = null;
                return;
            }
            e.currentTarget.setPointerCapture(e.pointerId);
        }
        if (!reducedMotion) e.currentTarget.style.transform = `translateX(${d.dx}px)`;
    };

    const springBack = (sheet: HTMLDivElement) => {
        const from = sheet.style.transform;
        sheet.style.transform = '';
        if (!from || reducedMotion) return;
        spring.current = sheet.animate([{ transform: from }, { transform: 'translateX(0)' }], {
            duration: SPRING_MS,
            easing: SPRING_EASE,
        });
    };

    // A swipe that began on a button or link must not also activate it: swallow the click that follows the
    // release. One shot; dropped by the next pointerdown or a timeout, so it can't eat a later tap.
    const guardNextClick = (sheet: HTMLDivElement) => {
        stopClickGuard.current?.();
        const stop = () => {
            window.clearTimeout(timer);
            sheet.removeEventListener('click', swallow, true);
            stopClickGuard.current = null;
        };
        const swallow = (ev: Event) => {
            ev.preventDefault();
            ev.stopPropagation();
            stop();
        };
        const timer = window.setTimeout(stop, CLICK_GUARD_MS);
        sheet.addEventListener('click', swallow, true);
        stopClickGuard.current = stop;
    };
    useEffect(() => () => stopClickGuard.current?.(), []);

    const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
        const d = drag.current;
        if (!d || e.pointerId !== d.id) return;
        drag.current = null;
        if (d.axis !== 'x') return;
        const dx = e.clientX - d.x;
        const dy = e.clientY - d.y;
        guardNextClick(e.currentTarget);
        // Velocity over the last moments of the swipe, not the whole of it
        const speed = releaseSpeed(d.samples, e.clientX, e.timeStamp, dx);
        const outcome = swipeOutcome(dx, dy, e.currentTarget.clientWidth, speed);
        if (outcome === 'stay') {
            springBack(e.currentTarget);
            return;
        }
        const dir = outcome === 'next' ? 1 : -1;
        go(stepPage(pageRef.current, dir, count), dir, reducedMotion ? 0 : dx);
    };

    // The browser took the gesture over (a scroll), or it was interrupted: put the page back
    const onPointerCancel = (e: PointerEvent<HTMLDivElement>) => {
        const d = drag.current;
        if (!d || e.pointerId !== d.id) return;
        drag.current = null;
        if (d.axis === 'x') springBack(e.currentTarget);
    };

    const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
        if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
        // Leave keys alone in text fields and in the "more" list, which has its own arrow keys
        if ((e.target as HTMLElement).closest('input, textarea, select, [contenteditable="true"], [data-more-list]')) return;
        const at = pageRef.current;
        let target: number;
        let dir: 1 | -1;
        switch (e.key) {
            case 'ArrowLeft':
                [target, dir] = [stepPage(at, -1, count), -1];
                break;
            case 'ArrowRight':
                [target, dir] = [stepPage(at, 1, count), 1];
                break;
            case 'Home':
                [target, dir] = [0, -1];
                break;
            case 'End':
                [target, dir] = [count - 1, 1];
                break;
            default:
                return;
        }
        // Home and End would otherwise scroll the window
        e.preventDefault();
        go(target, dir);
    };

    const liveRegion = (
        <div key="announcement" aria-live="polite" className="sr-only">
            {live}
        </div>
    );

    if (width === null || layout === null) {
        // Nothing is measured yet: hold the height of whichever layout the container query picks (no layout shift)
        return (
            <div ref={rootRef} className="@container">
                {liveRegion}
                <div
                    className={PLACEHOLDER}
                    style={{
                        '--notepad-single-height': `calc(${S_PAPER_TOP}px + ${S_PAPER_HEIGHT} + ${S_BELOW_PAPER}px)`,
                        '--notepad-frame-height': `${FRAME_HEIGHT}px`,
                    } as CSSProperties}
                />
            </div>
        );
    }

    const compact = layout === 'single';
    const paperWidth = Math.max(0, width - TAB_OVERHANG);
    const pageWidth = paperWidth - 2 * (PAPER_BORDER + PAPER_PAD.x);
    const stickerWidth = desktopStickerWidth(pageWidth);

    const renderPage = (p: number, real: boolean) => (
        <ProjectPage
            project={projects[p]}
            index={p}
            compact={compact}
            titleRef={real ? titleRef : undefined}
            stickerWidth={stickerWidth}
        />
    );

    // A later page flips forward; an earlier one flips back
    const pickTab = (p: number) => go(p, p > pageRef.current ? 1 : -1);

    // The copies drawn over (and behind) the real page while it changes: paper styled `paper`, placed at `box`.
    // Their parent must isolate, so the sheets' trips behind the pad stay inside the notepad.
    // Forward: the old page and every page up to the new one turn away over the rings and down behind the pad,
    // uncovering the new one. Backward: the old page stays put while each page back to the new one comes up from
    // behind and turns down onto the pad. Reduced motion: the old page fades out over the new one.
    const flipLayers = (paper: CSSProperties, box: CSSProperties) => {
        if (!flip) return null;
        if (reducedMotion) {
            return (
                <div
                    key={flip.id}
                    ref={fadeLayer}
                    aria-hidden="true"
                    inert
                    data-page-layer=""
                    className="pointer-events-none absolute"
                    style={{ ...paper, ...box }}
                >
                    {renderPage(flip.from, false)}
                </div>
            );
        }
        return (
            <>
                {flip.dir === -1 && (
                    <div
                        key={`under-${flip.id}`}
                        aria-hidden="true"
                        inert
                        data-page-layer=""
                        className="pointer-events-none absolute"
                        style={{ ...paper, ...box }}
                    >
                        {renderPage(flip.from, false)}
                    </div>
                )}
                {flip.sheets.map((p, i) => {
                    // Before its animation takes over: on the pad (forward) or behind it (backward)
                    const depth = sheetDepth(flip.dir, i, flip.sheets.length) * flip.dir;
                    return (
                        <div
                            key={`turn-${flip.id}-${i}`}
                            ref={(el) => {
                                sheetLayers.current[i] = el;
                            }}
                            aria-hidden="true"
                            inert
                            className="pointer-events-none absolute"
                            style={{ ...box, perspective: FLIP_PERSPECTIVE, zIndex: depth }}
                        >
                            <div className="absolute inset-0 origin-top transform-3d">
                                <div data-page-layer="" className="absolute inset-0 backface-hidden" style={paper}>
                                    {renderPage(p, false)}
                                </div>
                                {/* the back of the sheet */}
                                <div className="absolute inset-0 backface-hidden" style={{ ...paper, ...PAGE_BACK }} />
                            </div>
                        </div>
                    );
                })}
            </>
        );
    };

    if (layout === 'single') {
        return (
            <div ref={rootRef} onKeyDown={onKeyDown}>
                {liveRegion}
                {/* On phones (below sm) the notepad bleeds 8px into the site's outer gutters, so the paper sits 16px
                    from each screen edge as designed. Measured width stays the root's, so the layout can't feed back. */}
                <div className="relative -mx-2 sm:mx-0">
                    {/* Behind the paper, its top tucked under the bottom edge. It spans the whole column, not just the
                        capped paper, and runs 16px further right: to the screen edge on phones, through the section's
                        gutter from sm up. Taller on fine pointers to make room for the thin scrollbar under the tabs. */}
                    <div
                        className="absolute -right-4 h-16 pointer-fine:h-[76px]"
                        style={{
                            left: S_STRIP_LEFT - S_STRIP_PAD_LEFT,
                            top: `calc(${S_PAPER_TOP - S_STRIP_TUCK}px + ${S_PAPER_HEIGHT})`,
                        }}
                    >
                        <TabStrip projects={projects} page={page} onPick={pickTab} />
                    </div>

                    <div style={{ maxWidth: S_MAX_WIDTH }}>
                        {/* Only a positioning box: it spans the strip's area too, so it lets taps through to the tabs */}
                        <div
                            className="pointer-events-none relative shrink-0"
                            style={{ height: `calc(${S_PAPER_TOP}px + ${S_PAPER_HEIGHT} + ${S_BELOW_PAPER}px)` }}
                        >
                            <div
                                ref={sheetRef}
                                onPointerDown={onPointerDown}
                                onPointerMove={onPointerMove}
                                onPointerUp={onPointerUp}
                                onPointerCancel={onPointerCancel}
                                className="pointer-events-auto absolute inset-x-0 isolate touch-pan-y touch-pinch-zoom [&_*]:touch-pan-y [&_*]:touch-pinch-zoom"
                                style={{ top: S_PAPER_TOP, height: S_PAPER_HEIGHT }}
                            >
                                <div
                                    id="project-panel"
                                    role="tabpanel"
                                    aria-labelledby={tabId(page)}
                                    data-page-layer=""
                                    className="absolute inset-0"
                                    style={SINGLE_PAPER}
                                >
                                    {renderPage(page, true)}
                                </div>

                                {/* copies of pages, drawn over the real one while it changes */}
                                {flipLayers(SINGLE_PAPER, { inset: 0 })}
                            </div>

                            <div className="absolute top-0" style={{ left: S_RING_INSET, right: S_RING_INSET }}>
                                <Spiral rings={12} ringWidth={10} ringHeight={28} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div ref={rootRef} onKeyDown={onKeyDown}>
            {liveRegion}
            {/* isolate: a page turning behind the pad stays inside the notepad */}
            <div className="relative isolate" style={{ height: FRAME_HEIGHT }}>
                {/* the pages stacked behind */}
                {STACK_OFFSETS.map((offset, k) => (
                    <div
                        key={offset}
                        aria-hidden="true"
                        className="absolute rounded-[14px]"
                        style={{
                            left: offset,
                            top: PAPER_TOP + offset,
                            width: paperWidth,
                            height: PAPER_HEIGHT,
                            background: k === 0 ? '#1f303c' : '#1b2a35',
                        }}
                    />
                ))}

                <div className="absolute" style={{ left: paperWidth - TAB_TUCK, top: TABS_TOP }}>
                    <TabRail projects={projects} page={page} onPick={pickTab} />
                </div>

                <div
                    id="project-panel"
                    role="tabpanel"
                    aria-labelledby={tabId(page)}
                    data-page-layer=""
                    className="absolute left-0"
                    style={{ ...PAPER, top: PAPER_TOP, width: paperWidth, height: PAPER_HEIGHT }}
                >
                    {renderPage(page, true)}
                </div>

                {/* copies of pages, drawn over the real one while it changes */}
                {flipLayers(PAPER, { left: 0, top: PAPER_TOP, width: paperWidth, height: PAPER_HEIGHT })}

                {/* over the pages while they turn up past them (above any run's depth) */}
                <div className="absolute top-0 z-50" style={{ left: RING_INSET, width: paperWidth - 2 * RING_INSET }}>
                    <Spiral rings={Math.round(paperWidth / 41)} ringWidth={12} ringHeight={34} />
                </div>
            </div>
        </div>
    );
}

// Before the first measurement: the desktop notepad's height (FRAME_HEIGHT) in a wide container, the single
// column's otherwise (S_PAPER_TOP + S_PAPER_HEIGHT + S_BELOW_PAPER).
// Literal classes keep Tailwind detection static; CSS variables use the shared geometry.
const PLACEHOLDER = 'h-[var(--notepad-single-height)] @min-[720px]:h-[var(--notepad-frame-height)]';
