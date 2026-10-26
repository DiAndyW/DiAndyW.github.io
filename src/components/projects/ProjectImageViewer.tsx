'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import type { Project } from './projectsData';
import { imageAfterSwipe, stepImage } from './projectImages';

export default function ProjectImageViewer({ project, initialIndex, onClose }: {
    project: Project;
    initialIndex: number;
    onClose: () => void;
}) {
    const [index, setIndex] = useState(initialIndex);
    const dialogRef = useRef<HTMLDialogElement>(null);
    const touch = useRef<{ x: number; y: number } | null>(null);
    const images = project.images!;
    const image = images[index];

    useEffect(() => {
        const dialog = dialogRef.current!;
        const trigger = document.activeElement as HTMLElement | null;
        const overflow = document.body.style.overflow;
        dialog.showModal();
        document.body.style.overflow = 'hidden';
        return () => {
            dialog.close();
            document.body.style.overflow = overflow;
            if (trigger?.isConnected) trigger.focus({ preventScroll: true });
        };
    }, []);

    const move = (direction: number) => setIndex((at) => stepImage(at, direction, images.length));

    return createPortal(
        <dialog
            ref={dialogRef}
            aria-label={`${project.title} screenshots`}
            onCancel={(event) => { event.preventDefault(); onClose(); }}
            onClick={(event) => {
                event.stopPropagation();
                if (event.target === event.currentTarget) onClose();
            }}
            onPointerDown={(event) => event.stopPropagation()}
            onPointerMove={(event) => event.stopPropagation()}
            onPointerUp={(event) => event.stopPropagation()}
            onKeyDown={(event) => {
                event.stopPropagation();
                if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
                    event.preventDefault();
                    move(event.key === 'ArrowLeft' ? -1 : 1);
                }
            }}
            className="fixed inset-0 m-0 h-dvh max-h-none w-screen max-w-none border-0 bg-transparent p-0 text-white outline-none backdrop:bg-[#111827]/90"
        >
            <button type="button" autoFocus aria-label="Close image viewer" onClick={onClose}
                className="absolute right-3 top-3 z-10 grid size-11 cursor-pointer place-items-center rounded-full bg-[#111827]/70 text-2xl text-gray-200 hover:text-[#7bb3d1] focus-visible:outline-2 focus-visible:outline-[#7bb3d1]">×</button>
            <div className="pointer-events-none flex h-full items-center justify-center px-12 py-16 sm:px-20">
                <div
                    className="pointer-events-auto touch-pan-y touch-pinch-zoom"
                    onTouchStart={(event) => {
                        touch.current = event.touches.length === 1 ? { x: event.touches[0].clientX, y: event.touches[0].clientY } : null;
                    }}
                    onTouchEnd={(event) => {
                        const start = touch.current;
                        if (start) {
                            const end = event.changedTouches[0];
                            setIndex((at) => imageAfterSwipe(at, images.length, end.clientX - start.x, end.clientY - start.y));
                        }
                        touch.current = null;
                    }}
                    onTouchCancel={() => { touch.current = null; }}
                >
                    <Image unoptimized loading="eager" src={image.src} alt={image.alt} width={image.width} height={image.height} sizes="100vw" className="block h-auto max-h-[calc(100dvh-128px)] w-auto max-w-[calc(100vw-96px)] object-contain sm:max-w-[calc(100vw-160px)]" />
                </div>
            </div>
            {images.length > 1 && (
                <>
                    <button type="button" aria-label="Previous image" disabled={index === 0} onClick={() => move(-1)}
                        className="absolute left-1 top-1/2 grid size-11 -translate-y-1/2 cursor-pointer place-items-center rounded-full bg-[#111827]/70 text-2xl disabled:opacity-30 sm:left-4 focus-visible:outline-2 focus-visible:outline-[#7bb3d1]">‹</button>
                    <button type="button" aria-label="Next image" disabled={index === images.length - 1} onClick={() => move(1)}
                        className="absolute right-1 top-1/2 grid size-11 -translate-y-1/2 cursor-pointer place-items-center rounded-full bg-[#111827]/70 text-2xl disabled:opacity-30 sm:right-4 focus-visible:outline-2 focus-visible:outline-[#7bb3d1]">›</button>
                </>
            )}
        </dialog>,
        document.body,
    );
}
