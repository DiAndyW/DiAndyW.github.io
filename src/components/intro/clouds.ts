// Flat clouds for the intro's dive, drawn on a 2D canvas over the globe in the same style as the globe:
// solid fills, hard edges, and one flat darker tone on the underside. Cloud shapes are plain data so they
// can be unit tested; createCloudLayer turns them into paths in the browser.

// Each shape is about one unit wide and sits on a flat base at y = FLAT_BASE (y points down).
// Parts are circles [x, y, r] or pills { pill: [x, y, length, height] } where (x, y) is the left end's center.
type Part = [number, number, number] | { pill: [number, number, number, number] };
export type CloudType = 'cumulus' | 'stratus' | 'tower' | 'puff' | 'streak';
export type CloudShape = { type: CloudType; parts: Part[]; hw: number }; // hw: rough half-width

const FLAT_BASE = 0.12;
const TOP_SHIFT = 0.045; // the white top sits this far above the shade, leaving a flat strip underneath

// Tuned in the preview: twotone look, 60 clouds at 1.5 per unit of amount, size 1.3.
export const CLOUDS = { seed: 11, amount: 90, baseSize: 0.65, size: 0.65 * 1.3, haze: 0.45 };
const WHITE = '#ffffff';
const SHADE = '#d2e0f0';

export function seeded(seed: number): () => number {
    return () => {
        seed = (seed + 0x6d2b79f5) | 0;
        let x = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
        return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
    };
}

const CLOUD_TYPES: Record<CloudType, (rand: () => number) => Omit<CloudShape, 'type'>> = {
    // Puffy cumulus: a row of small puffs with 2-3 big humps on top.
    cumulus(rand) {
        const parts: Part[] = [];
        const n = 5 + Math.floor(rand() * 3);
        for (let i = 0; i < n; i++) parts.push([-0.4 + (0.8 * i) / (n - 1) + (rand() - 0.5) * 0.06, 0.04 + rand() * 0.03, 0.09 + rand() * 0.05]);
        const humps = 2 + Math.floor(rand() * 2);
        for (let i = 0; i < humps; i++) {
            const r = 0.15 + rand() * 0.1;
            parts.push([-0.25 + (0.5 * i) / (humps - 1) + (rand() - 0.5) * 0.12, 0.06 - r * 0.75 - rand() * 0.05, r]);
        }
        for (let i = 0; i < 3; i++) parts.push([(rand() - 0.5) * 0.6, -0.04 - rand() * 0.06, 0.1 + rand() * 0.06]);
        return { parts, hw: 0.55 };
    },
    // Long, low stratus: many small puffs strung out with a few gentle bumps.
    stratus(rand) {
        const parts: Part[] = [];
        const n = 10 + Math.floor(rand() * 4);
        for (let i = 0; i < n; i++) parts.push([-0.75 + (1.5 * i) / (n - 1) + (rand() - 0.5) * 0.05, 0.06 + rand() * 0.02, 0.07 + rand() * 0.04]);
        for (let i = 0, k = 2 + Math.floor(rand() * 3); i < k; i++) {
            const r = 0.1 + rand() * 0.07;
            parts.push([(rand() - 0.5) * 1.1, 0.07 - r * 0.6, r]);
        }
        return { parts, hw: 0.85 };
    },
    // Tall tower: puffs stacked into a column that narrows toward the top.
    tower(rand) {
        const parts: Part[] = [];
        for (let i = 0; i < 4; i++) parts.push([-0.3 + 0.2 * i + (rand() - 0.5) * 0.04, 0.05, 0.1 + rand() * 0.03]);
        const levels = 3 + Math.floor(rand() * 2);
        let drift = 0;
        for (let l = 0; l < levels; l++) {
            drift += (rand() - 0.5) * 0.08;
            const r = 0.19 - l * 0.025;
            const y = -0.04 - l * 0.15;
            parts.push([drift - 0.1, y, r], [drift + 0.1, y - rand() * 0.04, r * (0.85 + rand() * 0.2)]);
        }
        parts.push([drift, -0.04 - levels * 0.15 + 0.04, 0.12]);
        return { parts, hw: 0.4 };
    },
    // Small round puff: a tight cluster of big circles.
    puff(rand) {
        const parts: Part[] = [[-0.14, 0.03, 0.12], [0.14, 0.03, 0.12], [0, 0.04, 0.12]];
        for (let i = 0, k = 3 + Math.floor(rand() * 2); i < k; i++) parts.push([(rand() - 0.5) * 0.3, -0.08 - rand() * 0.1, 0.15 + rand() * 0.07]);
        return { parts, hw: 0.35 };
    },
    // Stacked streaks: 2-3 rounded pills of different lengths, offset like wind lines.
    streak(rand) {
        const parts: Part[] = [];
        const k = 2 + Math.floor(rand() * 2);
        for (let i = 0; i < k; i++) {
            const h = 0.17 + rand() * 0.04;
            const len = 0.25 + rand() * 0.35;
            parts.push({ pill: [(rand() - 0.5) * 0.3 - len / 2, FLAT_BASE - h / 2 - i * 0.16, len, h] });
        }
        return { parts, hw: 0.55 };
    },
};

