import * as THREE from 'three';
import { bindingPoint, bindingProgress, BINDING_TURN_MS } from './bindingMotion';
import { sheetTimings } from './notepadNav';

export type BindingSize = { width: number; height: number; compact: boolean };
export type MovingSheet = { texture: HTMLCanvasElement; delay: number; duration: number };

function shapeFor(width: number, height: number, holes: number[], radius: number) {
    const shape = new THREE.Shape();
    const r = 14;
    shape.moveTo(r, 0); shape.lineTo(width - r, 0); shape.quadraticCurveTo(width, 0, width, r);
    shape.lineTo(width, height - r); shape.quadraticCurveTo(width, height, width - r, height);
    shape.lineTo(r, height); shape.quadraticCurveTo(0, height, 0, height - r);
    shape.lineTo(0, r); shape.quadraticCurveTo(0, 0, r, 0);
    for (const x of holes) {
        const hole = new THREE.Path();
        hole.absellipse(x, radius, 7, 7, 0, Math.PI * 2, true);
        shape.holes.push(hole);
    }
    return shape;
}

export function bindingHoles(width: number, compact: boolean) {
    const inset = compact ? 25 : 46;
    const count = compact ? 12 : Math.max(2, Math.round(width / 41));
    return Array.from({ length: count }, (_, i) => inset + i * (width - 2 * inset) / (count - 1));
}

