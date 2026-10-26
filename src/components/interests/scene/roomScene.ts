import * as THREE from 'three';
import {
    CAMERA_RIGHT,
    CAMERA_UP,
    INTEREST_IDS,
    ISO_DIRECTION,
    SWOOP_MS,
    VIEW_HEIGHT,
    easeSwoop,
    easeReturn,
    focusFrame,
    glowAt,
    lerpFrame,
    restFrame,
    reframeViewport,
    type ViewportBounds,
    type CameraFrame,
    type InterestId,
    type Viewport,
} from '../roomLayout';
import { STEAM_HOVER_MS, STEAM_MS, STEAM_OFFSETS, catIdleAt, flickerAt, steamAt, tailFlickAt, twitchAt } from '../motion';
import { buildRoomModel } from './roomModel';
import { createWeatherTransition } from '../weatherTransition';
import { timeOfDay, type WindowState } from '../weather';

export type RoomScene = {
    setWeather: (state: WindowState, visible: boolean) => void;
    setFocus: (id: InterestId | null, fromBounds?: ViewportBounds, returnBounds?: ViewportBounds) => Promise<void>; // resolves when the camera arrives
    setHover: (id: InterestId | null) => void;
    setPointer: (nx: number, ny: number) => void; // -1..1 within the stage, for parallax
    setActive: (active: boolean) => void; // false stops the rAF loop
    setSheet: (sheet: boolean) => void; // whether the open panel is the bottom sheet, for framing
    onFrame: (cb: (frame: CameraFrame, vp: Viewport) => void) => () => void; // per rendered frame, parallax included; returns unsubscribe
    dispose: () => void;
};

const CAMERA_DISTANCE = 30;
const PARALLAX = 0.15;
const PARALLAX_LERP = 0.06;
const HOVER_FADE_MS = 200;
const HOVER_GLOW = { opacity: 0.5, ring: 0.9 };
// Smooths the tail between its idle sway and the hover flick
const TAIL_SETTLE_MS = 80;
const RECORD_REV_MS = 1800;
// SVG units per world unit across the screen (see catCutout)
const SVG_PER_UNIT = 48.99;
const DEG = Math.PI / 180;

// Aims an orthographic camera exactly as roomLayout's projectToScreen assumes
function applyFrame(camera: THREE.OrthographicCamera, frame: CameraFrame, vp: Viewport) {
    const halfH = VIEW_HEIGHT / (2 * frame.zoom);
    const halfW = (halfH * vp.width) / vp.height;
    camera.left = -halfW;
    camera.right = halfW;
    camera.top = halfH;
    camera.bottom = -halfH;
    const [x, y, z] = frame.target;
    camera.position.set(x + ISO_DIRECTION[0] * CAMERA_DISTANCE, y + ISO_DIRECTION[1] * CAMERA_DISTANCE, z + ISO_DIRECTION[2] * CAMERA_DISTANCE);
    camera.up.set(0, 1, 0);
    camera.lookAt(x, y, z);
    camera.updateProjectionMatrix();
}

