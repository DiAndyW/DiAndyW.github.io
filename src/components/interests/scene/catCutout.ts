import * as THREE from 'three';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';
import * as C from './palette';

// The cat is the design's own drawing (RoomFlat's cat group), cut out in layers and turned to face the camera.
// The camera only ever pans and zooms, never rotates, so flat layers look exactly like the drawing from every
// frame. Layers are painted in SVG order (renderOrder, no depth test), like the SVG itself.

// SVG units per world unit across the screen: RoomFlat draws x − z at 34.64 per unit, i.e. 34.64·√2
const SVG_PER_UNIT = 48.99;

// Pivots, from the design's transform-origins (tail: 95% 15% of its box; ear: bottom centre)
const TAIL_PIVOT = new THREE.Vector2(26, 11);
const EAR_PIVOT = new THREE.Vector2(-20, -11);
// Breathing scales the cat up from where its belly meets the rug
const BREATH_PIVOT = new THREE.Vector2(4, 16);

// [id, group, markup]. Strokes keep the design's round caps and joins.
const LAYERS: [string, 'ground' | 'body' | 'tail' | 'ear', string][] = [
    ['shadow', 'ground', `<ellipse cx="4" cy="12" rx="40" ry="10" fill="${C.RUG.lip}"/>`],
    ['tailBack', 'tail', `<path d="M33 4 C32 18 6 22 -12 17" fill="none" stroke="${C.CAT.lit}" stroke-width="10"/>`],
    ['body', 'body', `<path d="M-34 4 C-38 -10 -24 -27 -2 -28 C20 -29 37 -18 38 -4 C39 9 26 16 6 16 C-14 16 -31 13 -34 4 Z" fill="${C.CAT.lit}"/>`],
    ['bodyShade', 'body', ''],
    ['stripe1', 'body', `<path d="M0 -26 C1 -22 1 -19 0 -16" fill="none" stroke="${C.CAT.stripe}" stroke-width="3"/>`],
    ['stripe2', 'body', `<path d="M11 -25 C12 -21 12 -18 11 -15" fill="none" stroke="${C.CAT.stripe}" stroke-width="3"/>`],
    ['stripe3', 'body', `<path d="M22 -21 C23 -17 22 -14 21 -11" fill="none" stroke="${C.CAT.stripe}" stroke-width="3"/>`],
    ['tailFront', 'tail', `<path d="M28 10 C18 20 0 21 -14 17" fill="none" stroke="${C.CAT.shade}" stroke-width="10"/>`],
    ['tailTip', 'tail', `<path d="M-12 17 C-16 16 -19 15 -21 13" fill="none" stroke="${C.CAT.cream}" stroke-width="10"/>`],
    ['leftEar', 'body', `<path d="M-41 -8 L-41 -23 C-41 -26 -39 -26 -38 -25 L-30 -16 Z" fill="${C.CAT.lit}"/>`],
    ['leftInner', 'body', `<path d="M-38.5 -11 L-38.5 -20 L-33 -15 Z" fill="${C.CAT.innerEar}"/>`],
    ['rightEar', 'ear', `<path d="M-25 -16 L-19 -25 C-18 -27 -16 -26 -16 -24 L-15 -11 Z" fill="${C.CAT.lit}"/>`],
    ['rightInner', 'ear', `<path d="M-22 -15 L-18.5 -21 L-17.5 -13 Z" fill="${C.CAT.innerEar}"/>`],
    ['head', 'body', `<path d="M-45 0 C-45 -10 -37 -17 -28 -17 C-19 -17 -12 -10 -12 0 C-12 8 -19 12 -28 12 C-37 12 -45 8 -45 0 Z" fill="${C.CAT.lit}"/>`],
    ['muzzle', 'body', `<ellipse cx="-28" cy="5" rx="9" ry="5.5" fill="${C.CAT.cream}"/>`],
    ['eyeLeft', 'body', `<path d="M-37 -2 Q-34.5 0.5 -32 -2" fill="none" stroke="${C.CAT.eye}" stroke-width="1.6"/>`],
    ['eyeRight', 'body', `<path d="M-24 -2 Q-21.5 0.5 -19 -2" fill="none" stroke="${C.CAT.eye}" stroke-width="1.6"/>`],
    ['nose', 'body', `<path d="M-29.6 1.6 L-26.4 1.6 L-28 3.4 Z" fill="${C.CAT.nose}"/>`],
];

