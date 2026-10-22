'use client';

import { useEffect, useRef, useState } from 'react';
import { LA, LA_TARGET_X, MAP_W, finalStripOffset, lonLatToMap, spinStartOffset } from './intro/globeMath';
import { CONTINENTS_PATH } from './intro/continents';
import { INTRO_STARTED_FLAG } from './intro/introGate';

const LA_Y = lonLatToMap(LA.lon, LA.lat).y;
const FINAL_OFFSET = finalStripOffset(LA.lon, LA_TARGET_X);
const START_OFFSET = spinStartOffset(FINAL_OFFSET);

export default function IntroGlobe() {
    const [done, setDone] = useState(false);
    const overlayRef = useRef<HTMLDivElement>(null);
    const globeRef = useRef<HTMLDivElement>(null);
    const stripRef = useRef<SVGGElement>(null);
    const pinRef = useRef<SVGCircleElement>(null);
    const animationsRef = useRef<Animation[]>([]);

    useEffect(() => {
        const root = document.documentElement;
        const overlay = overlayRef.current;
        const globe = globeRef.current;
        const strip = stripRef.current;
        const pin = pinRef.current;
        if (root.dataset.intro !== 'play' || !overlay || !globe || !strip || !pin) {
            setDone(true);
            return;
        }
        (window as unknown as Record<string, boolean>)[INTRO_STARTED_FLAG] = true;

        const forwards = { fill: 'forwards' as const };
        const animations = [
            strip.animate(
                [{ transform: `translateX(${START_OFFSET}px)` }, { transform: `translateX(${FINAL_OFFSET}px)` }],
                { ...forwards, duration: 1800, easing: 'cubic-bezier(.2,.7,.2,1)' },
            ),
            pin.animate([{ opacity: 0 }, { opacity: 1, offset: 0.4 }, { opacity: 1, offset: 0.6 }, { opacity: 0 }], {
                ...forwards,
                delay: 1600,
                duration: 500,
            }),
            globe.animate([{ transform: 'scale(1)' }, { transform: 'scale(14)' }], {
                ...forwards,
                delay: 1800,
                duration: 1000,
                easing: 'ease-in',
            }),
            overlay.animate([{ opacity: 1 }, { opacity: 0 }], { ...forwards, delay: 2300, duration: 700 }),
        ];
        animationsRef.current = animations;

        let cancelled = false;
        Promise.all(animations.map((a) => a.finished))
            .then(() => {
                if (cancelled) return;
                delete root.dataset.intro;
                setDone(true);
            })
            .catch(() => {});

        const skip = () => animations.forEach((a) => a.finish());
        window.addEventListener('keydown', skip);

        return () => {
            cancelled = true;
            window.removeEventListener('keydown', skip);
            animations.forEach((a) => a.cancel());
        };
    }, []);

    if (done) return null;

    return (
        <div
            ref={overlayRef}
            aria-hidden
            className="intro-overlay fixed inset-0 z-[100] items-center justify-center bg-gray-900 cursor-pointer"
            onClick={() => animationsRef.current.forEach((a) => a.finish())}
        >
            <div
                ref={globeRef}
                className="intro-globe"
                style={{
                    width: 'min(60vw, 60vh)',
                    height: 'min(60vw, 60vh)',
                    transformOrigin: `${LA_TARGET_X}% ${LA_Y}%`,
                }}
            >
                <svg viewBox="0 0 100 100" width="100%" height="100%">
                    <defs>
                        <clipPath id="intro-globe-clip">
                            <circle cx="50" cy="50" r="50" />
                        </clipPath>
                    </defs>
                    <circle cx="50" cy="50" r="50" fill="#61A2EF" />
                    <g clipPath="url(#intro-globe-clip)">
                        <g ref={stripRef} style={{ transform: `translateX(${START_OFFSET}px)` }}>
                            {[0, MAP_W, MAP_W * 2].map((x) => (
                                <path
                                    key={x}
                                    d={CONTINENTS_PATH}
                                    transform={`translate(${x} 0)`}
                                    fill="#9ED04D"
                                    stroke="#9ED04D"
                                    strokeWidth="1.2"
                                    strokeLinejoin="round"
                                />
                            ))}
                        </g>
                    </g>
                    <path d="M50 0 A50 50 0 0 1 50 100 Z" fill="black" opacity="0.15" />
                    <circle
                        ref={pinRef}
                        cx={LA_TARGET_X}
                        cy={LA_Y}
                        r="1.6"
                        fill="#2d4a57"
                        stroke="white"
                        strokeWidth="0.6"
                        opacity="0"
                    />
                </svg>
            </div>
        </div>
    );
}
