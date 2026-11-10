// Flat clouds for the intro's dive, drawn on a 2D canvas over the globe in the same style as the globe:
// solid fills, hard edges, and one flat darker tone on the side away from the sun. The camera looks straight
// down, so the clouds are decks seen from above: ragged sheets stacked in depth, each one thicker than the
// last. The layout is plain data so it can be unit tested; createCloudLayer turns it into paths in the browser.

// Tuned in the preview: 5 decks at 1.2x cover, haze 0.7.
export const CLOUDS = { seed: 23, layers: 5, cover: 1.2, haze: 0.7 };
const WHITE = '#ffffff';
const SHADE = '#d2e0f0';
// Far decks are tinted toward the sky and sit behind haze.
const WHITE_FAR = '#cfe0f6';
const SHADE_FAR = '#a9c4e8';
const HAZE = '#eef4fc';
const SHADOW = '#1d3f7a';
// Shade and shadows fall down-right, away from the globe's sun.
const LIGHT_X = 0.8;
const LIGHT_Y = 0.6;
// Starting depths of the nearest and farthest deck. Depth 1 is where one unit spans the screen's larger half.
const NEAR_D = 2;
const FAR_D = 5.8;

export function seeded(seed: number): () => number {
    return () => {
        seed = (seed + 0x6d2b79f5) | 0;
        let x = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
        return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
    };
}

const clamp = (v: number) => Math.min(1, Math.max(0, v));

// Smooth value noise on a repeating grid.
function valueNoise(rand: () => number): (x: number, y: number) => number {
    const P = 64;
    const grid = Float32Array.from({ length: P * P }, () => rand());
    const at = (x: number, y: number) => grid[(((y % P) + P) % P) * P + (((x % P) + P) % P)];
    return (x, y) => {
        const x0 = Math.floor(x);
        const y0 = Math.floor(y);
        const fx = x - x0;
        const fy = y - y0;
        const sx = fx * fx * (3 - 2 * fx);
        const sy = fy * fy * (3 - 2 * fy);
        const a = at(x0, y0) + (at(x0 + 1, y0) - at(x0, y0)) * sx;
        const b = at(x0, y0 + 1) + (at(x0 + 1, y0 + 1) - at(x0, y0 + 1)) * sx;
        return a + (b - a) * sy;
    };
}

export type Circle = [x: number, y: number, r: number];
// d: starting depth; s: grid spacing, which sets the width of the shade; bumps: lumps drawn on top of the base.
export type Deck = { d: number; s: number; base: Circle[]; bumps: Circle[] };
type ExitCell = { u: number; v: number; val: number; j: number };
export type ExitSheet = { cells: ExitCell[]; grain: number; lo: number; hi: number };
export type CloudField = { decks: Deck[]; exit: ExitSheet };

// One deck: a jittered grid of circles kept where noise is high, so the cover forms ragged banks with gaps.
// The grid scales with depth, so every deck fills the screen when it first shows and lower decks are made of
// bigger masses.
function buildDeck(i: number, n: number, rand: () => number, noise: (x: number, y: number) => number): Deck {
    const f = n === 1 ? 1 : i / (n - 1);
    const last = i === n - 1;
    const d = NEAR_D + (FAR_D - NEAR_D) * f;
    const grain = 0.06 + 0.02 * f;
    const cover = Math.min(0.97, Math.max(0.05, (0.22 + 0.5 * Math.pow(f, 1.4)) * CLOUDS.cover));
    const ox = rand() * 40;
    const oy = rand() * 40;
    const sig = (last ? 1.3 : 0.5) / d;
    const cands: { u: number; v: number; val: number; j: number; b: number }[] = [];
    for (let gy = -1.5; gy <= 1.5; gy += grain) {
        for (let gx = -1.5; gx <= 1.5; gx += grain) {
            const u = gx + (rand() - 0.5) * grain * 0.7;
            const v = gy + (rand() - 0.5) * grain * 0.7;
            let val = 0.65 * noise(u / 0.36 + ox, v / 0.36 + oy) + 0.35 * noise(u / 0.15 + oy, v / 0.15 + ox);
            // Upper decks leave a gap dead ahead to dive through; the last one is solid there.
            val += (last ? 1.2 : -1.2) * Math.exp(-(u * u + v * v) / (sig * sig));
            cands.push({ u, v, val, j: rand(), b: rand() });
        }
    }
    const sorted = cands.map((c) => c.val).sort((a, b) => a - b);
    const thr = sorted[Math.min(sorted.length - 1, Math.floor((1 - cover) * sorted.length))];
    const base: Circle[] = [];
    const bumps: Circle[] = [];
    for (const c of cands) {
        if (c.val <= thr) continue;
        // Circles shrink toward the edge of a bank, which leaves the edges lacy.
        const e = clamp((c.val - thr) / 0.22);
        const r = grain * (0.6 + 0.8 * e) * (0.9 + 0.2 * c.j) * d;
        base.push([c.u * d, c.v * d, r]);
        if (e > 0.45 && c.b < 0.42) bumps.push([c.u * d, c.v * d, r * 0.6]);
    }
    return { d, s: grain * d, base, bumps };
}

