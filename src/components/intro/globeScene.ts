// three.js scene for the intro. Loaded with a dynamic import so three.js only downloads when the intro plays.
import * as THREE from 'three';
import { createCloudLayer } from './clouds';
import { CONTINENTS_PATH } from './continents';
import { LA, SPIN, ZOOM, cameraDistance, deepZoomFov, facingRotation, latLonToVector, timeline } from './globeMath';
import { SOCAL_DETAIL_PATH } from './socalDetail';

const FOV = 35;
const GLOBE_FRACTION = 0.6; // of the viewport's shorter side
const START_TILT = 0.41;
const T = timeline(SPIN, ZOOM);
const RIPPLE_MS = 1100;
// Coastline outline thickness in degrees, shared by the globe and the sharp patch so they match exactly.
const COAST_DEG = 0.5;
// Sharper map over Southern California for the end of the dive, in degrees and texture pixels.
const PATCH = { lonMin: -132, lonMax: -104, latMin: 22, latMax: 46, w: 3072, h: 2632 };
const DEG = Math.PI / 180;
const OCEAN = '#61A2EF';
const LAND = '#9ED04D';

const clamp = (v: number) => Math.min(1, Math.max(0, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

const la = latLonToVector(LA.lat, LA.lon);
const FINAL = facingRotation(la);
const START_Y = FINAL.y - Math.PI * 2 * SPIN.turns;

function globeTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    const g = canvas.getContext('2d')!;
    g.scale(canvas.width / 200, canvas.height / 100);
    const land = new Path2D(CONTINENTS_PATH);
    g.fillStyle = OCEAN;
    g.fillRect(0, 0, 200, 100);
    g.fillStyle = g.strokeStyle = LAND;
    g.lineWidth = COAST_DEG / 1.8; // map units are 1.8 degrees
    g.lineJoin = 'round';
    g.fill(land);
    g.stroke(land);
    // Also paint the patch's finer coastline, so the globe and the patch agree where they overlap.
    g.scale(1 / 1.8, 1 / 1.8);
    g.lineWidth = COAST_DEG;
    const detail = new Path2D(SOCAL_DETAIL_PATH);
    g.fill(detail);
    g.stroke(detail);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    return tex;
}

// The same map at much higher resolution, for just the area the dive ends in.
function patchTexture(maxSize: number): THREE.CanvasTexture {
    const scale = Math.min(1, maxSize / Math.max(PATCH.w, PATCH.h));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(PATCH.w * scale);
    canvas.height = Math.round(PATCH.h * scale);
    const g = canvas.getContext('2d')!;
    g.fillStyle = OCEAN;
    g.fillRect(0, 0, canvas.width, canvas.height);
    const sx = canvas.width / (PATCH.lonMax - PATCH.lonMin);
    const sy = canvas.height / (PATCH.latMax - PATCH.latMin);
    g.setTransform(sx, 0, 0, sy, -(PATCH.lonMin + 180) * sx, -(90 - PATCH.latMax) * sy);
    const detail = new Path2D(SOCAL_DETAIL_PATH);
    g.fillStyle = g.strokeStyle = LAND;
    g.lineWidth = COAST_DEG;
    g.lineJoin = 'round';
    g.fill(detail);
    g.stroke(detail);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    return tex;
}

export type GlobeIntro = {
    start: () => Promise<void>;
    finish: () => void;
    dispose: () => void;
};

// Plays spin → stop on LA → dive into the clouds, then opens a hole in them onto the page under `overlay`.
// Throws if WebGL is unavailable.
export function createGlobeIntro(canvas: HTMLCanvasElement, cloudCanvas: HTMLCanvasElement, overlay: HTMLElement): GlobeIntro {
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(FOV, 1, 0.01, 50);

    const outer = new THREE.Group();
    const inner = new THREE.Group();
    outer.add(inner);
    scene.add(outer);

    // Two-step toon shading gives the favicon's flat lit side and darker night side.
    // The dark step is in linear space; 174/255 lands near the favicon's #528ACF against #61A2EF.
    const steps = new THREE.DataTexture(new Uint8Array([174, 174, 174, 255, 255, 255, 255, 255]), 2, 1);
    steps.minFilter = steps.magFilter = THREE.NearestFilter;
    steps.needsUpdate = true;
    const globeTex = globeTexture();
    const globe = new THREE.Mesh(
        new THREE.SphereGeometry(1, 96, 64),
        new THREE.MeshToonMaterial({ map: globeTex, gradientMap: steps }),
    );
    inner.add(globe);

    // Shown the whole time, just above the globe, so nothing switches partway through the dive.
    const patchTex = patchTexture(renderer.capabilities.maxTextureSize);
    const patch = new THREE.Mesh(
        new THREE.SphereGeometry(
            1.0006,
            96,
            96,
            ((PATCH.lonMin + 180) / 360) * Math.PI * 2,
            (PATCH.lonMax - PATCH.lonMin) * DEG,
            (90 - PATCH.latMax) * DEG,
            (PATCH.latMax - PATCH.latMin) * DEG,
        ),
        new THREE.MeshToonMaterial({ map: patchTex, gradientMap: steps }),
    );
    inner.add(patch);

    const sun = new THREE.DirectionalLight(0xffffff, Math.PI);
    sun.position.set(-3, 1.2, 2.2);
    scene.add(sun);

    // LA marker: white dot with a dark edge, plus one ripple that spreads out and fades as the globe lands.
    const pin = new THREE.Group();
    const flat = (color: number) =>
        new THREE.MeshBasicMaterial({ color, transparent: true, side: THREE.DoubleSide, depthWrite: false });
    const dotMat = flat(0xffffff);
    const edgeMat = flat(0x2d4a57);
    const rippleMat = flat(0xffffff);
    const ripple = new THREE.Mesh(new THREE.RingGeometry(0.02, 0.025, 48), rippleMat);
    const edge = new THREE.Mesh(new THREE.CircleGeometry(0.02, 32), edgeMat);
    const dot = new THREE.Mesh(new THREE.CircleGeometry(0.014, 32), dotMat);
    ripple.position.z = 0.004;
    edge.position.z = 0.005;
    dot.position.z = 0.006;
    pin.add(ripple, edge, dot);
    const laVec = new THREE.Vector3(la.x, la.y, la.z);
    pin.position.copy(laVec);
    pin.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), laVec);
    inner.add(pin);

    const clouds = createCloudLayer(cloudCanvas, { cloudsFrom: T.cloudsFrom, cover: T.cover, revealMs: ZOOM.revealMs });

    const resize = () => {
        const w = window.innerWidth;
        const h = window.innerHeight;
        renderer.setSize(w, h, false);
        clouds.resize(w, h, Math.min(2, window.devicePixelRatio || 1));
        camera.aspect = w / h;
        camera.position.set(0, 0, cameraDistance(FOV, camera.aspect, GLOBE_FRACTION));
        camera.lookAt(0, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    let startTime = 0;
    let raf = 0;
    let skipped = false;
    let resolveDone: () => void = () => {};

    const render = (t: number) => {
        inner.rotation.y = lerp(START_Y, FINAL.y, easeOut(clamp(t / T.spin)));
        outer.rotation.x = lerp(START_TILT, FINAL.x, easeInOut(clamp((t - T.tiltFrom) / (T.spin - T.tiltFrom))));

        // The camera holds still and narrows its view, like a telephoto lens, at a steady pace.
        camera.fov = deepZoomFov(clamp((t - T.hold) / (T.zoom - T.hold)), FOV);
        camera.updateProjectionMatrix();

        const pinIn = clamp((t - (T.spin - 300)) / 300);
        const pinOut = 1 - clamp((t - T.hold) / 300);
        dotMat.opacity = edgeMat.opacity = pinIn * pinOut;
        const ripplePhase = clamp((t - (T.spin - 150)) / RIPPLE_MS);
        ripple.scale.setScalar(1 + 2.6 * easeOut(ripplePhase));
        rippleMat.opacity = ripplePhase > 0 && ripplePhase < 1 ? 0.85 * (1 - ripplePhase) * pinOut : 0;

        // Once the clouds cover the screen, drop the globe and the backdrop so the hole shows the page.
        const covered = clouds.draw(t);
        canvas.style.opacity = covered ? '0' : String(clamp(t / 300));
        overlay.style.backgroundColor = covered ? 'transparent' : '';

        if (!covered) renderer.render(scene, camera);
    };

    const tick = (now: number) => {
        const t = skipped ? T.end : now - startTime;
        render(t);
        if (t >= T.end) {
            resolveDone();
            return;
        }
        raf = requestAnimationFrame(tick);
    };

    return {
        start: () =>
            new Promise<void>((resolve) => {
                resolveDone = resolve;
                startTime = performance.now();
                raf = requestAnimationFrame(tick);
            }),
        finish: () => {
            skipped = true;
        },
        dispose: () => {
            cancelAnimationFrame(raf);
            window.removeEventListener('resize', resize);
            scene.traverse((obj) => {
                if (obj instanceof THREE.Mesh) {
                    obj.geometry.dispose();
                    (obj.material as THREE.Material).dispose();
                }
            });
            globeTex.dispose();
            patchTex.dispose();
            steps.dispose();
            renderer.dispose();
        },
    };
}
