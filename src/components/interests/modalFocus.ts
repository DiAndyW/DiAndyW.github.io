// The fullscreen room stays in place so opening a panel doesn't rebuild the three.js scene.
export function containModalFocus(root: HTMLElement, initialFocus: HTMLElement) {
    const background = new Map<HTMLElement, boolean>();
    for (let branch: HTMLElement = root; branch.parentElement; branch = branch.parentElement) {
        for (const sibling of branch.parentElement.children) {
            if (sibling instanceof HTMLElement && sibling !== branch) {
                background.set(sibling, sibling.inert);
                sibling.inert = true;
            }
        }
    }

    let lastFocus = initialFocus;
    const onFocus = (event: FocusEvent) => {
        if (event.target instanceof HTMLElement && root.contains(event.target)) lastFocus = event.target;
        else (lastFocus.isConnected ? lastFocus : initialFocus).focus({ preventScroll: true });
    };
    const onKey = (event: KeyboardEvent) => {
        if (event.key !== 'Tab' || event.altKey || event.ctrlKey || event.metaKey) return;
        const targets = Array.from(root.querySelectorAll<HTMLElement>('a[href], button, input, select, textarea, [tabindex]'))
            .filter((el) => el.tabIndex >= 0 && !el.matches(':disabled') && !el.closest('[inert]') && el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden');
        const at = targets.indexOf(document.activeElement as HTMLElement);
        const next = event.shiftKey
            ? (at <= 0 ? targets.length - 1 : at - 1)
            : (at + 1) % targets.length;
        event.preventDefault();
        // Reveal offscreen links while keeping Tab independent of browser keyboard preferences.
        (targets[next] ?? initialFocus).focus();
    };
    document.addEventListener('focusin', onFocus);
    root.addEventListener('keydown', onKey);
    if (!root.contains(document.activeElement)) initialFocus.focus({ preventScroll: true });

    return () => {
        document.removeEventListener('focusin', onFocus);
        root.removeEventListener('keydown', onKey);
        for (const [element, inert] of background) element.inert = inert;
    };
}
