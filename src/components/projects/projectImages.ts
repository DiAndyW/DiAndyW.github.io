export function stepImage(index: number, direction: number, count: number): number {
    return Math.max(0, Math.min(count - 1, index + direction));
}

export function imageAfterSwipe(index: number, count: number, dx: number, dy: number): number {
    if (Math.abs(dx) < 45 || Math.abs(dx) <= Math.abs(dy)) return index;
    return stepImage(index, dx < 0 ? 1 : -1, count);
}
