'use client';

import { useEffect, useRef, useState } from 'react';
import { INTRO_STARTED_FLAG } from './intro/introGate';
import type { GlobeIntro } from './intro/globeScene';

export default function IntroGlobe() {
    const [done, setDone] = useState(false);
    const overlayRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const cloudCanvasRef = useRef<HTMLCanvasElement>(null);
    const introRef = useRef<GlobeIntro | null>(null);
    const skipRef = useRef<() => void>(() => {});

    useEffect(() => {
        const root = document.documentElement;
        const overlay = overlayRef.current;
        const canvas = canvasRef.current;
        const cloudCanvas = cloudCanvasRef.current;
        if (root.dataset.intro !== 'play' || !overlay || !canvas || !cloudCanvas) {
            setDone(true);
            return;
        }

        let cancelled = false;
        const end = () => {
            if (cancelled) return;
            introRef.current?.dispose();
            introRef.current = null;
            delete root.dataset.intro;
            setDone(true);
        };
        const skip = () => (introRef.current ? introRef.current.finish() : end());
        skipRef.current = skip;
        window.addEventListener('keydown', skip);

        import('./intro/globeScene')
            .then(({ createGlobeIntro }) => {
                // The <head> gate drops the intro if three.js took too long to arrive.
                if (cancelled || root.dataset.intro !== 'play') return end();
                const intro = createGlobeIntro(canvas, cloudCanvas, overlay);
                introRef.current = intro;
                (window as unknown as Record<string, boolean>)[INTRO_STARTED_FLAG] = true;
                return intro.start().then(end);
            })
            .catch(end); // no WebGL or the chunk failed to load: just show the site

        return () => {
            cancelled = true;
            window.removeEventListener('keydown', skip);
            introRef.current?.dispose();
            introRef.current = null;
        };
    }, []);

    if (done) return null;

    return (
        <div
            ref={overlayRef}
            aria-hidden
            className="intro-overlay fixed inset-0 z-[100] bg-gray-900 cursor-pointer"
            onClick={() => skipRef.current()}
        >
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" style={{ opacity: 0 }} />
            <canvas ref={cloudCanvasRef} className="absolute inset-0 w-full h-full" />
        </div>
    );
}