// How often each type shows up in the tunnel. Puffy clouds stay the most common.
export const TYPE_WEIGHTS: [CloudType, number][] = [
    ['cumulus', 0.34],
    ['stratus', 0.2],
    ['tower', 0.14],
    ['puff', 0.16],
    ['streak', 0.16],
];

// a: direction from the screen center; r: distance out at depth 1; z: starting depth; s: size multiplier.
type TunnelCloud = { a: number; r: number; z: number; s: number; flip: boolean; shape: CloudShape };
type RingCloud = { a: number; k: number; flip: boolean; shape: CloudShape };
export type CloudField = { tunnel: TunnelCloud[]; hero: CloudShape; ring: RingCloud[] };

// The same seeded layout every visit, so the intro always looks the way it was tuned.
export function cloudField(seed = CLOUDS.seed): CloudField {
    const rand = seeded(seed);
    const byType = Object.fromEntries(
        TYPE_WEIGHTS.map(([type]) => [type, Array.from({ length: 3 }, () => ({ type, ...CLOUD_TYPES[type](rand) }))]),
    ) as Record<CloudType, CloudShape[]>;
    const pickCumulus = () => byType.cumulus[Math.floor(rand() * 3)];
    const pick = () => {
        let roll = rand();
        const [type] = TYPE_WEIGHTS.find(([, w]) => (roll -= w) < 0) ?? TYPE_WEIGHTS[0];
        return byType[type][Math.floor(rand() * 3)];
    };

    const tunnel = Array.from({ length: CLOUDS.amount }, () => {
        const s = 0.6 + rand() * 1.1;
        const shape = pick();
        // Clouds stay solid, so they're placed out to the side to stream past the camera rather than through it.
        const r = 0.15 + shape.hw * CLOUDS.baseSize * s + rand() * 0.8;
        return { a: rand() * Math.PI * 2, r, z: 1 + rand() * 4.6, s, flip: rand() < 0.5, shape };
    });
    const hero = pickCumulus();
    const ring = Array.from({ length: 14 }, (_, i) => ({
        a: (i / 14) * Math.PI * 2 + rand() * 0.2,
        k: 0.9 + rand() * 0.3,
        flip: rand() < 0.5,
        shape: pickCumulus(),
    }));
    return { tunnel, hero, ring };
}

const clamp = (v: number) => Math.min(1, Math.max(0, v));

// Where the reveal's hole and its ring of clouds are at reveal progress p (0-1) on a width x height screen.
// The ring speeds outward at the end so the last frame is clear before the overlay is removed.
export function revealLayout(p: number, width: number, height: number, ring: RingCloud[]) {
    const e = p < 0.5 ? 2 * p * p : 1 - (2 - 2 * p) ** 2 / 2;
    const R = Math.max(width, height) / 2;
    const hole = 1.9 * e * R;
    const d = hole + 0.12 * R + 0.85 * e ** 3 * R;
    return {
        hole,
        clouds: ring.map((c) => ({
            x: width / 2 + Math.cos(c.a) * d,
            y: height / 2 + Math.sin(c.a) * d,
            size: R * (1.5 + 0.8 * e) * c.k * (CLOUDS.size / 0.55),
            rot: c.a - Math.PI / 2, // humps face the hole
            flip: c.flip,
            shape: c.shape,
        })),
    };
}

export type CloudTimes = { cloudsFrom: number; cover: number; revealMs: number };
export type CloudLayer = {
    resize: (width: number, height: number, dpr: number) => void;
    // Draws the frame at time t (ms) and returns true once the clouds cover the screen.
    draw: (t: number) => boolean;
};

