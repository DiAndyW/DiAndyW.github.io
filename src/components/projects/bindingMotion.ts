export const BINDING_TURN_MS = 1800 / 2.35;

export function bindingProgress(elapsed: number, duration: number, direction: 1 | -1): number {
    const progress = Math.max(0, Math.min(1, elapsed / duration));
    return direction === 1 ? progress : 1 - progress;
}

// The hole row follows the wire circle. Below it, integrate a gently changing tangent
// so the free edge bends without stretching the paper's length.
export function bindingPoint(v: number, height: number, radius: number, progress: number): { y: number; z: number } {
    const angle = progress * Math.PI * 1.5;
    if (v <= radius) return { y: -v * Math.cos(angle), z: v * Math.sin(angle) };
    const bend = 32 * Math.PI / 180 * Math.sin(progress * Math.PI * 2) * Math.sin(progress * Math.PI);
    const length = height - radius;
    const u = (v - radius) / length;
    if (Math.abs(bend) < 1e-8) return { y: -v * Math.cos(angle), z: v * Math.sin(angle) };
    return {
        y: -radius * Math.cos(angle) - length * (Math.sin(angle + bend * u) - Math.sin(angle)) / bend,
        z: radius * Math.sin(angle) + length * (Math.cos(angle) - Math.cos(angle + bend * u)) / bend,
    };
}