// The same seeded layout every visit, so the intro always looks the way it was tuned.
export function cloudField(seed = CLOUDS.seed): CloudField {
    const rand = seeded(seed);
    const noise = valueNoise(rand);
    const decks = Array.from({ length: CLOUDS.layers }, (_, i) => buildDeck(i, CLOUDS.layers, rand, noise));

    // The underside of the last deck, for the break-through: a full sheet of circles that thins from the
    // middle outward, with weak spots that open early and thick spots that linger.
    const grain = 0.11;
    const cells: ExitCell[] = [];
    for (let gy = -1.5; gy <= 1.5; gy += grain) {
        for (let gx = -1.5; gx <= 1.5; gx += grain) {
            const u = gx + (rand() - 0.5) * grain * 0.7;
            const v = gy + (rand() - 0.5) * grain * 0.7;
            const val =
                0.6 * noise(u / 0.5 + 3, v / 0.5 + 7) +
                0.4 * noise(u / 0.2 + 11, v / 0.2 + 5) +
                0.9 * (1 - Math.exp(-(u * u + v * v) / 0.3));
            cells.push({ u, v, val, j: 0.85 + rand() * 0.3 });
        }
    }
    const vals = cells.map((c) => c.val);
    return { decks, exit: { cells, grain, lo: Math.min(...vals), hi: Math.max(...vals) } };
}

// Where a deck is at dive progress `into` (0-1): its depth ahead of the camera, how far it has come up out of
// the haze, and whether it is still ahead at all. The last deck reaches the camera as the dive ends.
export function deckView(into: number, deck: Deck) {
    const z = deck.d - (FAR_D - 0.06) * Math.pow(into, 1.1);
    return { z, alpha: clamp(into / 0.2) * clamp((4.4 - z) / 1.4), visible: z > 0.07 };
}

// The break-through at progress p (0-1), as circles in units of the screen's larger half-size, centered on
// the screen. The sheet is already rushing outward when it appears and starts to tear almost at once, so the
// screen is never a still white; its lumps show that movement while it is still whole. Nothing is left at
// the end, and the screen is clear well before then.
export function exitView(p: number, exit: ExitSheet): { scale: number; base: Circle[]; lumps: Circle[] } {
    const scale = 1 + 1.7 * (1 - (1 - p) ** 2);
    const thr = exit.lo - 0.04 + (exit.hi - exit.lo + 0.04) * p;
    const base: Circle[] = [];
    const lumps: Circle[] = [];
    for (const c of exit.cells) {
        const f = clamp((c.val - thr) / 0.25);
        if (f <= 0) continue;
        const r = exit.grain * 1.5 * c.j * scale * Math.pow(f, 0.6);
        base.push([c.u * scale, c.v * scale, r]);
        // Lumps sit inside the sheet, away from the torn edges.
        if (f > 0.6 && c.j < 0.96) lumps.push([c.u * scale, c.v * scale, r * 0.6]);
    }
    return { scale, base, lumps };
}

const rgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
function mix(a: string, b: string, f: number): string {
    const A = rgb(a);
    const B = rgb(b);
    return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * f)).join(',')})`;
}

export type CloudTimes = { cloudsFrom: number; cover: number; revealMs: number };
export type CloudLayer = {
    resize: (width: number, height: number, dpr: number) => void;
    // Draws the frame at time t (ms) and returns true once the clouds cover the screen.
    draw: (t: number) => boolean;
    // True once the break-through has left nothing on screen, which is well before its time is up.
    cleared: () => boolean;
};

// The camera drops through the decks into the last one, then its underside tears open onto the page.
export function createCloudLayer(canvas: HTMLCanvasElement, times: CloudTimes): CloudLayer {
    const g = canvas.getContext('2d')!;
    // A second canvas for fading a deck in as one flat shape, so its shade never shows through its white.
    const scratch = document.createElement('canvas').getContext('2d')!;
    const field = cloudField();
    const toPath = (circles: Circle[]) => {
        const path = new Path2D();
        for (const [x, y, r] of circles) {
            path.moveTo(x + r, y);
            path.arc(x, y, r, 0, Math.PI * 2);
        }
        return path;
    };
    const decks = field.decks.map((deck) => ({ deck, base: toPath(deck.base), bumps: toPath(deck.bumps) }));

    let width = 1;
    let height = 1;
    let dpr = 1;
    let cleared = false;

    // far: 0 for a deck at the camera, 1 for one deep in the haze.
    const fillDeck = (c: CanvasRenderingContext2D, d: (typeof decks)[number], cx: number, cy: number, k: number, far: number) => {
        const white = mix(WHITE, WHITE_FAR, far);
        const shade = mix(SHADE, SHADE_FAR, far);
        const edge = 0.22 * d.deck.s;
        const lump = 0.14 * d.deck.s;
        c.save();
        c.translate(cx, cy);
        c.scale(k, k);
        c.translate(LIGHT_X * edge, LIGHT_Y * edge);
        c.fillStyle = shade;
        c.fill(d.base);
        c.translate(-LIGHT_X * edge, -LIGHT_Y * edge);
        c.fillStyle = white;
        c.fill(d.base);
        c.translate(LIGHT_X * lump, LIGHT_Y * lump);
        c.fillStyle = shade;
        c.fill(d.bumps);
        c.translate(-LIGHT_X * lump, -LIGHT_Y * lump);
        c.fillStyle = white;
        c.fill(d.bumps);
        c.restore();
    };

    return {
        resize(w, h, ratio) {
            width = w;
            height = h;
            dpr = ratio;
            for (const c of [canvas, scratch.canvas]) {
                c.width = Math.round(w * ratio);
                c.height = Math.round(h * ratio);
            }
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

            if (!covered) {
                const haze = CLOUDS.haze * 0.14 * Math.pow(into, 1.2);
                // Farthest deck first, with a layer of hazy air under each one.
                for (let i = decks.length - 1; i >= 0; i--) {
                    const d = decks[i];
                    g.globalAlpha = haze;
                    g.fillStyle = HAZE;
                    g.fillRect(0, 0, width, height);
                    const { z, alpha, visible } = deckView(into, d.deck);
                    if (!visible || alpha <= 0.004) continue;
                    const k = R / z;
                    const far = clamp((z - 0.6) / 3.6);
                    // Each deck throws a flat shadow on whatever is below it.
                    const drop = 0.6 * d.deck.s * k;
                    g.save();
                    g.globalAlpha = alpha * 0.12;
                    g.translate(cx + LIGHT_X * drop, cy + LIGHT_Y * drop);
                    g.scale(k, k);
                    g.fillStyle = SHADOW;
                    g.fill(d.base);
                    g.restore();
                    if (alpha >= 0.995) {
                        g.globalAlpha = 1;
                        fillDeck(g, d, cx, cy, k, far);
                    } else {
                        scratch.setTransform(dpr, 0, 0, dpr, 0, 0);
                        scratch.clearRect(0, 0, width, height);
                        fillDeck(scratch, d, cx, cy, k, far);
                        g.globalAlpha = alpha;
                        g.drawImage(scratch.canvas, 0, 0, width, height);
                    }
                }
                // The last deck rises to meet the camera and becomes the whiteout.
                const sheet = clamp((into - 0.93) / 0.07);
                if (sheet > 0) {
                    g.globalAlpha = sheet;
                    g.fillStyle = WHITE;
                    g.fillRect(0, 0, width, height);
                }
                g.globalAlpha = 1;
                return false;
            }

            // Out the bottom of the deck: it thins and tears open in several places as it rushes past.
            const p = clamp((t - times.cover) / times.revealMs);
            const view = exitView(p, field.exit);
            const edge = 0.22 * field.exit.grain * view.scale * R;
            // The lumps' shade grows out of the whiteout rather than popping in.
            const lump = 0.14 * field.exit.grain * view.scale * R * clamp(p / 0.06);
            let onScreen = 0;
            const onScreenPath = (circles: Circle[]) => {
                const path = new Path2D();
                onScreen = 0;
                for (const [x, y, r] of circles) {
                    const px = cx + x * R;
                    const py = cy + y * R;
                    const pr = r * R;
                    if (px + pr < -edge || px - pr > width + edge || py + pr < -edge || py - pr > height + edge) continue;
                    path.moveTo(px + pr, py);
                    path.arc(px, py, pr, 0, Math.PI * 2);
                    onScreen++;
                }
                return path;
            };
            const lumps = onScreenPath(view.lumps);
            const base = onScreenPath(view.base);
            cleared = onScreen === 0;
            const fillOffset = (path: Path2D, by: number) => {
                g.save();
                g.translate(LIGHT_X * by, LIGHT_Y * by);
                g.fillStyle = SHADE;
                g.fill(path);
                g.restore();
            };
            fillOffset(base, edge);
            g.fillStyle = WHITE;
            g.fill(base);
            fillOffset(lumps, lump);
            g.fillStyle = WHITE;
            g.fill(lumps);
            return true;
        },
        cleared: () => cleared,
    };
}
