// Globe SVG is viewBox 0 0 100 100; one equirectangular map copy is MAP_W x MAP_H (360° x 180°),
// so the 100-wide globe window shows half the world at a time.
export const MAP_W = 200;
export const MAP_H = 100;

export const LA = { lon: -118.24, lat: 34.05 };

// Where LA comes to rest, in globe units: on the lit left half, slightly left of center.
export const LA_TARGET_X = 38;

export function lonLatToMap(lon: number, lat: number): { x: number; y: number } {
    return {
        x: ((lon + 180) / 360) * MAP_W,
        y: ((90 - lat) / 180) * MAP_H,
    };
}

// translateX for the continent strip that puts `lon` at `targetX`, normalized into (-MAP_W, 0].
export function finalStripOffset(lon: number, targetX: number): number {
    const t = (targetX - lonLatToMap(lon, 0).x) % MAP_W;
    return t > 0 ? t - MAP_W : t;
}

// One full rotation earlier, so the strip moves right (west to east) as it spins into place.
export function spinStartOffset(final: number): number {
    return final - MAP_W;
}
