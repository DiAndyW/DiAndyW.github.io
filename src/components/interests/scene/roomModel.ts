import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { CAMERA_RIGHT, ISO_DIRECTION, type InterestId, type Vec3 } from '../roomLayout';
import * as C from './palette';
import { createCatCutout } from './catCutout';
import { createWindowView, type WindowView } from './windowView';

export type RoomModel = {
    root: THREE.Group;
    glows: Record<InterestId, THREE.Mesh>;
    rings: Record<InterestId, THREE.Mesh>;
    parts: {
        vinyl: THREE.Object3D;
        screen: THREE.Mesh;
        tail: THREE.Object3D;
        ear: THREE.Object3D;
        // Scale Y for the cat's breathing; it pivots at the cat's belly
        breath: THREE.Object3D;
        steam: THREE.Mesh[];
    };
    windowView: WindowView;
    dispose: () => void;
};

// ---------------------------------------------------------------------------------------------
// Two-tone flat shading, like the favicon: no lights, the colour comes from which way a surface faces.
// Boxes: top / screen-left face (+Z) / screen-right face (+X).
// Round things: split down the middle as seen from the camera, left lit and right shade.
// ---------------------------------------------------------------------------------------------

const VERTEX = /* glsl */ `
varying vec3 vWorld;
varying vec3 vNormal;
void main() {
    vec4 w = modelMatrix * vec4(position, 1.0);
    vWorld = w.xyz;
    vNormal = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * w;
}`;

const FRAGMENT = /* glsl */ `
uniform vec3 uTop;
uniform vec3 uLit;
uniform vec3 uShade;
uniform vec3 uCenter;
uniform vec3 uRight;
uniform int uMode;
varying vec3 vWorld;
varying vec3 vNormal;
void main() {
    vec3 n = normalize(vNormal);
    vec3 c;
    if (uMode == 0) {
        c = n.y > 0.6 ? uTop : (n.z >= n.x ? uLit : uShade);
    } else {
        bool top = uMode == 1 && n.y > 0.8;
        c = top ? uTop : (dot(vWorld - uCenter, uRight) < 0.0 ? uLit : uShade);
    }
    gl_FragColor = vec4(c, 1.0);
    #include <colorspace_fragment>
}`;

type Mode = 'box' | 'round' | 'split';
const MODE_ID: Record<Mode, number> = { box: 0, round: 1, split: 2 };

const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const mul = (a: Vec3, k: number): Vec3 => [a[0] * k, a[1] * k, a[2] * k];
const RIGHT = CAMERA_RIGHT;
// Horizontal, pointing at the viewer
const FRONT: Vec3 = [Math.SQRT1_2, 0, Math.SQRT1_2];
// The design outlines every box in its own colour, so boxes are drawn ~0.05 bigger on each side than their
// coordinates. Things resting on a thickened top move along the view direction by the same amount, which
// lifts them onto it without moving them on screen.
const OUTLINE = 0.05;
const lift = (p: Vec3, k = OUTLINE): Vec3 => [p[0] + k, p[1] + k, p[2] + k];

class Builder {
    readonly root = new THREE.Group();
    private readonly statics: THREE.Mesh[] = [];
    private readonly boxMaterials = new Map<string, THREE.ShaderMaterial>();
    private readonly flatMaterials = new Map<string, THREE.MeshBasicMaterial>();
    private covering = false;
    // Materials of things resting on a glow; they hide the glow, as the design paints them over it
    readonly covers = new Set<THREE.Material>();
    readonly owned: { dispose: () => void }[] = [];

    cover(build: () => void) {
        this.covering = true;
        build();
        this.covering = false;
    }

    shaded(mode: Mode, t: { top?: string; lit: string; shade: string }, center: Vec3 = [0, 0, 0]) {
        const key = `${mode}|${t.top}|${t.lit}|${t.shade}`;
        if (mode === 'box' && this.boxMaterials.has(key)) return this.boxMaterials.get(key)!;
        const material = new THREE.ShaderMaterial({
            vertexShader: VERTEX,
            fragmentShader: FRAGMENT,
            uniforms: {
                uTop: { value: new THREE.Color(t.top ?? t.lit) },
                uLit: { value: new THREE.Color(t.lit) },
                uShade: { value: new THREE.Color(t.shade) },
                uCenter: { value: new THREE.Vector3(...center) },
                uRight: { value: new THREE.Vector3(...RIGHT) },
                uMode: { value: MODE_ID[mode] },
            },
        });
        if (mode === 'box') this.boxMaterials.set(key, material);
        this.owned.push(material);
        return material;
    }

