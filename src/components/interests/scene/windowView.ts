import * as THREE from 'three';
import { exteriorFor, EXTERIOR_PATHS, REFLECT_PATHS, STARS } from './windowWeatherPalette';
import { WINDOW_GLASS } from './roomSurfaces';
import type { WeatherFrame } from '../weatherTransition';

export type WindowView = { mesh: THREE.Mesh; update: (nowMs: number, frame: WeatherFrame) => void; dispose: () => void };

// The view through the glass is painted, not modelled: drawn in the design's 100 × 82.4 glass units.
const GLASS_W = 100;
const GLASS_H = 82.4;
const PX = 4;

const DROPS = [
    [18, 30],
    [66, 18],
    [44, 46],
    [84, 40],
];

// ~13 thin slanted streaks with uneven dashes, each on its own loop
const STREAKS = Array.from({ length: 13 }, (_, i) => {
    const n = i + 1;
    const [dash, gap, period, opacity] =
        n % 3 === 0 ? [3, 15, 1700, 0.3] : n % 2 === 0 ? [7, 26, 1000, 0.25] : [4, 19, 1300, 0.35];
    return { x: 4 + i * 8.4, dash, gap, period, opacity, delay: n % 5 === 0 ? 600 : (i * 137) % 900 };
});

// Window glass, in world units (on the left wall, facing +X)
export const GLASS = WINDOW_GLASS;

export function createWindowView(reducedMotion: boolean): WindowView {
    const canvas = document.createElement('canvas');
    canvas.width = GLASS_W * PX;
    canvas.height = Math.round(GLASS_H * PX);
    const g = canvas.getContext('2d')!;
    const paths = Object.fromEntries(Object.entries(EXTERIOR_PATHS).map(([key, d]) => [key, new Path2D(d)]));
    const drawState = (g: CanvasRenderingContext2D, state: WeatherFrame['to']) => {
        const c = exteriorFor(state);
        g.globalAlpha = 1;
        g.fillStyle = c.sky;
        g.fillRect(0, 0, GLASS_W, GLASS_H);
        const fill = (path: string, color: string | null) => {
            if (!color) return;
            g.save();
            if (REFLECT_PATHS.has(path)) { g.translate(GLASS_W, 0); g.scale(-1, 1); }
            g.fillStyle = color;
            g.fill(paths[path]);
            g.restore();
        };
        fill('horizon', c.horizon);
        if (state.weather === 'clear' && state.time === 'night') {
            g.fillStyle = STARS.color;
            for (const [x, y, r] of STARS.dots) {
                g.beginPath(); g.arc(GLASS_W - x, y, r, 0, Math.PI * 2); g.fill();
            }
        } else if (state.weather === 'clear') {
            fill('puffBack', c.cloudBack); fill('puffFront', c.cloudFront);
        } else if (state.weather === 'cloudy') {
            fill('heavyBack', c.cloudBack); fill('cloudyUpper', c.cloudFront);
        } else {
            fill('cloudBack', c.cloudBack); fill('cloudFront', c.cloudFront);
        }
        fill('treesBack', c.treesBack); fill('treesFront', c.treesFront);
    };
    // Draw each complete opaque exterior on its own layer: applying alpha per shape would
    // let the old sky leak through the new trees/clouds during a transition.
    const layer = document.createElement('canvas');
    layer.width = canvas.width; layer.height = canvas.height;
    const layerContext = layer.getContext('2d')!;
    const mixColor = (a: string, b: string, t: number) => {
        const x = new THREE.Color(a), y = new THREE.Color(b);
        return `#${x.lerp(y, t).getHexString()}`;
    };
    const draw = (nowMs: number, frame: WeatherFrame) => {
        g.setTransform(PX, 0, 0, PX, 0, 0);
        drawState(g, frame.from);
        if (frame.animating && frame.mix > 0) {
            layerContext.setTransform(PX, 0, 0, PX, 0, 0);
            drawState(layerContext, frame.to);
            g.setTransform(1, 0, 0, 1, 0, 0);
            g.globalAlpha = frame.mix;
            g.drawImage(layer, 0, 0);
            g.setTransform(PX, 0, 0, PX, 0, 0);
        }
        g.globalAlpha = 1;
        if (!frame.rain) return;
        const old = exteriorFor(frame.from), next = exteriorFor(frame.to);
        const rainyColor = (key: 'rain' | 'drop') => frame.from.weather !== 'rainy' ? next[key]
            : frame.to.weather !== 'rainy' ? old[key] : mixColor(old[key], next[key], frame.mix);
        g.strokeStyle = rainyColor('rain');
        g.lineWidth = 0.8;
        g.lineCap = 'round';
        for (const s of STREAKS) {
            const loop = s.dash + s.gap;
            // Matches the design's stroke-dashoffset animation: 46 units per loop
            const offset = reducedMotion ? 0 : (((nowMs + s.delay) % s.period) / s.period) * 46;
            g.globalAlpha = s.opacity * frame.rain;
            g.setLineDash([s.dash, s.gap]);
            g.lineDashOffset = -offset % loop;
            g.beginPath();
            g.moveTo(s.x, -6);
            g.lineTo(s.x - 6, 90);
            g.stroke();
        }
        g.setLineDash([]);

        g.globalAlpha = 0.45 * frame.rain;
        g.fillStyle = rainyColor('drop');
        for (const [x, y] of DROPS) {
            g.beginPath();
            g.moveTo(x, y);
            g.bezierCurveTo(x - 1, y + 3, x - 1.5, y + 5, x, y + 6);
            g.bezierCurveTo(x + 1.5, y + 5, x + 1, y + 3, x, y);
            g.fill();
        }
        g.globalAlpha = 1;
    };

    let lastKey = '';
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;

    const width = GLASS.zMax - GLASS.zMin;
    const height = GLASS.yMax - GLASS.yMin;
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), new THREE.MeshBasicMaterial({ map: texture }));
    // Facing +X: the plane's left edge ends up at +Z, which is screen-left from this camera
    mesh.rotation.y = Math.PI / 2;
    mesh.position.set(0.012, (GLASS.yMin + GLASS.yMax) / 2, (GLASS.zMin + GLASS.zMax) / 2);

    return {
        mesh,
        update: (nowMs, frame) => {
            const key = JSON.stringify(frame);
            if (key === lastKey && (reducedMotion || !frame.rain)) return;
            lastKey = key;
            draw(nowMs, frame);
            texture.needsUpdate = true;
        },
        dispose: () => {
            texture.dispose();
            mesh.geometry.dispose();
            (mesh.material as THREE.Material).dispose();
        },
    };
}