// Throws if WebGL is unavailable.
export function createRoomScene(canvas: HTMLCanvasElement, opts: { reducedMotion: boolean; weather?: WindowState; hideGlows?: boolean }): RoomScene {
    const { reducedMotion } = opts;
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, stencil: true });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.shadowMap.enabled = false;

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100);
    const model = buildRoomModel(reducedMotion);
    scene.add(model.root);
    const weather = createWeatherTransition(opts.weather ?? { weather: 'rainy', time: timeOfDay(new Date()) });
    const { vinyl, screen, tail, ear, breath, steam } = model.parts;
    const screenMaterial = screen.material as THREE.MeshBasicMaterial;
    const steamBases = steam.map((wisp) => wisp.position.clone());
    const up = new THREE.Vector3(...CAMERA_UP);

    const finePointer = window.matchMedia('(pointer: fine)').matches;
    const vp = (): Viewport => ({ width: canvas.clientWidth || 1, height: canvas.clientHeight || 1 });
    let returnBounds: ViewportBounds | undefined;
    const goal = (v: Viewport) => focus ? focusFrame(focus, v, sheet)
        : returnBounds ? reframeViewport(restFrame(returnBounds), returnBounds, canvas.getBoundingClientRect()) : restFrame(v);

    let focus: InterestId | null = null;
    let sheet = false;
    let hover: InterestId | null = null;
    let tween: { from: CameraFrame; start: number; resolve: () => void } | null = null;
    let lastFrame: CameraFrame | null = null;
    let rendererSize: Viewport | null = null;
    const pointer = { x: 0, y: 0 };
    const parallax = { x: 0, y: 0 };

    // Per-object animation state
    const hoverAmount = Object.fromEntries(INTEREST_IDS.map((id) => [id, 0])) as Record<InterestId, number>;
    const activeSince = Object.fromEntries(INTEREST_IDS.map((id) => [id, -1])) as Record<InterestId, number>;
    const isActive = (id: InterestId) => hover === id || focus === id;
    let tailAngle = 0;
    let steamClock = 0;
    let last = performance.now();

    const subscribers = new Set<(frame: CameraFrame, vp: Viewport) => void>();

    const cameraFrame = (now: number, v: Viewport): CameraFrame => {
        if (!tween) return goal(v);
        const t = Math.min(1, (now - tween.start) / SWOOP_MS);
        const frame = lerpFrame(tween.from, goal(v), focus ? easeSwoop(t) : easeReturn(t));
        if (t >= 1) {
            tween.resolve();
            tween = null;
        }
        return frame;
    };

    const animate = (now: number, dt: number) => {
        for (const id of INTEREST_IDS) {
            if (isActive(id) && activeSince[id] < 0) activeSince[id] = now;
            if (!isActive(id)) activeSince[id] = -1;
        }
        const since = (id: InterestId) => now - activeSince[id];
        const moving = !reducedMotion;

        // Keep a visible outline at rest for touch discovery; hover strengthens it.
        for (const id of INTEREST_IDS) {
            const target = hover === id && !focus ? 1 : 0;
            const step = dt / HOVER_FADE_MS;
            hoverAmount[id] = reducedMotion ? target : target > hoverAmount[id] ? Math.min(target, hoverAmount[id] + step) : Math.max(target, hoverAmount[id] - step);
            const h = hoverAmount[id];
            const base = glowAt(now, id, reducedMotion, h);
            const glow = model.glows[id];
            const ring = model.rings[id];
            glow.visible = ring.visible = !focus && !opts.hideGlows;
            (glow.material as THREE.MeshBasicMaterial).opacity = base.opacity + (HOVER_GLOW.opacity - base.opacity) * h;
            glow.scale.setScalar(base.scale);
            (ring.material as THREE.MeshBasicMaterial).opacity = (0.25 + base.opacity * 1.1) * (1 - h) + HOVER_GLOW.ring * h;
            ring.scale.setScalar(base.scale);
        }

        if (moving && isActive('music')) vinyl.rotation.y -= (dt / RECORD_REV_MS) * 2 * Math.PI;
        screenMaterial.opacity = moving && isActive('games') ? flickerAt(since('games')) : 1;

        const idle = catIdleAt(now, reducedMotion);
        const tailGoal = moving && isActive('cats') ? tailFlickAt(since('cats')) : idle.tail;
        tailAngle += (tailGoal - tailAngle) * Math.min(1, dt / TAIL_SETTLE_MS);
        tail.rotation.z = tailAngle * DEG;
        ear.rotation.z = (moving && isActive('cats') ? twitchAt(since('cats')) : 0) * DEG;
        breath.scale.y = idle.breath;

        if (moving) steamClock += dt * (isActive('food') ? STEAM_MS / STEAM_HOVER_MS : 1);
        steam.forEach((wisp, i) => {
            const { opacity, rise } = moving ? steamAt(steamClock + STEAM_OFFSETS[i] * STEAM_MS) : { opacity: 0.5, rise: 0 };
            (wisp.material as THREE.MeshBasicMaterial).opacity = opacity;
            wisp.position.copy(steamBases[i]).addScaledVector(up, rise / SVG_PER_UNIT);
        });

        const weatherFrame = weather.frame(now);
        model.windowView.update(now, weatherFrame);
        model.windowLight.update(weatherFrame);
    };

    const render = (now: number) => {
        const dt = Math.min(100, Math.max(0, now - last));
        last = now;
        const v = vp();
        if (!rendererSize || rendererSize.width !== v.width || rendererSize.height !== v.height) {
            renderer.setSize(v.width, v.height, false);
            rendererSize = v;
        }

        // Parallax pans the target only; the view direction never changes (the cat and lift()ed parts rely on it)
        const allowParallax = finePointer && !reducedMotion && !focus && !tween;
        parallax.x += ((allowParallax ? pointer.x : 0) - parallax.x) * PARALLAX_LERP;
        parallax.y += ((allowParallax ? pointer.y : 0) - parallax.y) * PARALLAX_LERP;
        const frame = cameraFrame(now, v);
        lastFrame = frame;
        const [tx, ty, tz] = frame.target;
        const px = parallax.x * PARALLAX;
        const py = -parallax.y * PARALLAX;
        const shifted: CameraFrame = {
            target: [tx + CAMERA_RIGHT[0] * px + CAMERA_UP[0] * py, ty + CAMERA_RIGHT[1] * px + CAMERA_UP[1] * py, tz + CAMERA_RIGHT[2] * px + CAMERA_UP[2] * py],
            zoom: frame.zoom,
        };
        applyFrame(camera, shifted, v);

        animate(now, dt);
        renderer.render(scene, camera);
        subscribers.forEach((cb) => cb(shifted, v));
    };

    let raf = 0;
    let wanted = true;
    const tick = (now: number) => {
        render(now);
        raf = requestAnimationFrame(tick);
    };
    const start = () => {
        if (raf || !wanted || document.visibilityState === 'hidden') return;
        last = performance.now();
        raf = requestAnimationFrame(tick);
    };
    const stop = () => {
        cancelAnimationFrame(raf);
        raf = 0;
    };
    const onVisibility = () => {
        if (document.visibilityState === 'hidden') {
            weather.finish();
            stop();
        } else start();
    };
    document.addEventListener('visibilitychange', onVisibility);

    // Resizes take effect on the next frame: the frame is worked out from the viewport every time
    const resizeObserver = new ResizeObserver(() => {
        if (!raf) render(performance.now());
    });
    if (canvas.parentElement) resizeObserver.observe(canvas.parentElement);

    start();

    return {
        setWeather: (state, visible) => {
            weather.set(state, performance.now(), reducedMotion, visible && document.visibilityState !== 'hidden');
        },
        setFocus: (id, fromBounds, destinationBounds) => {
            tween?.resolve();
            tween = null;
            const previous = lastFrame ?? goal(vp());
            const from = fromBounds && lastFrame
                ? reframeViewport(previous, fromBounds, canvas.getBoundingClientRect())
                : previous;
            focus = id;
            returnBounds = destinationBounds;
            if (reducedMotion) {
                render(performance.now());
                return Promise.resolve();
            }
            return new Promise<void>((resolve) => {
                const now = performance.now();
                tween = { from, start: now, resolve };
                // Resize and draw before paint, avoiding a stretched stale canvas for one frame.
                render(now);
            });
        },
        setHover: (id) => {
            hover = id;
        },
        setPointer: (nx, ny) => {
            pointer.x = Math.max(-1, Math.min(1, nx));
            pointer.y = Math.max(-1, Math.min(1, ny));
        },
        setSheet: (value) => {
            sheet = value;
        },
        setActive: (active) => {
            wanted = active;
            if (active) start();
            else stop();
        },
        onFrame: (cb) => {
            subscribers.add(cb);
            return () => subscribers.delete(cb);
        },
        dispose: () => {
            stop();
            tween?.resolve();
            tween = null;
            subscribers.clear();
            resizeObserver.disconnect();
            document.removeEventListener('visibilitychange', onVisibility);
            model.dispose();
            renderer.dispose();
        },
    };
}
