'use client';

import React, { useEffect, useRef, useState } from 'react';
import { INTERESTS } from './interestsData';
import { HIT_BOXES, restFrame, screenRect, type CameraFrame, type InterestId, type Viewport } from './roomLayout';
import type { RoomScene } from './scene/roomScene';
import { focusShowsLabel, visibilityGate } from './stageState';

// The room image (a capture of the rest view at 1000×680). It shows until the 3D scene draws its first
// frame, and stays as the fallback without WebGL.
const ROOM_IMAGE = '/assets/room.png';
const IMAGE_VP: Viewport = { width: 1000, height: 680 };

// Places the image so its room lines up with where the 3D rest view would draw it
function imageBox(vp: Viewport) {
    const scale = (vp.height * restFrame(vp).zoom) / (IMAGE_VP.height * restFrame(IMAGE_VP).zoom);
    return { width: IMAGE_VP.width * scale, height: IMAGE_VP.height * scale };
}

export default function RoomStage(props: {
    focus: InterestId | null;
    // The open panel is the phone's bottom sheet, so the object frames above it
    sheet: boolean;
    onPick: (id: InterestId, opener: HTMLButtonElement) => void;
    reducedMotion: boolean;
}) {
    const { focus, sheet, onPick, reducedMotion } = props;
    const rootRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const buttonRefs = useRef<Partial<Record<InterestId, HTMLButtonElement | null>>>({});
    const pillRef = useRef<HTMLDivElement>(null);
    const sceneRef = useRef<RoomScene | null>(null);
    const hoverRef = useRef<InterestId | null>(null);
    // Read when the scene starts, which is after the parent has checked the media query
    const reducedRef = useRef(reducedMotion);
    reducedRef.current = reducedMotion;
    // What the scene should show when it starts late (a tab clicked before it loaded)
    const wanted = useRef({ focus, sheet });
    wanted.current = { focus, sheet };
    const [hover, setHover] = useState<InterestId | null>(null);
    const [mode, setMode] = useState<'poster' | 'live' | 'fallback'>('poster');
    const [vp, setVp] = useState<Viewport>(IMAGE_VP);
    const placedFrame = useRef<{ frame: CameraFrame; viewport: Viewport } | null>(null);

    // Moves the overlay buttons and the pill on scene frames, resize, and hover changes.
    const place = useRef((frame: CameraFrame, v: Viewport) => {
        placedFrame.current = { frame, viewport: v };
        for (const { id } of INTERESTS) {
            const button = buttonRefs.current[id];
            if (!button) continue;
            const r = screenRect(HIT_BOXES[id], frame, v);
            button.style.left = `${r.x * 100}%`;
            button.style.top = `${r.y * 100}%`;
            button.style.width = `${r.w * 100}%`;
            button.style.height = `${r.h * 100}%`;
        }
        const pill = pillRef.current;
        const id = hoverRef.current;
        if (pill && id) {
            const r = screenRect(HIT_BOXES[id], frame, v);
            pill.style.left = `${(r.x + r.w / 2) * 100}%`;
            pill.style.top = `${r.y * 100}%`;
        }
    });

    // Stage size, for the image and for placing the buttons when there's no live scene
    useEffect(() => {
        const root = rootRef.current!;
        const measure = () => {
            const v = { width: root.clientWidth || 1, height: root.clientHeight || 1 };
            setVp(v);
            if (!sceneRef.current) place.current(restFrame(v), v);
        };
        measure();
        const observer = new ResizeObserver(measure);
        observer.observe(root);
        return () => observer.disconnect();
    }, []);

    // Starts three.js once the stage is within 200px of the viewport, and pauses it when it's away
    useEffect(() => {
        const root = rootRef.current!;
        let scene: RoomScene | null = null;
        let cancelled = false;
        let starting = false;
        let unsubscribe = () => {};
        const gate = visibilityGate();
        const start = async () => {
            starting = true;
            try {
                const { createRoomScene } = await import('./scene/roomScene');
                if (cancelled) return;
                scene = createRoomScene(canvasRef.current!, { reducedMotion: reducedRef.current });
                sceneRef.current = scene;
                scene.setSheet(wanted.current.sheet);
                if (wanted.current.focus) scene.setFocus(wanted.current.focus);
                gate.attach(scene);
                let first = true;
                unsubscribe = scene.onFrame((frame, v) => {
                    place.current(frame, v);
                    if (first) {
                        first = false;
                        setMode('live');
                    }
                });
            } catch {
                if (!cancelled) setMode('fallback');
            }
        };
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !starting) start();
                gate.setVisible(entry.isIntersecting);
            },
            { rootMargin: '200px' },
        );
        observer.observe(root);
        return () => {
            cancelled = true;
            observer.disconnect();
            gate.detach();
            unsubscribe();
            scene?.dispose();
            sceneRef.current = null;
        };
        // The scene is built once
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Before the focus effect, so a phone open frames for the sheet from the first frame
    useEffect(() => {
        sceneRef.current?.setSheet(sheet);
    }, [sheet]);

    useEffect(() => {
        sceneRef.current?.setFocus(focus);
        if (focus) {
            hoverRef.current = null;
            setHover(null);
            sceneRef.current?.setHover(null);
        }
    }, [focus]);

    const hoverOn = (id: InterestId | null) => {
        hoverRef.current = id;
        const placed = placedFrame.current;
        if (id && placed) place.current(placed.frame, placed.viewport);
        setHover(id);
        sceneRef.current?.setHover(id);
    };

    const image = imageBox(vp);
    const label = INTERESTS.find((i) => i.id === hover)?.label;

    return (
        <div
            ref={rootRef}
            className="absolute inset-0 overflow-hidden"
            onPointerMove={(e) => {
                if (e.pointerType !== 'mouse') return;
                const r = e.currentTarget.getBoundingClientRect();
                sceneRef.current?.setPointer(((e.clientX - r.left) / r.width) * 2 - 1, ((e.clientY - r.top) / r.height) * 2 - 1);
            }}
            onPointerLeave={() => sceneRef.current?.setPointer(0, 0)}
        >
            {mode !== 'live' && (
                <img
                    src={ROOM_IMAGE}
                    alt="An illustrated room at night with a record player, a computer, a bowl of food on a small table, and an orange cat on a green rug, beside a rainy window"
                    className="pointer-events-none absolute top-1/2 left-1/2 max-w-none -translate-x-1/2 -translate-y-1/2 select-none"
                    style={{ width: image.width, height: image.height }}
                    draggable={false}
                />
            )}
            {mode !== 'fallback' && (
                <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 block h-full w-full touch-pan-y" />
            )}

            {INTERESTS.map(({ id, buttonLabel }) => (
                <button
                    key={id}
                    ref={(el) => {
                        buttonRefs.current[id] = el;
                    }}
                    type="button"
                    aria-label={buttonLabel}
                    disabled={focus !== null}
                    onClick={(e) => onPick(id, e.currentTarget)}
                    onMouseEnter={() => hoverOn(id)}
                    onMouseLeave={() => hoverOn(null)}
                    onFocus={(e) => focusShowsLabel(e.currentTarget) && hoverOn(id)}
                    onBlur={() => hoverOn(null)}
                    className={`absolute cursor-pointer rounded-lg bg-transparent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7bb3d1] ${
                        focus !== null ? 'invisible' : ''
                    }`}
                />
            ))}

            <div
                ref={pillRef}
                aria-hidden="true"
                className={`pointer-events-none absolute -translate-x-1/2 -translate-y-[calc(100%+8px)] rounded-full border border-[#7bb3d1]/60 bg-[#17232c] px-3 py-1 text-xs leading-4 font-medium whitespace-nowrap text-white transition-opacity duration-150 ${
                    label && !focus ? 'opacity-100' : 'opacity-0'
                }`}
            >
                {label}
            </div>
        </div>
    );
}