    flat(color: string) {
        if (!this.flatMaterials.has(color)) {
            const material = new THREE.MeshBasicMaterial({ color });
            this.flatMaterials.set(color, material);
            this.owned.push(material);
        }
        return this.flatMaterials.get(color)!;
    }

    // Static meshes get merged per material at the end
    place(geometry: THREE.BufferGeometry, material: THREE.Material, position: Vec3, rotation?: THREE.Euler, scale?: Vec3) {
        if (this.covering) this.covers.add(material);
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(...position);
        if (rotation) mesh.rotation.copy(rotation);
        if (scale) mesh.scale.set(...scale);
        this.statics.push(mesh);
        return mesh;
    }

    box(min: Vec3, max: Vec3, tones: { top: string; lit: string; shade: string }, radius = 0.05) {
        const size: Vec3 = [max[0] - min[0], max[1] - min[1], max[2] - min[2]];
        const r = Math.min(radius, Math.min(...size) / 2 - 1e-3);
        const geometry = r > 0.005 ? new RoundedBoxGeometry(size[0], size[1], size[2], 3, r) : new THREE.BoxGeometry(...size);
        return this.place(geometry, this.shaded('box', tones), mul(add(min, max), 0.5));
    }

    flatBox(min: Vec3, max: Vec3, color: string) {
        const size: Vec3 = [max[0] - min[0], max[1] - min[1], max[2] - min[2]];
        return this.place(new THREE.BoxGeometry(...size), this.flat(color), mul(add(min, max), 0.5));
    }

    // A flat disc lying on a horizontal surface
    disc(center: Vec3, radius: number, color: string, scaleXZ: [number, number] = [1, 1], yaw = 0) {
        const geometry = new THREE.CircleGeometry(radius, 48);
        geometry.rotateX(-Math.PI / 2);
        geometry.scale(scaleXZ[0], 1, scaleXZ[1]);
        geometry.rotateY(yaw);
        return this.place(geometry, this.flat(color), center);
    }

    // A vertical round thing split lit/shade about its own centre
    cylinder(center: Vec3, radius: number, height: number, tones: { top?: string; lit: string; shade: string }, segments = 40) {
        const geometry = new THREE.CylinderGeometry(radius, radius, height, segments);
        return this.place(geometry, this.shaded('round', tones, center), center);
    }

    ellipsoid(center: Vec3, radii: Vec3, tones: { top?: string; lit: string; shade: string }, mode: Mode = 'split', yaw = 0) {
        const geometry = new THREE.SphereGeometry(1, 32, 20);
        geometry.scale(...radii);
        geometry.rotateY(yaw);
        return this.place(geometry, this.shaded(mode, tones, center), center);
    }

    // Merges the static meshes, one draw call per material
    finish() {
        const byMaterial = new Map<THREE.Material, THREE.BufferGeometry[]>();
        for (const mesh of this.statics) {
            mesh.updateMatrix();
            const geometry = mesh.geometry.index ? mesh.geometry.toNonIndexed() : mesh.geometry.clone();
            geometry.applyMatrix4(mesh.matrix);
            // mergeGeometries needs identical attribute sets
            for (const name of Object.keys(geometry.attributes)) {
                if (name !== 'position' && name !== 'normal') geometry.deleteAttribute(name);
            }
            if (!geometry.attributes.normal) geometry.computeVertexNormals();
            mesh.geometry.dispose();
            const material = mesh.material as THREE.Material;
            if (!byMaterial.has(material)) byMaterial.set(material, []);
            byMaterial.get(material)!.push(geometry);
        }
        for (const [material, geometries] of byMaterial) {
            const merged = mergeGeometries(geometries)!;
            geometries.forEach((g) => g.dispose());
            this.root.add(new THREE.Mesh(merged, material));
            this.owned.push(merged);
        }
    }
}