export function bindingMask(width: number, height: number, compact: boolean): string {
    const y = compact ? 10 : 12;
    const holes = bindingHoles(width, compact).map((x) => `M${x - 7} ${y}a7 7 0 1 0 14 0a7 7 0 1 0 -14 0`).join('');
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><path fill="white" fill-rule="evenodd" d="M0 0H${width}V${height}H0Z${holes}"/></svg>`;
    return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

function bendableGeometry(shape: THREE.Shape, width: number, height: number) {
    let geometry = new THREE.ShapeGeometry(shape, 10).toNonIndexed();
    for (let pass = 0; pass < 3; pass++) {
        const p = geometry.attributes.position.array;
        const next: number[] = [];
        for (let i = 0; i < p.length; i += 9) {
            const a = [p[i], p[i + 1], 0], b = [p[i + 3], p[i + 4], 0], c = [p[i + 6], p[i + 7], 0];
            const ab = a.map((v, k) => (v + b[k]) / 2), bc = b.map((v, k) => (v + c[k]) / 2), ca = c.map((v, k) => (v + a[k]) / 2);
            next.push(...a, ...ab, ...ca, ...ab, ...b, ...bc, ...ca, ...bc, ...c, ...ab, ...bc, ...ca);
        }
        geometry.dispose();
        geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(next, 3));
    }
    const p = geometry.attributes.position.array;
    const uv: number[] = [];
    for (let i = 0; i < p.length; i += 9) {
        // DOM coordinates point down, so reverse winding before mapping them into world space.
        for (let k = 0; k < 3; k++) [p[i + 3 + k], p[i + 6 + k]] = [p[i + 6 + k], p[i + 3 + k]];
    }
    for (let i = 0; i < p.length; i += 3) uv.push(p[i] / width, 1 - p[i + 1] / height);
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    return geometry;
}

export class BindingScene {
    private renderer: THREE.WebGLRenderer;
    private scene = new THREE.Scene();
    private camera: THREE.OrthographicCamera;
    private shape: THREE.Shape;
    private sheets: { group: THREE.Group; geometry: THREE.BufferGeometry; rest: Float32Array; map: THREE.CanvasTexture; timing: { delay: number; duration: number } }[] = [];
    private frame = 0;
    private finish: (() => void) | null = null;
    private radius: number;
    private top: number;
    private disposed = false;

    constructor(private host: HTMLDivElement, private size: BindingSize) {
        const { width, height, compact } = size;
        this.radius = compact ? 10 : 12;
        const extra = height;
        const bounds = host.getBoundingClientRect();
        const margin = Math.max(0, Math.min(width * 0.22, bounds.left, window.innerWidth - bounds.right));
        const canvasWidth = width + 2 * margin, canvasHeight = height * 2 + 24;
        this.top = canvasHeight / 2 - extra;
        this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        this.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
        this.renderer.setClearColor(0, 0);
        this.renderer.setSize(canvasWidth, canvasHeight);
        this.renderer.domElement.style.cssText = `position:absolute;left:${-margin}px;top:${-extra}px;width:${canvasWidth}px;height:${canvasHeight}px;pointer-events:none`;
        host.append(this.renderer.domElement);
        // Parallel projection keeps every coil identical across the flat illustration.
        this.camera = new THREE.OrthographicCamera(-canvasWidth / 2, canvasWidth / 2, canvasHeight / 2, -canvasHeight / 2, 1, 5000);
        this.camera.position.z = 2400;
        const holes = bindingHoles(width, compact);
        this.shape = shapeFor(width, height, holes, this.radius);
        const planeGeometry = new THREE.ShapeGeometry(this.shape, 10);
        const positions = planeGeometry.attributes.position;
        for (let i = 0; i < positions.count; i++) positions.setXYZ(i, positions.getX(i) - width / 2, this.top - positions.getY(i), -1);
        const plane = new THREE.Mesh(planeGeometry, new THREE.MeshBasicMaterial({ colorWrite: false, side: THREE.DoubleSide }));
        plane.renderOrder = -10;
        this.scene.add(plane);
        const ringGeometry = new THREE.TorusGeometry(this.radius, 2.3, 8, 48);
        const colors: number[] = [];
        const ringPositions = ringGeometry.attributes.position;
        for (let i = 0; i < ringPositions.count; i++) {
            const color = new THREE.Color(ringPositions.getZ(i) < 0 ? '#d1d5db' : '#9ca3af');
            colors.push(color.r, color.g, color.b);
        }
        ringGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        const material = new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false });
        for (const x of holes) {
            const ring = new THREE.Mesh(ringGeometry, material);
            // A slight cant keeps the illustrated loop visible under parallel projection.
            // Its lateral extent still fits inside the punched hole.
            ring.rotation.y = Math.PI / 2 - 0.35;
            ring.position.set(x - width / 2, this.top, 0);
            this.scene.add(ring);
        }
        this.render();
    }

    private render() { if (!this.disposed) this.renderer.render(this.scene, this.camera); }

    play(textures: HTMLCanvasElement[], direction: 1 | -1, done: () => void) {
        this.cancel();
        const { width, height } = this.size;
        const timings = sheetTimings(textures.length);
        const scale = BINDING_TURN_MS / 750;
        for (let i = 0; i < textures.length; i++) {
            const geometry = bendableGeometry(this.shape, width, height);
            const map = new THREE.CanvasTexture(textures[i]);
            map.colorSpace = THREE.SRGBColorSpace;
            map.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
            const group = new THREE.Group();
            group.add(new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ map, side: THREE.FrontSide, toneMapped: false })));
            const back = getComputedStyle(this.host).getPropertyValue('--notebook-back').trim() || '#29464a';
            group.add(new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ color: back, side: THREE.BackSide, toneMapped: false })));
            this.scene.add(group);
            this.sheets.push({ group, geometry, rest: (geometry.attributes.position.array as Float32Array).slice(), map, timing: { delay: timings[i].delay * scale, duration: timings[i].duration * scale } });
        }
        this.finish = done;
        const start = performance.now();
        const tick = (now: number) => {
            let running = false;
            this.sheets.forEach((sheet, i) => {
                const elapsed = now - start - sheet.timing.delay;
                const progress = bindingProgress(elapsed, sheet.timing.duration, direction);
                running ||= elapsed < sheet.timing.duration;
                const positions = sheet.geometry.attributes.position;
                // A tiny stack offset preserves riffle ordering at zero rotation.
                const stack = (direction === 1 ? this.sheets.length - i : i + 1) * 0.12;
                for (let v = 0; v < positions.count; v++) {
                    const point = bindingPoint(sheet.rest[v * 3 + 1], height, this.radius, progress);
                    positions.setXYZ(v, sheet.rest[v * 3] - width / 2, this.top + point.y, point.z + stack);
                }
                positions.needsUpdate = true;
                sheet.geometry.computeBoundingSphere();
            });
            this.render();
            if (running) this.frame = requestAnimationFrame(tick);
            else {
                const finish = this.finish;
                this.finish = null;
                // Keep the final sheet visible until React removes the outgoing HTML
                // and its layout-effect cleanup cancels this scene in the same commit.
                finish?.();
            }
        };
        tick(start);
    }

    cancel() {
        cancelAnimationFrame(this.frame);
        this.finish = null;
        for (const sheet of this.sheets) {
            this.scene.remove(sheet.group);
            sheet.geometry.dispose(); sheet.map.dispose();
            for (const mesh of sheet.group.children) (mesh as THREE.Mesh<THREE.BufferGeometry, THREE.Material>).material.dispose();
        }
        this.sheets = [];
        this.render();
    }

    dispose() {
        this.cancel();
        this.disposed = true;
        this.scene.traverse((object) => {
            if (object instanceof THREE.Mesh) { object.geometry.dispose(); (object.material as THREE.Material).dispose(); }
        });
        this.renderer.dispose();
        this.renderer.forceContextLoss();
        this.renderer.domElement.remove();
    }
}
