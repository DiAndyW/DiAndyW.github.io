import * as THREE from 'three';
import { WINDOW_VIEW } from './palette';

export type WindowView = { mesh: THREE.Mesh; update: (nowMs: number) => void; dispose: () => void };

// The view through the glass is painted, not modelled: drawn in the design's 100 × 82.4 glass units.
const GLASS_W = 100;
const GLASS_H = 82.4;
const PX = 4;

const CLOUD_BACK = 'M-4 22 C8 14 18 18 26 14 C36 8 50 12 58 9 C70 4 84 10 104 6 L104 -4 L-4 -4 Z';
const CLOUD_FRONT = 'M-4 10 C10 6 22 8 34 4 C46 0 60 4 74 1 C86 -2 96 2 104 0 L104 -4 L-4 -4 Z';
const TREES_BACK =
    'M-4 86 L-4 64 C2 58 8 58 12 62 C16 54 24 54 28 61 C33 57 39 57 43 63 C48 56 56 56 60 62 C64 58 70 58 74 63 C79 55 88 55 92 61 C96 58 100 58 104 61 L104 86 Z';
const TREES_FRONT = 'M-4 86 L-4 72 C6 68 16 70 24 73 C36 67 50 68 60 72 C72 67 86 68 104 71 L104 86 Z';
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
export const GLASS = { zMin: 2.2, zMax: 5.6, yMin: 2.0, yMax: 4.8 } as const;

export function createWindowView(reducedMotion: boolean): WindowView {
    const canvas = document.createElement('canvas');
    canvas.width = GLASS_W * PX;
    canvas.height = Math.round(GLASS_H * PX);
    const g = canvas.getContext('2d')!;
    const paths = [CLOUD_BACK, CLOUD_FRONT, TREES_BACK, TREES_FRONT].map((d) => new Path2D(d));
    const fills = [WINDOW_VIEW.cloudBack, WINDOW_VIEW.cloudFront, WINDOW_VIEW.treesBack, WINDOW_VIEW.treesFront];

    const draw = (nowMs: number) => {
        g.setTransform(PX, 0, 0, PX, 0, 0);
        g.fillStyle = WINDOW_VIEW.sky;
        g.fillRect(0, 0, GLASS_W, GLASS_H);
        paths.forEach((p, i) => {
            g.fillStyle = fills[i];
            g.fill(p);
        });

        g.strokeStyle = WINDOW_VIEW.rain;
        g.lineWidth = 0.8;
        g.lineCap = 'round';
        for (const s of STREAKS) {
            const loop = s.dash + s.gap;
            // Matches the design's stroke-dashoffset animation: 46 units per loop
            const offset = reducedMotion ? 0 : (((nowMs + s.delay) % s.period) / s.period) * 46;
            g.globalAlpha = s.opacity;
            g.setLineDash([s.dash, s.gap]);
            g.lineDashOffset = -offset % loop;
            g.beginPath();
            g.moveTo(s.x, -6);
            g.lineTo(s.x - 6, 90);
            g.stroke();
        }
        g.setLineDash([]);

        g.globalAlpha = 0.45;
        g.fillStyle = WINDOW_VIEW.drop;
        for (const [x, y] of DROPS) {
            g.beginPath();
            g.moveTo(x, y);
            g.bezierCurveTo(x - 1, y + 3, x - 1.5, y + 5, x, y + 6);
            g.bezierCurveTo(x + 1.5, y + 5, x + 1, y + 3, x, y);
            g.fill();
        }
        g.globalAlpha = 1;
    };

    draw(0);
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
        update: (nowMs) => {
            if (reducedMotion) return;
            draw(nowMs);
            texture.needsUpdate = true;
        },
        dispose: () => {
            texture.dispose();
            mesh.geometry.dispose();
            (mesh.material as THREE.Material).dispose();
        },
    };
}
