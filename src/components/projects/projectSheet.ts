// Only header drags reach this decision; scrolling the body never dismisses the sheet.
export function dismissProjectSheet(dx: number, dy: number, elapsedMs: number): boolean {
    if (dy < 16 || dy <= Math.abs(dx)) return false;
    return dy >= 96 || dy / Math.max(1, elapsedMs) > 0.6;
}