// Clouds stream past as the camera dives, it flies into one big cloud, then a hole opens from the center.
export function createCloudLayer(canvas: HTMLCanvasElement, times: CloudTimes): CloudLayer {
    const g = canvas.getContext('2d')!;
    const field = cloudField();
    const paths = new Map<CloudShape, { shape: Path2D; top: Path2D }>();
    const pathsFor = (cloud: CloudShape) => {
        let p = paths.get(cloud);
        if (!p) {
            // One path per cloud so overlapping parts fill once and the cloud fades as a single shape.
            const build = (dy: number) => {
                const path = new Path2D();
                for (const part of cloud.parts) {
                    if (Array.isArray(part)) {
                        const [x, y, r] = part;
                        path.moveTo(x + r, y + dy);
                        path.arc(x, y + dy, r, 0, Math.PI * 2);
                    } else {
                        const [x, y, len, h] = part.pill;
                        path.moveTo(x, y + dy + h / 2);
                        path.arc(x, y + dy, h / 2, Math.PI / 2, (Math.PI * 3) / 2);
                        path.lineTo(x + len, y + dy - h / 2);
                        path.arc(x + len, y + dy, h / 2, -Math.PI / 2, Math.PI / 2);
                        path.closePath();
                    }
                }
                return path;
            };
            p = { shape: build(0), top: build(-TOP_SHIFT) };
            paths.set(cloud, p);
        }
        return p;
    };

    let width = 1;
    let height = 1;
    let dpr = 1;

    // plain: white only, so clouds against the whiteout blend into it.
    const drawCloud = (cloud: CloudShape, cx: number, cy: number, size: number, flip: boolean, alpha: number, plain = false, rot = 0) => {
        if (alpha <= 0.002 || size < 2) return;
        const { shape, top } = pathsFor(cloud);
        g.globalAlpha = Math.min(1, alpha);
        g.save();
        g.translate(cx, cy);
        if (rot) g.rotate(rot);
        if (flip) g.scale(-1, 1);
        g.scale(size, size);
        g.beginPath();
        g.rect(-1, -1, 2, 1 + FLAT_BASE);
        g.clip();
        if (plain) {
            g.fillStyle = WHITE;
            g.fill(shape);
        } else {
            g.fillStyle = SHADE;
            g.fill(shape);
            g.beginPath();
            g.rect(-1, -1, 2, 1 + FLAT_BASE - TOP_SHIFT);
            g.clip();
            g.clip(shape);
            g.fillStyle = WHITE;
            g.fill(top);
        }
        g.restore();
    };

    return {
        resize(w, h, ratio) {
            width = w;
            height = h;
            dpr = ratio;
            canvas.width = Math.round(w * ratio);
            canvas.height = Math.round(h * ratio);
        },
        draw(t) {
            g.setTransform(dpr, 0, 0, dpr, 0, 0);
            g.globalAlpha = 1;
            g.clearRect(0, 0, width, height);
            const into = clamp((t - times.cloudsFrom) / (times.cover - times.cloudsFrom));
            const covered = t >= times.cover;
            if (into <= 0 && !covered) return false;
            const R = Math.max(width, height) / 2;
            const cx = width / 2;
            const cy = height / 2;
            const size = CLOUDS.size;

            // The air hazes over as the camera drops into the clouds.
            if (!covered && into > 0) {
                g.globalAlpha = CLOUDS.haze * Math.pow(into, 1.6);
                g.fillStyle = WHITE;
                g.fillRect(0, 0, width, height);
            }

            // Clouds approach from far away and stream outward past the camera, farthest drawn first.
            const travel = 4.6 * Math.pow(into, 1.1) + (covered ? (t - times.cover) / 200 : 0);
            const appear = clamp(into / 0.25);
            const visible = field.tunnel
                .map((c) => ({ c, z: c.z - travel }))
                .filter((v) => v.z > 0.08)
                .sort((a, b) => b.z - a.z);
            for (const { c, z } of visible) {
                const k = 1 / z;
                const x = cx + Math.cos(c.a) * c.r * R * k;
                const y = cy + Math.sin(c.a) * c.r * R * k;
                drawCloud(c.shape, x, y, size * c.s * R * k, c.flip, appear * clamp((5.6 - z) / 0.8));
            }

            g.globalAlpha = 1;
            g.fillStyle = WHITE;
            if (!covered) {
                // Fly straight into one big cloud dead ahead, aimed at its upper humps so the flat base drops
                // off the bottom of the screen early. It becomes the whiteout.
                const heroSize = (size * 2.2 * R) / (5 - 4.92 * Math.pow(into, 1.1));
                drawCloud(field.hero, cx, cy + 0.17 * heroSize, heroSize, false, appear, true);
                const sheet = clamp((into - 0.95) / 0.05);
                if (sheet > 0) {
                    g.globalAlpha = sheet;
                    g.fillRect(0, 0, width, height);
                }
                return false;
            }

            // A hole opens from the center, ringed by big puffy clouds turned to face it.
            const reveal = revealLayout(clamp((t - times.cover) / times.revealMs), width, height, field.ring);
            g.beginPath();
            g.rect(0, 0, width, height);
            g.arc(cx, cy, reveal.hole, 0, Math.PI * 2);
            g.fill('evenodd');
            for (const c of reveal.clouds) drawCloud(c.shape, c.x, c.y, c.size, c.flip, 1, true, c.rot);
            g.globalAlpha = 1;
            return true;
        },
    };
}