// Points the object's +Z at the camera (the camera never rotates, so this holds forever)
const faceCamera = (object: THREE.Object3D) => {
    const p = object.position;
    object.lookAt(p.x + ISO_DIRECTION[0], p.y + ISO_DIRECTION[1], p.z + ISO_DIRECTION[2]);
};

function screenTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 224;
    const g = canvas.getContext('2d')!;
    g.scale(4, 4);
    g.fillStyle = C.SCREEN.sky;
    g.fillRect(0, 0, 100, 56);
    g.fillStyle = C.SCREEN.sun;
    g.beginPath();
    g.arc(82, 14, 6, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = C.SCREEN.hill;
    g.fill(new Path2D('M0 56 L0 40 C14 30 28 30 42 38 C58 28 78 28 100 38 L100 56 Z'));
    g.fillStyle = C.SCREEN.hillShade;
    g.fill(new Path2D('M50 56 L50 34 C62 29 80 29 100 38 L100 56 Z'));
    g.fillStyle = C.SCREEN.platform;
    g.beginPath();
    g.roundRect(20, 30, 16, 4, 2);
    g.roundRect(60, 22, 14, 4, 2);
    g.fill();
    g.fillStyle = C.SCREEN.hero;
    g.beginPath();
    g.roundRect(44, 34, 5, 7, 1.5);
    g.fill();
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
}

