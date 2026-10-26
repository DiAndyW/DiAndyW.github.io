'use client';

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import RoomStage from './interests/RoomStage';
import { INTERESTS } from './interests/interestsData';
import { HIT_BOXES, restFrame, screenRect, type InterestId } from './interests/roomLayout';
import { panelStyle, type PanelPhase } from './interests/panelMotion';
import { useInterestData } from './interests/useInterestData';
import CatsPanel from './interests/panels/CatsPanel';
import FoodPanel from './interests/panels/FoodPanel';
import GamesPanel from './interests/panels/GamesPanel';
import MusicPanel from './interests/panels/MusicPanel';
import { containModalFocus } from './interests/modalFocus';

// Below this stage width the room is the phone layout: a 4:5 stage that opens full-screen with a bottom sheet
const MOBILE_WIDTH = 640;
// Dragging the sheet down this far, or flicking it faster than this (px/ms), closes it
const SWIPE_CLOSE_PX = 80;
const SWIPE_FLICK = 0.5;

export default function InterestsSection() {
    const { music, games, retryMusic, retryGames } = useInterestData();
    const [focus, setFocus] = useState<InterestId | null>(null);
    const [phase, setPhase] = useState<PanelPhase>('hidden');
    const [compact, setCompact] = useState(false);
    const [reducedMotion, setReducedMotion] = useState(false);
    const [dragY, setDragY] = useState(0);
    const wrapRef = useRef<HTMLDivElement>(null);
    const roomRef = useRef<HTMLDivElement>(null);
    const transitionRect = useRef<DOMRect | null>(null);
    const returnTo = useRef<HTMLElement | null>(null);
    const drag = useRef<{ y: number; time: number } | null>(null);

    useEffect(() => {
        const query = window.matchMedia('(prefers-reduced-motion: reduce)');
        const update = () => setReducedMotion(query.matches);
        update();
        query.addEventListener('change', update);
        return () => query.removeEventListener('change', update);
    }, []);

    // The layout follows the section's own width, since the page's side columns narrow it
    useEffect(() => {
        const wrap = wrapRef.current!;
        const observer = new ResizeObserver(() => setCompact(wrap.clientWidth < MOBILE_WIDTH));
        observer.observe(wrap);
        return () => observer.disconnect();
    }, []);

    const open = (id: InterestId, opener?: HTMLButtonElement) => {
        if (!focus) {
            if (compact) transitionRect.current = roomRef.current?.getBoundingClientRect() ?? null;
            const active = opener ?? document.activeElement;
            returnTo.current = active instanceof HTMLElement && active !== document.body ? active : roomRef.current;
        }
        setFocus(id);
    };

    const close = () => {
        if (compact) transitionRect.current = roomRef.current?.getBoundingClientRect() ?? null;
        setFocus(null);
        setPhase('hidden');
        setDragY(0);
    };

    // Start sliding in on the frame after the panel mounts; switching interests keeps it where it is
    useEffect(() => {
        if (!focus || phase !== 'hidden') return;
        let raf = requestAnimationFrame(() => {
            raf = requestAnimationFrame(() => setPhase('entering'));
        });
        return () => cancelAnimationFrame(raf);
    }, [focus, phase]);

    // Focus goes into the panel on open and back to whatever opened it on close
    const opened = useRef(false);
    useEffect(() => {
        if (focus) {
            document.getElementById(`${focus}-panel-title`)?.focus({ preventScroll: true });
            opened.current = true;
        } else if (opened.current) {
            opened.current = false;
            returnTo.current?.focus({ preventScroll: true });
        }
    }, [focus]);

    useEffect(() => {
        if (!focus) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') close();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [focus]);

    // On a phone the room takes the whole screen while a panel is open, so the page stops scrolling
    const fullScreen = compact && focus !== null;
    useLayoutEffect(() => {
        if (!fullScreen || !focus) return;
        const title = document.getElementById(`${focus}-panel-title`);
        if (roomRef.current && title) return containModalFocus(roomRef.current, title);
    }, [fullScreen, focus]);

    useEffect(() => {
        if (!fullScreen) return;
        const scrollY = window.scrollY;
        const width = window.innerWidth;
        const height = window.innerHeight;
        const overflow = document.documentElement.style.overflow;
        document.documentElement.style.overflow = 'hidden';
        return () => {
            document.documentElement.style.overflow = overflow;
            window.scrollTo(0, scrollY);
            if (window.innerWidth === width && window.innerHeight === height) return;
            // Rotation reflows the page; the old offset may put the opener outside the viewport.
            const opener = returnTo.current;
            const room = roomRef.current;
            const target = opener && !opener.matches(':disabled') && opener.getClientRects().length ? opener : room;
            if (!target) return;
            let rect: { top: number; bottom: number } = target.getBoundingClientRect();
            const object = INTERESTS.find(({ buttonLabel }) => opener?.getAttribute('aria-label') === buttonLabel);
            if (object && target === opener && room) {
                // The camera is still returning; scroll for the object's final resting position.
                const viewport = { width: room.clientWidth, height: room.clientHeight };
                const hit = screenRect(HIT_BOXES[object.id], restFrame(viewport), viewport);
                const top = room.getBoundingClientRect().top + hit.y * viewport.height;
                rect = { top, bottom: top + hit.h * viewport.height };
            }
            const headerBottom = document.getElementById('main-header')?.getBoundingClientRect().bottom ?? 0;
            if (rect.top < Math.max(0, headerBottom) || rect.bottom > window.innerHeight) {
                window.scrollBy({ top: (rect.top + rect.bottom - window.innerHeight) / 2, behavior: 'instant' });
            }
        };
    }, [fullScreen]);

    // Swipe down from the sheet's grabber or header
    const onSheetDown = (e: React.PointerEvent<HTMLDivElement>) => {
        const header = e.currentTarget.querySelector('header');
        if (!header || e.clientY > header.getBoundingClientRect().bottom) return;
        e.preventDefault();
        drag.current = { y: e.clientY, time: performance.now() };
        setPhase('dragging');
        e.currentTarget.setPointerCapture(e.pointerId);
    };
    const onSheetMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (drag.current) setDragY(Math.max(0, e.clientY - drag.current.y));
    };
    const onSheetUp = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!drag.current) return;
        const dy = e.clientY - drag.current.y;
        const speed = dy / Math.max(1, performance.now() - drag.current.time);
        drag.current = null;
        if (dy >= SWIPE_CLOSE_PX || speed > SWIPE_FLICK) close();
        else {
            setDragY(0);
            setPhase('open');
        }
    };

    const panel = (id: InterestId) => {
        switch (id) {
            case 'music':
                return <MusicPanel compact={compact} data={music} onRetry={retryMusic} />;
            case 'games':
                return <GamesPanel compact={compact} data={games} onRetry={retryGames} />;
            case 'food':
                return <FoodPanel compact={compact} />;
            case 'cats':
                return <CatsPanel compact={compact} />;
        }
    };

    return (
        <div ref={wrapRef} className="mt-8 font-normal">
            <h1 className="p-2 text-3xl sm:p-4 sm:text-4xl lg:text-5xl">Interests</h1>

            <div className={`relative mx-auto w-full max-w-[1000px] ${compact ? 'aspect-[4/5]' : 'aspect-[25/17]'}`}>
                <div
                    ref={roomRef}
                    tabIndex={-1}
                    role={fullScreen ? 'dialog' : undefined}
                    aria-modal={fullScreen ? true : undefined}
                    aria-labelledby={fullScreen ? `${focus}-panel-title` : undefined}
                    className={
                        fullScreen
                            ? 'fixed inset-0 z-[60] h-[100dvh] overflow-hidden bg-[#111827]'
                            : 'absolute inset-0 overflow-hidden rounded-2xl bg-[#111827]'
                    }
                >
                    <RoomStage transitionFrom={transitionRect.current} focus={focus} sheet={compact} onPick={open} reducedMotion={reducedMotion} />

                    {focus && (
                        <button
                            type="button"
                            onClick={close}
                            className={`absolute top-4 left-4 z-10 flex cursor-pointer items-center gap-1.5 rounded-lg border border-white/30 bg-[rgba(17,24,39,0.72)] px-3 text-sm font-medium text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7bb3d1] ${
                                compact ? 'h-11' : 'h-9'
                            }`}
                        >
                            <span aria-hidden="true">←</span> Room
                        </button>
                    )}

                    {focus && (
                        <div
                            onPointerDown={compact ? onSheetDown : undefined}
                            onPointerMove={compact ? onSheetMove : undefined}
                            onPointerUp={compact ? onSheetUp : undefined}
                            onPointerCancel={compact ? onSheetUp : undefined}
                            // Once in, later moves (snapping back after a drag) don't wait for a swoop
                            onTransitionEnd={(e) => e.target === e.currentTarget && phase === 'entering' && setPhase('open')}
                            className={
                                compact
                                    ? 'absolute inset-x-0 bottom-0 z-10 h-[60%] [&_header]:touch-none [&_header]:select-none [&>aside>div:first-child]:touch-none'
                                    : 'absolute top-3 right-3 bottom-3 z-10 w-[min(448px,46%)]'
                            }
                            style={panelStyle(phase, { compact, reducedMotion, dragY })}
                        >
                            {panel(focus)}
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
}
