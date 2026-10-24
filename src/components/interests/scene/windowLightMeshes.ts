import * as THREE from 'three';
import type { WindowState } from '../weather';
import type { WeatherFrame } from '../weatherTransition';
import { TABLE, RUG_SURFACE } from './roomSurfaces';
import { projectedGlass, surfaceHeight, SUN, type Surface } from './windowLight';
import { DIRECT_COLORS, DIFFUSE_COLORS } from './windowWeatherPalette';
import { FLOOR, RUG, WOOD } from './palette';

const VERTEX = /* glsl */ `
varying vec2 p;
void main() {
    p = position.xz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;
// Each state returns a complete surface colour, including its unlit base. The incoming
// colour covers outgoing light even when its footprint shrinks or changes to diffuse.
const FRAGMENT = /* glsl */ `
uniform int surface;
uniform float height;
uniform vec3 base;
uniform vec2 tableCenter;
uniform vec2 rugCenter;
uniform float tableRadius;
uniform float bowlRadius;
uniform float bowlHeight;
uniform float tableHeight;
uniform float poleHeight;
uniform float rugRadius;
uniform vec2 rugRing;
uniform vec2 sun0;
uniform vec2 sun1;
uniform vec3 outer0;
uniform vec3 inner0;
uniform vec3 outer1;
uniform vec3 inner1;
uniform float blend;
varying vec2 p;
vec2 screenPoint(vec2 q) { return vec2((q.x-q.y)*34.641, (q.x+q.y)*20.0); }
float capsule(vec2 q, vec2 a, vec2 b) {
    vec2 d = b-a;
    float t = clamp(dot(q-a,d)/max(dot(d,d),0.00001),0.0,1.0);
    return length(q-a-t*d);
}
vec2 projectPoint(vec2 sun, float depth, float z) { return vec2(sun.x*(z-height), depth+sun.y*(z-height)); }
bool shadow(vec2 sun) {
    vec2 q = screenPoint(p);
    if (capsule(q,screenPoint(projectPoint(sun,3.9,2.0)),screenPoint(projectPoint(sun,3.9,4.8))) <= 2.25) return true;
    if (surface != 2 && capsule(q,screenPoint(projectPoint(sun,2.2,3.4)),screenPoint(projectPoint(sun,5.6,3.4))) <= max(3.0,6.0*sun.x)/2.0) return true;
    if (surface == 0) {
        if (length(p-tableCenter-tableHeight*sun) <= tableRadius) return true;
        if (capsule(q,screenPoint(tableCenter),screenPoint(tableCenter+poleHeight*sun)) <= 4.5) return true;
    }
    return surface == 1 && length(p-tableCenter-bowlHeight*sun) <= bowlRadius;
}
// 0 = no light, 1 = outer/direct, 2 = inner diffuse.
int region(vec2 sun) {
    if (sun.x > 0.0) {
        float drop = p.x/sun.x;
        float z = height+drop;
        float depth = p.y-sun.y*drop;
        if (z < 2.0 || z > 4.8 || depth < 2.2 || depth > 5.6 || shadow(sun)) return 0;
        return 1;
    }
    if (surface != 0) return 0;
    if (p.x >= 0.0 && p.x <= 1.1 && p.y >= 2.4+p.x*0.3/1.1 && p.y <= 5.4+p.x*0.3/1.1) return 2;
    if (p.x >= 0.0 && p.x <= 2.0 && p.y >= 2.0+p.x*0.25 && p.y <= 5.8+p.x*0.25) return 1;
    return 0;
}
vec3 swatch(int r, vec3 outerColor, vec3 innerColor) { return r == 0 ? base : (r == 1 ? outerColor : innerColor); }
void main() {
    if (surface == 1 && length(p-tableCenter) > tableRadius) discard;
    if (surface == 2) {
        float r = length(p-rugCenter);
        if (r > rugRadius || (r >= rugRing.x && r <= rugRing.y)) discard;
    }
    int a = region(sun0), b = region(sun1);
    if (a == 0 && b == 0) discard;
    vec3 c = mix(swatch(a,outer0,inner0),swatch(b,outer1,inner1),blend);
    // Swatches mix in display space, like canvas source-over of opaque states.
    gl_FragColor = sRGBTransferEOTF(vec4(c,1.0));
    #include <colorspace_fragment>
}`;

const displayColor = (c: string) => new THREE.Color(c).convertLinearToSRGB();
export function createWindowLight() {
    const root = new THREE.Group();
    const owned: { dispose(): void }[] = [];
    const materials: { surface: Surface; material: THREE.ShaderMaterial }[] = [];
    for (const [id, surface] of (['floor', 'table', 'rug'] as const).entries()) {
        const height = surfaceHeight(surface);
        // Union of both projected beams and diffuse quads. The shader clips each state's
        // exact projected glass polygon and model disc; no SVG-position assumptions.
        const dawn = projectedGlass('dawn', height), day = projectedGlass('day', height);
        const xMax = Math.max(...dawn.map(([x]) => x), ...day.map(([x]) => x), 2);
        const zMax = Math.max(...dawn.map(([, z]) => z), ...day.map(([, z]) => z), 6.3);
        const shape = new THREE.Shape();
        shape.moveTo(0, -2); shape.lineTo(xMax, -2); shape.lineTo(xMax, -zMax); shape.lineTo(0, -zMax); shape.closePath();
        const geometry = new THREE.ShapeGeometry(shape);
        geometry.rotateX(-Math.PI / 2);
        geometry.translate(0, height + 0.002, 0);
        const material = new THREE.ShaderMaterial({
            vertexShader: VERTEX, fragmentShader: FRAGMENT,
            polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1,
            uniforms: {
                surface: { value: id }, height: { value: height },
                base: { value: displayColor(surface === 'floor' ? FLOOR : surface === 'rug' ? RUG.top : WOOD.top) },
                tableCenter: { value: new THREE.Vector2(TABLE.x, TABLE.z) }, rugCenter: { value: new THREE.Vector2(RUG_SURFACE.x, RUG_SURFACE.z) },
                tableRadius: { value: TABLE.radius }, bowlRadius: { value: TABLE.bowlRadius }, bowlHeight: { value: TABLE.bowlHeight },
                tableHeight: { value: TABLE.top }, poleHeight: { value: TABLE.poleTop }, rugRadius: { value: RUG_SURFACE.radius },
                rugRing: { value: new THREE.Vector2(RUG_SURFACE.ringInner, RUG_SURFACE.ringOuter) },
                sun0: { value: new THREE.Vector2() }, sun1: { value: new THREE.Vector2() },
                outer0: { value: new THREE.Color() }, inner0: { value: new THREE.Color() },
                outer1: { value: new THREE.Color() }, inner1: { value: new THREE.Color() }, blend: { value: 1 },
            },
        });
        const mesh = new THREE.Mesh(geometry, material);
        // Opaque depth-tested surfaces render before the existing glow pass; furniture still occludes.
        root.add(mesh);
        materials.push({ surface, material });
        owned.push(geometry, material);
    }
    let previous = '';
    const update = (frame: WeatherFrame) => {
        const key = JSON.stringify([frame.from, frame.to, frame.mix]);
        if (key === previous) return;
        previous = key;
        for (const { surface, material } of materials) {
            const set = (state: WindowState, suffix: string) => {
                const direct = state.weather === 'clear' && (state.time === 'dawn' || state.time === 'day');
                const time = state.time as keyof typeof SUN;
                const sun = direct ? SUN[time] : { s: 0, sy: 0 };
                material.uniforms[`sun${suffix}`].value.set(sun.s, sun.sy);
                const colors = direct ? [DIRECT_COLORS[time][surface], DIRECT_COLORS[time][surface]] : DIFFUSE_COLORS[state.weather][state.time];
                material.uniforms[`outer${suffix}`].value.copy(displayColor(colors[0]));
                material.uniforms[`inner${suffix}`].value.copy(displayColor(colors[1]));
            };
            set(frame.from, '0'); set(frame.to, '1');
            material.uniforms.blend.value = frame.mix;
        }
    };
    return { root, update, dispose: () => owned.forEach((o) => o.dispose()) };
}
export type WindowLight = ReturnType<typeof createWindowLight>;
