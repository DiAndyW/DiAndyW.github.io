// Pure math for the 3D globe intro. Kept free of three.js so it can be unit tested with node --test.

export type Vec3 = { x: number; y: number; z: number };

export const LA = { lat: 34.05, lon: -118.24 };

// Tuned in the preview: 1.5s to cover 0.55 of a turn, then rest on LA for 0.5s before zooming in.
export const SPIN = { ms: 1500, turns: 0.55, pauseMs: 500 };

// A 1s dive toward LA. Clouds start halfway down, cover the screen at 90%, then part over 0.4s.
export const ZOOM = { ms: 1000, cloudsFrom: 0.5, coverAt: 0.9, revealMs: 400 };

const DEG = Math.PI / 180;

// Unit vector for a lat/lon, matching how three.js SphereGeometry wraps an equirectangular texture
// (lon -180 at u = 0, north pole at +Y).
export function latLonToVector(lat: number, lon: number): Vec3 {
    const phi = ((lon + 180) / 360) * Math.PI * 2;
    const theta = (90 - lat) * DEG;
    return {
        x: -Math.cos(phi) * Math.sin(theta),
        y: Math.cos(theta),
        z: Math.sin(phi) * Math.sin(theta),
    };
}

// Same rotation matrices three.js applies for Object3D.rotation.y / .x.
export function rotateY(v: Vec3, a: number): Vec3 {
    return { x: v.x * Math.cos(a) + v.z * Math.sin(a), y: v.y, z: -v.x * Math.sin(a) + v.z * Math.cos(a) };
}

export function rotateX(v: Vec3, a: number): Vec3 {
    return { x: v.x, y: v.y * Math.cos(a) - v.z * Math.sin(a), z: v.y * Math.sin(a) + v.z * Math.cos(a) };
}

// Spin about Y (inner group), then tilt about X (outer group), so `v` ends up facing the camera at +Z.
export function facingRotation(v: Vec3): { x: number; y: number } {
    return { y: -Math.atan2(v.x, v.z), x: Math.atan2(v.y, Math.hypot(v.x, v.z)) };
}

// Camera distance at which a unit globe spans `fraction` of the viewport's shorter side.
export function cameraDistance(fovDeg: number, aspect: number, fraction: number): number {
    return 1 / (fraction * Math.tan((fovDeg / 2) * DEG) * Math.min(1, aspect));
}

// After the spin: rest on LA, dive in, fly into the clouds, then part them to reveal the site.
export function timeline(spin: typeof SPIN, zoom: typeof ZOOM) {
    const hold = spin.ms + spin.pauseMs;
    const cover = hold + zoom.coverAt * zoom.ms;
    return {
        spin: spin.ms,
        tiltFrom: spin.ms * 0.4,
        hold,
        zoom: hold + zoom.ms,
        cloudsFrom: hold + zoom.cloudsFrom * zoom.ms,
        cover,
        end: cover + zoom.revealMs + 50,
    };
}

// Field of view for the deep dive at zoom progress p (0-1). Zoom is exponential in field of view, so a
// near-linear curve reads as a steady speed; the slight power only eases the start.
export function deepZoomFov(p: number, baseFov: number): number {
    return baseFov * Math.pow(1 / 70, Math.pow(p, 1.2));
}
