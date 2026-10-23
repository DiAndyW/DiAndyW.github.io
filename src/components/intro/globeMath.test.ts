import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
    LA,
    SPIN,
    ZOOM,
    latLonToVector,
    rotateX,
    rotateY,
    facingRotation,
    cameraDistance,
    timeline,
    deepZoomFov,
} from './globeMath.ts';

const close = (a: number, b: number, eps = 1e-9) =>
    assert.ok(Math.abs(a - b) <= eps, `${a} not within ${eps} of ${b}`);

test('latLonToVector follows the three.js sphere texture convention', () => {
    const north = latLonToVector(90, 0);
    close(north.y, 1);
    const prime = latLonToVector(0, 0);
    close(Math.hypot(prime.x, prime.y, prime.z), 1);
    const left = latLonToVector(0, -180); // u = 0
    close(left.x, -1);
    close(left.z, 0, 1e-12);
});

test('facingRotation brings LA to face the camera at +Z', () => {
    const v = latLonToVector(LA.lat, LA.lon);
    const { x, y } = facingRotation(v);
    const turned = rotateX(rotateY(v, y), x);
    close(turned.x, 0, 1e-12);
    close(turned.y, 0, 1e-12);
    close(turned.z, 1, 1e-12);
});

test('facingRotation works for any point, including the southern and western hemispheres', () => {
    for (const [lat, lon] of [[-33.9, 151.2], [51.5, -0.1], [0, 179], [-60, -70]]) {
        const v = latLonToVector(lat, lon);
        const { x, y } = facingRotation(v);
        const turned = rotateX(rotateY(v, y), x);
        close(turned.z, 1, 1e-12);
    }
});

test('cameraDistance frames the globe at the given fraction of the shorter side', () => {
    const fov = 35;
    const half = Math.tan((fov / 2) * (Math.PI / 180));
    // landscape: height is the shorter side
    const d = cameraDistance(fov, 16 / 9, 0.6);
    close(2 / (2 * d * half), 0.6, 1e-12);
    // portrait: width is the shorter side
    const p = cameraDistance(fov, 9 / 16, 0.6);
    close(2 / (2 * p * half * (9 / 16)), 0.6, 1e-12);
});

test('timeline uses the tuned spin, pause, zoom and cloud reveal', () => {
    assert.deepEqual(SPIN, { ms: 1500, turns: 0.55, pauseMs: 500 });
    assert.deepEqual(ZOOM, { ms: 1000, cloudsFrom: 0.5, coverAt: 0.9, revealMs: 400 });
    assert.deepEqual(timeline(SPIN, ZOOM), {
        spin: 1500,
        tiltFrom: 600,
        hold: 2000,
        zoom: 3000,
        cloudsFrom: 2500,
        cover: 2900,
        end: 3350,
    });
});

test('deepZoomFov narrows 70x over the zoom and never slows near the end', () => {
    close(deepZoomFov(0, 35), 35);
    close(deepZoomFov(1, 35), 0.5, 1e-12);
    // Zoom speed is the rate the log of the field of view shrinks; it must not drop off as the dive finishes.
    const speed = (p: number) => Math.log(deepZoomFov(p, 35)) - Math.log(deepZoomFov(p + 0.01, 35));
    assert.ok(speed(0.98) >= speed(0.5), 'zoom slows down near the end');
});
