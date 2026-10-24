export type NavigationMode = 'tabs' | 'list';

export function tabId(page: number): string {
    return `notepad-tab-${page}`;
}

export function navigationTarget(
    key: string,
    index: number,
    count: number,
    mode: NavigationMode,
): number | null {
    if (count === 0) return null;
    if (mode === 'list') {
        if (key === 'Home') return 0;
        if (key === 'End') return count - 1;
    }
    if (key !== 'ArrowUp' && key !== 'ArrowDown') return null;
    const next = index + (key === 'ArrowDown' ? 1 : -1);
    return mode === 'tabs'
        ? (next + count) % count
        : Math.max(0, Math.min(next, count - 1));
}