// The body's shaded half: everything right of x = 4, as the design's clip-path draws it
const SHADE_FROM_X = 4;

const CURVE_SEGMENTS = 24;

// Clips a closed polygon to x ≥ edge
function clipRight(points: THREE.Vector2[], edge: number) {
    const out: THREE.Vector2[] = [];
    points.forEach((p, i) => {
        const q = points[(i + 1) % points.length];
        if (p.x >= edge) out.push(p);
        if (p.x >= edge !== q.x >= edge) {
            const t = (edge - p.x) / (q.x - p.x);
            out.push(new THREE.Vector2(edge, p.y + t * (q.y - p.y)));
        }
    });
    return out;
}

export type CatCutout = {
    root: THREE.Group;
    // Rotate about local Z; rotation.z in radians matches CSS rotate() in degrees (positive = clockwise)
    tail: THREE.Object3D;
    ear: THREE.Object3D;
    // Scale Y to breathe
    breath: THREE.Object3D;
    dispose: () => void;
};

export function createCatCutout(renderOrderBase: number): CatCutout {
    const markup = LAYERS.map(([id, , svg]) => svg.replace(/^<(\w+)/, `<$1 id="${id}"`)).join('');
    const parsed = new SVGLoader().parse(`<svg xmlns="http://www.w3.org/2000/svg">${markup}</svg>`);
    const byId = new Map(parsed.paths.map((p) => [(p.userData?.node as Element).id, p]));

    const owned: { dispose: () => void }[] = [];
    const materials = new Map<string, THREE.MeshBasicMaterial>();
    const material = (color: string) => {
        if (!materials.has(color)) {
            const m = new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide, depthTest: false, transparent: true });
            materials.set(color, m);
            owned.push(m);
        }
        return materials.get(color)!;
    };

    const root = new THREE.Group();
    // SVG units, y down
    const svgSpace = new THREE.Group();
    svgSpace.scale.set(1 / SVG_PER_UNIT, -1 / SVG_PER_UNIT, 1);
    root.add(svgSpace);

    const pivotGroup = (pivot: THREE.Vector2, parent: THREE.Object3D) => {
        const outer = new THREE.Group();
        outer.position.set(pivot.x, pivot.y, 0);
        const inner = new THREE.Group();
        inner.position.set(-pivot.x, -pivot.y, 0);
        outer.add(inner);
        parent.add(outer);
        return { outer, inner };
    };
    const breath = pivotGroup(BREATH_PIVOT, svgSpace);
    const tail = pivotGroup(TAIL_PIVOT, breath.inner);
    const ear = pivotGroup(EAR_PIVOT, breath.inner);
    const parents = { ground: svgSpace, body: breath.inner, tail: tail.inner, ear: ear.inner };

    const addLayer = (geometry: THREE.BufferGeometry, color: string, order: number, group: keyof typeof parents) => {
        const mesh = new THREE.Mesh(geometry, material(color));
        mesh.renderOrder = renderOrderBase + order;
        parents[group].add(mesh);
        owned.push(geometry);
    };

    LAYERS.forEach(([id, group], order) => {
        if (id === 'bodyShade') {
            const body = SVGLoader.createShapes(byId.get('body')!)[0];
            const half = clipRight(body.getPoints(CURVE_SEGMENTS), SHADE_FROM_X);
            addLayer(new THREE.ShapeGeometry(new THREE.Shape(half)), C.CAT.shade, order, group);
            return;
        }
        const path = byId.get(id)!;
        const style = path.userData!.style;
        if (style.fill && style.fill !== 'none') {
            addLayer(new THREE.ShapeGeometry(SVGLoader.createShapes(path), CURVE_SEGMENTS), style.fill, order, group);
        }
        if (style.stroke && style.stroke !== 'none') {
            const strokeStyle = SVGLoader.getStrokeStyle(style.strokeWidth, style.stroke, 'round', 'round');
            for (const sub of path.subPaths) {
                const geometry = SVGLoader.pointsToStroke(sub.getPoints(CURVE_SEGMENTS), strokeStyle);
                if (geometry) addLayer(geometry, style.stroke, order, group);
            }
        }
    });

    return {
        root,
        tail: tail.outer,
        ear: ear.outer,
        breath: breath.outer,
        dispose: () => owned.forEach((o) => o.dispose()),
    };
}