export function buildRoomModel(reducedMotion = false): RoomModel {
    const b = new Builder();
    const root = b.root;

    // --- Shell -----------------------------------------------------------------------------------
    b.box([-0.3, -0.4, -0.3], [12, 0, 8], { top: C.FLOOR, lit: C.SLAB.lit, shade: C.SLAB.shade }, 0);
    // Left wall: the room-facing side faces +X (screen-right), its end cap faces +Z
    b.box([-0.3, 0, -0.3], [0, 6, 8], { top: C.WALL_CAP.top, lit: C.WALL_CAP.shade, shade: C.WALL_LEFT }, 0);
    // Right wall: the room-facing side faces +Z (screen-left), its end cap faces +X
    b.box([0, 0, -0.3], [12, 6, 0], { top: C.WALL_CAP.top, lit: C.WALL_RIGHT, shade: C.WALL_CAP.shade }, 0);

    // Window light on the floor, drawn under the plank lines
    const patch = new THREE.BufferGeometry();
    const quad: [number, number][] = [[0, 2.2], [3.2, 3.2], [3.2, 6.6], [0, 5.6]];
    patch.setAttribute(
        'position',
        new THREE.Float32BufferAttribute(
            // Wound so the triangles face up
            [0, 2, 1, 0, 3, 2].flatMap((i) => [quad[i][0], 0, quad[i][1]]),
            3,
        ),
    );
    patch.setAttribute('normal', new THREE.Float32BufferAttribute(Array(18).fill(0).map((_, i) => (i % 3 === 1 ? 1 : 0)), 3));
    b.place(patch, b.flat(C.WINDOW_LIGHT), [0, 0.002, 0]);
    for (const d of [2, 4, 6]) b.flatBox([0, 0.002, d - 0.02], [12, 0.004, d + 0.02], C.PLANK_LINE);

    // --- Window ----------------------------------------------------------------------------------
    const frame = { top: C.CREAM.top, lit: C.CREAM.lit, shade: C.CREAM.top };
    b.box([0, 4.8, 1.94], [0.04, 5.05, 5.86], frame, 0.015);
    b.box([0, 1.75, 1.94], [0.04, 2.0, 5.86], frame, 0.015);
    b.box([0, 2.0, 1.94], [0.04, 4.8, 2.2], frame, 0.015);
    b.box([0, 2.0, 5.6], [0.04, 4.8, 5.86], frame, 0.015);
    b.box([0, 2.0, 3.83], [0.05, 4.8, 3.97], frame, 0.015);
    b.box([0, 3.34, 2.2], [0.05, 3.46, 5.6], frame, 0.015);
    b.box([0, 1.6, 1.85], [0.4, 1.85, 5.95], { top: C.SILL_TOP, lit: C.CREAM.lit, shade: C.CREAM.shade }, 0.04);
    const windowView = createWindowView(reducedMotion);
    root.add(windowView.mesh);

    // --- Cabinet, record player, crate -----------------------------------------------------------
    b.box([0.55, 0, -0.05], [3.65, 1.65, 1.55], C.WOOD);
    b.flatBox(lift([2.08, 0.15, 1.5]), lift([2.12, 1.45, 1.512]), C.WOOD_LINE);
    for (const x of [1.9, 2.3]) b.ellipsoid(lift([x, 0.8, 1.52]), [0.06, 0.06, 0.03], { lit: C.KNOB, shade: C.KNOB });

    b.cover(() => {
        b.box([1.05, 1.6, 0.15], [3.15, 1.95, 1.35], C.CREAM, 0.06);
        b.cylinder(lift([2.84, 1.93, 1.06]), 0.07, 0.06, { top: C.CREAM.shade, lit: C.CREAM.shade, shade: C.CREAM.shade }, 16);
        b.cylinder(lift([2.8, 1.95, 0.4]), 0.1, 0.1, { top: C.TONEARM, lit: C.TONEARM, shade: C.TONEARM }, 20);
        // Swings forward from the pivot, then in, so the head rests on the record's right edge
        const armPath: [number, number][] = [[2.8, 0.4], [2.62, 0.83], [2.24, 0.86]];
        for (let i = 0; i < armPath.length - 1; i++) {
            const [x0, z0] = armPath[i];
            const [x1, z1] = armPath[i + 1];
            const length = Math.hypot(x1 - x0, z1 - z0);
            const geometry = new THREE.BoxGeometry(length + 0.06, 0.04, 0.065);
            geometry.rotateY(-Math.atan2(z1 - z0, x1 - x0));
            b.place(geometry, b.flat(C.TONEARM), lift([(x0 + x1) / 2, 2.0, (z0 + z1) / 2]));
        }
    });

    // The vinyl spins on hover, so it stays its own object. The lighter arc makes the spin visible.
    const vinyl = new THREE.Group();
    vinyl.position.set(...lift([1.85, 1.9, 0.75]));
    const vinylCenter = lift([1.85, 1.915, 0.75]);
    const record = new THREE.Mesh(
        new THREE.CylinderGeometry(0.45, 0.45, 0.03, 48),
        b.shaded('split', { lit: C.VINYL.lit, shade: C.VINYL.shade }, vinylCenter),
    );
    record.position.y = 0.015;
    const groove = new THREE.Mesh(new THREE.RingGeometry(0.3, 0.33, 48), b.flat(C.VINYL_GROOVE));
    groove.rotation.x = -Math.PI / 2;
    groove.position.y = 0.032;
    const sheen = new THREE.Mesh(new THREE.RingGeometry(0.19, 0.41, 24, 1, 0.3, 0.55), b.flat(C.VINYL_GROOVE));
    sheen.rotation.x = -Math.PI / 2;
    sheen.position.y = 0.033;
    const label = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.012, 32), b.flat(C.RECORD_LABEL));
    label.position.y = 0.036;
    vinyl.add(record, groove, sheen, label);
    vinyl.children.forEach((m) => b.covers.add((m as THREE.Mesh).material as THREE.Material));
    root.add(vinyl);

    b.box([3.8, 0, 0.1], [4.8, 0.95, 1.05], { top: C.CRATE_INSIDE, lit: C.WOOD.lit, shade: C.WOOD.shade }, 0.04);
    C.SLEEVES.forEach((color, i) => {
        const back = 0.85 - i * 0.145;
        b.flatBox(lift([3.83, 0.9 + i * 0.02, back - 0.2]), lift([4.77, 0.92 + i * 0.02, back]), color);
    });

    // --- Desk, monitor, keyboard, mug ------------------------------------------------------------
    b.box([5.15, 2.25, -0.05], [10.45, 2.55, 2.05], C.WOOD, 0.05);
    b.box([5.25, 0, 1.65], [5.55, 2.25, 1.95], C.WOOD, 0.05);
    b.box([10.05, 0, 1.65], [10.35, 2.25, 1.95], C.WOOD, 0.05);
    b.box([10.05, 0, 0.05], [10.35, 2.25, 0.35], C.WOOD, 0.05);
    b.box([8.55, 0.85, 0.05], [10.05, 2.25, 1.9], C.WOOD, 0.05);
    b.flatBox(lift([8.7, 1.58, 1.85]), lift([9.9, 1.62, 1.862]), C.WOOD_LINE);
    for (const y of [1.95, 1.25]) b.ellipsoid(lift([9.3, y, 1.87]), [0.06, 0.06, 0.03], { lit: C.KNOB, shade: C.KNOB });

    b.cover(() => {
        b.box(lift([5.85, 2.9, 0.45]), lift([8.75, 4.65, 0.71]), C.BEZEL, 0.05);
        b.box(lift([7.07, 2.5, 0.32]), lift([7.53, 2.95, 0.63]), C.STAND, 0.02);
        b.box(lift([6.67, 2.5, 0.22]), lift([7.93, 2.56, 0.98]), C.STAND, 0.02);
    });
    const screenMap = screenTexture();
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.45), new THREE.MeshBasicMaterial({ map: screenMap, transparent: true }));
    screen.position.set(...lift([7.3, 3.775, 0.662], 0.11));
    b.covers.add(screen.material as THREE.Material);
    root.add(screen);

    b.cover(() => {
        b.box(lift([6.27, 2.5, 1.02]), lift([8.33, 2.58, 1.58], 0.08), C.KEYS, 0.03);
        for (const z of [1.22, 1.38]) b.flatBox(lift([6.4, 2.58, z - 0.01], 0.08), lift([8.2, 2.585, z + 0.01], 0.08), C.KEY_LINE);
        b.ellipsoid(lift([8.76, 2.53, 1.29]), [0.14, 0.05, 0.14], { lit: C.KEYS.top, shade: C.KEYS.top });

        b.cylinder(lift([5.8, 2.675, 1.3]), 0.18, 0.35, { top: C.MUG.rim, lit: C.MUG.lit, shade: C.MUG.shade }, 32);
        b.disc(lift([5.8, 2.852, 1.3]), 0.14, C.MUG.coffee);
        const handle = new THREE.TorusGeometry(0.09, 0.025, 8, 16, Math.PI);
        handle.rotateZ(-Math.PI / 2);
        handle.rotateY(Math.PI / 4);
        b.place(handle, b.flat(C.MUG.shade), lift([5.8 + 0.18 * RIGHT[0], 2.7, 1.3 + 0.18 * RIGHT[2]]));
    });

    // --- Round table, bowl -----------------------------------------------------------------------
    const [tx, tz] = [1.93, 5.23];
    const TABLE_TOP = 1.625;
    b.cylinder([tx, 0.0375, tz], 0.45, 0.075, { top: C.WOOD.lit, lit: C.WOOD.shade, shade: C.WOOD.shade }, 40);
    b.cylinder([tx, (0.075 + TABLE_TOP - 0.125) / 2, tz], 0.157, TABLE_TOP - 0.125 - 0.075, C.WOOD, 24);
    b.cylinder([tx, TABLE_TOP - 0.0625, tz], 0.96, 0.125, C.WOOD, 56);

    const bowlProfile = [
        new THREE.Vector2(0, 0),
        new THREE.Vector2(0.2, 0),
        new THREE.Vector2(0.33, 0.07),
        new THREE.Vector2(0.4, 0.18),
        new THREE.Vector2(0.433, 0.35),
    ];
    const RIM = TABLE_TOP + 0.35;
    const onBowl = (u: number, v: number, y: number) => add(add([tx, y, tz], mul(RIGHT, u)), mul(FRONT, v));
    const bowlCenter: Vec3 = [tx, TABLE_TOP + 0.17, tz];
    b.cover(() => {
        b.place(new THREE.LatheGeometry(bowlProfile, 40), b.shaded('split', { lit: C.BOWL.lit, shade: C.BOWL.shade }, bowlCenter), [tx, TABLE_TOP, tz]);
        b.disc([tx, RIM + 0.001, tz], 0.433, C.BOWL.rim);
        const rice = new THREE.SphereGeometry(0.367, 32, 8, 0, Math.PI * 2, 0, Math.PI / 2);
        rice.scale(1, 0.12, 1);
        b.place(rice, b.flat(C.BOWL.rice), [tx, RIM + 0.002, tz]);
        const toppings: [number, number, number][] = [[-0.086, -0.124, 0], [0.149, -0.141, 1], [-0.024, 0.124, 2]];
        toppings.forEach(([u, v, c]) => {
            b.ellipsoid(onBowl(u, v, RIM + 0.05), [0.1, 0.04, 0.08], { lit: C.TOPPINGS[c], shade: C.TOPPINGS[c] });
        });
        for (const [u, v] of [[0.17, 0.106], [-0.2, 0.07], [0.088, -0.247]]) {
            b.ellipsoid(onBowl(u, v, RIM + 0.055), [0.03, 0.02, 0.03], { lit: C.SCALLION, shade: C.SCALLION });
        }
        // Resting side by side near the table's front-left edge, pointing down-right
        for (const [x, z] of [[1.925, 5.85], [2.08, 5.92]]) {
            const stick = new THREE.CylinderGeometry(0.022, 0.022, 0.74, 8);
            stick.rotateZ(Math.PI / 2);
            stick.rotateY(0.124);
            b.place(stick, b.flat(C.CHOPSTICKS), [x, TABLE_TOP + 0.022, z]);
        }
    });

    const steam = [-0.137, 0.027, 0.19].map((u, i) => {
        const curve = new THREE.CatmullRomCurve3(
            [0, 0.2, 0.4, 0.6, 0.8].map((y, k) => new THREE.Vector3(k % 2 ? (k === 1 ? -0.05 : 0.05) : 0, y, 0)),
        );
        const wisp = new THREE.Mesh(
            new THREE.TubeGeometry(curve, 16, 0.027, 6),
            new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0, depthWrite: false }),
        );
        // Over the food glow, as the design paints it
        wisp.renderOrder = 2;
        wisp.position.set(...onBowl(u, 0, RIM + 0.3 + (i === 1 ? 0.05 : 0)));
        faceCamera(wisp);
        root.add(wisp);
        b.owned.push(wisp.material as THREE.Material, wisp.geometry);
        return wisp;
    });

    // --- Rug, cat --------------------------------------------------------------------------------
    const RUG_TOP = 0.125;
    b.cylinder([7.525, RUG_TOP / 2, 5.125], 2.3, RUG_TOP, { top: C.RUG.top, lit: C.RUG.lip, shade: C.RUG.lip }, 128);
    const ring = new THREE.RingGeometry(1.766, 1.826, 128);
    ring.rotateX(-Math.PI / 2);
    b.place(ring, b.flat(C.RUG.ring), [7.525, RUG_TOP + 0.001, 5.125]);

    // The cat is a cut-out of the drawing, centred on its spot on the rug (SVG cat origin, RoomFlat (83.1, 244))
    const cat = createCatCutout(10);
    // Pulled toward the camera, clear of the rug; the projection hides the offset
    cat.root.position.set(...lift([7.3, 0, 4.9], 1));
    faceCamera(cat.root);
    root.add(cat.root);

    // --- Plant -----------------------------------------------------------------------------------
    const [px, pz] = [1.0, 7.4];
    const POT_TOP = 0.95;
    const potProfile = [new THREE.Vector2(0, 0), new THREE.Vector2(0.33, 0), new THREE.Vector2(0.372, 0.04), new THREE.Vector2(0.49, POT_TOP)];
    b.place(new THREE.LatheGeometry(potProfile, 40), b.shaded('split', { lit: C.POT.lit, shade: C.POT.shade }, [px, POT_TOP / 2, pz]), [px, 0, pz]);
    b.cylinder([px, POT_TOP, pz], 0.53, 0.04, { top: C.POT.lipLit, lit: C.POT.lipLit, shade: C.POT.lipShade }, 40);
    b.disc([px, POT_TOP + 0.021, pz], 0.43, C.POT.soil);

    const halfLeaf = (side: 1 | -1) => {
        const s = new THREE.Shape();
        s.moveTo(0, 0);
        s.bezierCurveTo(-0.18 * side, 0.32, -0.18 * side, 0.74, 0, 1);
        s.closePath();
        return new THREE.ShapeGeometry(s, 12);
    };
    const leaves: [number, number][] = [[-50, 1.05], [48, 1.05], [-24, 1.3], [22, 1.25], [-2, 1.5]];
    for (const [deg, size] of leaves) {
        const leaf = new THREE.Group();
        // Pulled toward the camera so the pot rim never hides the leaf bases (invisible in this projection)
        leaf.position.set(...add([px + 0.045, POT_TOP + 0.02, pz + 0.045], mul(ISO_DIRECTION as Vec3, 0.6)));
        faceCamera(leaf);
        leaf.rotateZ((-deg * Math.PI) / 180);
        leaf.scale.setScalar(size * 0.776);
        leaf.add(new THREE.Mesh(halfLeaf(1), b.flat(C.LEAF.lit)), new THREE.Mesh(halfLeaf(-1), b.flat(C.LEAF.shade)));
        root.add(leaf);
        leaf.children.forEach((m) => b.owned.push((m as THREE.Mesh).geometry));
    }

    // --- Glows -----------------------------------------------------------------------------------
    // Flat ellipses on the surface each object sits on (a horizontal circle reads as an ellipse here).
    // Like the design's halos they're painted over everything behind them, walls included, except the
    // things resting on them: those mark the stencil buffer and the glows skip those pixels.
    const GLOWS: Record<InterestId, { center: Vec3; radius: number }> = {
        music: { center: lift([1.93, 1.606, 0.57]), radius: 1.5 },
        games: { center: lift([6.95, 2.506, 0.55]), radius: 1.8 },
        food: { center: [1.825, 1.631, 5.125], radius: 0.82 },
        cats: { center: [7.475, 0.127, 5.075], radius: 1.35 },
    };
    const glowMaterial = () =>
        new THREE.MeshBasicMaterial({
            color: C.GLOW,
            transparent: true,
            opacity: 0.23,
            depthTest: false,
            depthWrite: false,
            stencilWrite: true,
            stencilRef: 1,
            stencilFunc: THREE.NotEqualStencilFunc,
        });
    const glows = {} as Record<InterestId, THREE.Mesh>;
    const rings = {} as Record<InterestId, THREE.Mesh>;
    for (const id of Object.keys(GLOWS) as InterestId[]) {
        const { center, radius } = GLOWS[id];
        const glow = new THREE.Mesh(new THREE.CircleGeometry(radius, 64), glowMaterial());
        glow.rotation.x = -Math.PI / 2;
        glow.position.set(...center);
        glow.renderOrder = 1;
        const ringMesh = new THREE.Mesh(new THREE.RingGeometry(radius * 1.04, radius * 1.04 + 0.05, 72), glowMaterial());
        ringMesh.rotation.x = -Math.PI / 2;
        ringMesh.position.set(center[0], center[1] + 0.001, center[2]);
        (ringMesh.material as THREE.MeshBasicMaterial).opacity = 0;
        ringMesh.renderOrder = 1;
        root.add(glow, ringMesh);
        glows[id] = glow;
        rings[id] = ringMesh;
        b.owned.push(glow.geometry, glow.material as THREE.Material, ringMesh.geometry, ringMesh.material as THREE.Material);
    }

    b.finish();
    for (const material of b.covers) {
        material.stencilWrite = true;
        material.stencilRef = 1;
        material.stencilFunc = THREE.AlwaysStencilFunc;
        material.stencilZPass = THREE.ReplaceStencilOp;
    }
    b.owned.push(screen.geometry, screen.material as THREE.Material, screenMap);
    vinyl.children.forEach((m) => b.owned.push((m as THREE.Mesh).geometry));

    return {
        root,
        glows,
        rings,
        parts: { vinyl, screen, tail: cat.tail, ear: cat.ear, breath: cat.breath, steam },
        windowView,
        dispose: () => {
            windowView.dispose();
            cat.dispose();
            b.owned.forEach((o) => o.dispose());
        },
    };
}
