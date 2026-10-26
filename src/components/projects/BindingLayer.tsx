'use client';

import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import type { BindingScene } from './bindingScene';
import { pageTexture } from './pageTexture';

export type BindingHandle = {
    capture: (page: number, element: HTMLElement) => void;
    play: (pages: number[], elements: HTMLElement[], direction: 1 | -1, done: () => void) => boolean;
    cancel: () => void;
};

export default forwardRef<BindingHandle, { compact: boolean; onReady: (ready: boolean) => void }>(function BindingLayer({ compact, onReady }, ref) {
    const hostRef = useRef<HTMLDivElement>(null);
    const scene = useRef<BindingScene | null>(null);
    const captured = useRef<{ page: number; canvas: HTMLCanvasElement } | null>(null);
    const ready = useRef(onReady);
    ready.current = onReady;

    useImperativeHandle(ref, () => ({
        capture(page, element) {
            if (!scene.current) return;
            captured.current = { page, canvas: pageTexture(element) };
        },
        play(pages, elements, direction, done) {
            if (!scene.current) return false;
            try {
                const textures = pages.map((page, i) => captured.current?.page === page ? captured.current.canvas : pageTexture(elements[i]));
                scene.current.play(textures, direction, done);
                return true;
            } catch {
                scene.current.cancel();
                return false;
            }
        },
        cancel() { scene.current?.cancel(); },
    }), []);

    useEffect(() => {
        const host = hostRef.current!;
        let disposed = false;
        let stop: (() => void) | undefined;
        let dimensions = '';
        let generation = 0;
        const observer = new ResizeObserver(async ([entry]) => {
            // The notebook's presentation angle must not change the canvas's local dimensions.
            const { width, height } = entry.contentRect;
            if (!width || !height) return;
            const next = `${width.toFixed(1)}:${height.toFixed(1)}`;
            if (next === dimensions) return;
            dimensions = next;
            const current = ++generation;
            stop?.(); stop = undefined;
            scene.current?.dispose(); scene.current = null;
            captured.current = null;
            ready.current(false);
            try {
                const { BindingScene, bindingMask } = await import('./bindingScene');
                if (disposed || current !== generation) return;
                scene.current = new BindingScene(host, { width, height, compact });
                const panel = host.closest('[data-notepad]')?.querySelector<HTMLElement>('#project-panel');
                const mask = bindingMask(width, height, compact);
                if (panel) panel.style.maskImage = mask;
                const lost = (event: Event) => { event.preventDefault(); scene.current?.cancel(); if (panel) panel.style.maskImage = ''; ready.current(false); };
                host.querySelector('canvas')?.addEventListener('webglcontextlost', lost);
                stop = () => { if (panel) panel.style.maskImage = ''; host.querySelector('canvas')?.removeEventListener('webglcontextlost', lost); };
                ready.current(true);
            } catch { ready.current(false); }
        });
        observer.observe(host);
        return () => { disposed = true; observer.disconnect(); stop?.(); scene.current?.dispose(); scene.current = null; captured.current = null; };
    }, [compact]);

    return <div ref={hostRef} aria-hidden="true" className="pointer-events-none absolute inset-0 z-[60]" data-binding-layer="" />;
});
