import { useRef, type KeyboardEvent } from 'react';
import { navigationTarget, type NavigationMode } from './tabNavigation';

// Focus movement is shared; each layout keeps its own scrolling behavior.
export function useProjectNavigation({
    count,
    activeIndex = -1,
    mode,
    onFocus,
}: {
    count: number;
    activeIndex?: number;
    mode: NavigationMode;
    onFocus?: (index: number, element: HTMLButtonElement) => void;
}) {
    const refs = useRef<(HTMLButtonElement | null)[]>([]);

    const focusAt = (index: number) => {
        const element = refs.current[index];
        if (!element) return;
        element.focus({ preventScroll: true });
        onFocus?.(index, element);
    };

    const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
        const at = refs.current.findIndex((element) => element === document.activeElement);
        const target = navigationTarget(event.key, at === -1 ? activeIndex : at, count, mode);
        if (target === null) return;
        event.preventDefault();
        focusAt(target);
    };

    return { refs, focusAt, onKeyDown };
}
