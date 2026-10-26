'use client';

import { useEffect, useLayoutEffect, useId, useRef, type PointerEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { dismissProjectSheet } from './projects/projectSheet';
import { notebookPaletteVariables } from './projects/notepadPalette';

const SHEET_MS = 300;
const SHEET_EASE = 'cubic-bezier(.2,.8,.2,1)';

export default function DetailsSheet({ title, titleAction, subtitle, children, closeLabel = 'Close details', theme = 'notebook', dismissAtWidth, onClose }: {
    title: string;
    titleAction?: ReactNode;
    subtitle?: ReactNode;
    children: ReactNode;
    closeLabel?: string;
    theme?: 'notebook' | 'experience';
    dismissAtWidth?: number;
    onClose: () => void;
}) {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const sheetRef = useRef<HTMLElement>(null);
    const backdropRef = useRef<HTMLDivElement>(null);
    const animations = useRef<Animation[]>([]);
    const reducedMotion = useRef(false);
    const closing = useRef(false);
    const handleMoved = useRef(false);
    const mounted = useRef(false);
    const drag = useRef<{ id: number; x: number; y: number; time: number } | null>(null);
    const titleId = useId();

    useLayoutEffect(() => {
        const dialog = dialogRef.current!;
        const trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        const overflow = document.documentElement.style.overflow;
        const query = window.matchMedia('(prefers-reduced-motion: reduce)');
        const update = () => {
            reducedMotion.current = query.matches;
            if (query.matches) animations.current.forEach((animation) => animation.cancel());
        };
        update();
        query.addEventListener('change', update);
        mounted.current = true;
        // The portal sits outside the notebook, so carry its selected palette with it.
        const defaults = notebookPaletteVariables(4);
        for (const [key, value] of Object.entries(defaults)) dialog.style.setProperty(key, value);
        if (trigger) {
            const palette = getComputedStyle(trigger);
            for (const token of ['paper', 'rule', 'border', 'ink', 'secondary', 'accent']) {
                const value = palette.getPropertyValue(`--notebook-${token}`).trim();
                if (value) dialog.style.setProperty(`--notebook-${token}`, value);
            }
        }
        const experienceColors: Record<string, string> = {
            paper: '#1a2432', border: 'rgba(255, 255, 255, .3)',
            ink: '#f3f4f6', secondary: '#d1d5db', accent: '#7bb3d1',
        };
        for (const token of ['paper', 'border', 'ink', 'secondary', 'accent']) {
            const color = theme === 'experience' ? experienceColors[token] : dialog.style.getPropertyValue(`--notebook-${token}`);
            dialog.style.setProperty(`--sheet-${token}`, color);
        }
        // Lock before native dialog focus/layout can change the mobile viewport.
        document.documentElement.style.overflow = 'hidden';
        dialog.showModal();
        // Let the top layer commit while transparent. Native showModal() focuses
        // and lays out synchronously, before an imperative animation is attached.
        // Opacity preserves that focus; visibility:hidden would suppress it.
        let entranceFrame = requestAnimationFrame(() => {
            entranceFrame = requestAnimationFrame(() => {
                if (!mounted.current || closing.current) return;
                if (!reducedMotion.current) {
                    animations.current = [
                        sheetRef.current!.animate([{ transform: 'translateY(100%)' }, { transform: 'translateY(0)' }], { duration: SHEET_MS, easing: SHEET_EASE, fill: 'backwards' }),
                        backdropRef.current!.animate([{ opacity: 0 }, { opacity: 1 }], { duration: SHEET_MS, fill: 'backwards' }),
                    ];
                }
                dialog.style.opacity = '1';
            });
        });
        return () => {
            mounted.current = false;
            cancelAnimationFrame(entranceFrame);
            animations.current.forEach((animation) => animation.cancel());
            query.removeEventListener('change', update);
            dialog.style.opacity = '0';
            dialog.close();
            document.documentElement.style.overflow = overflow;
            if (trigger?.isConnected) trigger.focus({ preventScroll: true });
        };
    }, []);

    const close = () => {
        if (closing.current) return;
        closing.current = true;
        const sheet = sheetRef.current!;
        const from = getComputedStyle(sheet).transform;
        animations.current.forEach((animation) => animation.cancel());
        if (reducedMotion.current) {
            onClose();
            return;
        }
        animations.current = [
            sheet.animate([{ transform: from }, { transform: 'translateY(100%)' }], { duration: SHEET_MS, easing: SHEET_EASE, fill: 'forwards' }),
            backdropRef.current!.animate([{ opacity: 1 }, { opacity: 0 }], { duration: SHEET_MS, fill: 'forwards' }),
        ];
        Promise.all(animations.current.map((animation) => animation.finished.catch(() => {}))).then(() => {
            if (mounted.current) onClose();
        });
    };

    const resetDrag = () => {
        drag.current = null;
        const sheet = sheetRef.current!;
        const from = sheet.style.transform || 'translateY(0)';
        sheet.style.transform = '';
        if (!reducedMotion.current) animations.current = [sheet.animate([{ transform: from }, { transform: 'translateY(0)' }], { duration: 180, easing: SHEET_EASE })];
    };

    const onHeaderDown = (event: PointerEvent<HTMLElement>) => {
        if (!event.isPrimary || event.button !== 0 || closing.current || (event.target as HTMLElement).closest('button:not([data-sheet-handle]), a')) return;
        animations.current.forEach((animation) => animation.cancel());
        handleMoved.current = false;
        drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY, time: event.timeStamp };
        const handle = (event.target as HTMLElement).closest<HTMLElement>('[data-sheet-handle]');
        (handle ?? event.currentTarget).setPointerCapture(event.pointerId);
    };

    const onHeaderMove = (event: PointerEvent<HTMLElement>) => {
        const start = drag.current;
        if (!start || event.pointerId !== start.id) return;
        if (Math.abs(event.clientY - start.y) > 8 || Math.abs(event.clientX - start.x) > 8) handleMoved.current = true;
        if (!reducedMotion.current) sheetRef.current!.style.transform = `translateY(${Math.max(0, event.clientY - start.y)}px)`;
    };

    const onHeaderUp = (event: PointerEvent<HTMLElement>) => {
        const start = drag.current;
        if (!start || event.pointerId !== start.id) return;
        drag.current = null;
        if (dismissProjectSheet(event.clientX - start.x, event.clientY - start.y, event.timeStamp - start.time)) close();
        else resetDrag();
    };

    useEffect(() => {
        if (!dismissAtWidth) return;
        const query = window.matchMedia(`(min-width: ${dismissAtWidth}px)`);
        const update = () => { if (query.matches) onClose(); };
        update();
        query.addEventListener('change', update);
        return () => query.removeEventListener('change', update);
    }, [dismissAtWidth, onClose]);

    return createPortal(
        <dialog
            ref={dialogRef}
            style={{ opacity: 0 }}
            aria-labelledby={titleId}
            onCancel={(event) => {
                if (event.target !== event.currentTarget) return;
                event.preventDefault();
                close();
            }}
            onClick={(event) => event.stopPropagation()}
            onPointerDown={(event) => event.stopPropagation()}
            onPointerMove={(event) => event.stopPropagation()}
            onPointerUp={(event) => event.stopPropagation()}
            onKeyDown={(event) => {
                event.stopPropagation();
                if (event.key === 'Tab') {
                    dialogRef.current?.querySelector('[data-sheet-handle]')?.removeAttribute('data-initial-focus');
                }
            }}
            className="fixed inset-0 m-0 h-dvh max-h-none w-screen max-w-none overflow-hidden border-0 bg-transparent p-0 text-gray-100 outline-none backdrop:bg-transparent"
        >
            <div ref={backdropRef} aria-hidden="true" onClick={close} className="absolute inset-0 bg-[#111827]/70" />
            {/* A stationary opaque edge lets Safari sample paper behind its toolbar during the slide. */}
            <div aria-hidden="true" data-sheet-edge className="pointer-events-none fixed inset-x-0 bottom-0 mx-auto h-[max(16px,env(safe-area-inset-bottom))] max-w-xl bg-[var(--sheet-paper)]" />
            <section ref={sheetRef} className="absolute inset-x-0 bottom-0 mx-auto flex min-h-[60dvh] max-h-[80dvh] max-w-xl flex-col overflow-hidden rounded-t-2xl border-x border-t border-[var(--sheet-border)] bg-[var(--sheet-paper)] text-[color:var(--sheet-ink)] shadow-xl">
                <header
                    onPointerDown={onHeaderDown}
                    onPointerMove={onHeaderMove}
                    onPointerUp={onHeaderUp}
                    onPointerCancel={resetDrag}
                    className="shrink-0 touch-none select-none px-6 pb-4 pt-3"
                >
                    <button type="button" data-sheet-handle data-initial-focus="" autoFocus aria-label={closeLabel} onClick={() => { if (!handleMoved.current) close(); }} className="mx-auto -mt-3 mb-1 flex h-11 w-20 cursor-pointer items-center justify-center rounded focus-visible:outline-2 focus-visible:outline-[var(--sheet-accent)] data-[initial-focus]:focus-visible:outline-none"><span aria-hidden="true" className="h-1 w-10 rounded-full bg-[var(--sheet-secondary)]" /></button>
                    <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 pt-1">
                            <div className="flex min-w-0 items-center gap-2">
                                <h2 id={titleId} className="min-w-0 text-xl font-bold leading-tight">{title}</h2>
                                {titleAction}
                            </div>
                            {subtitle && <div className="mt-1 text-xs text-[color:var(--sheet-secondary)]">{subtitle}</div>}
                        </div>
                    </div>
                </header>
                <div className="flex min-h-0 flex-auto flex-col touch-pan-y overflow-y-auto overscroll-contain">
                    <div className="flow-root grow shrink-0 px-6 text-[color:var(--sheet-secondary)] pb-[max(24px,env(safe-area-inset-bottom))]" style={theme === 'notebook' ? { backgroundImage: 'linear-gradient(var(--notebook-rule) 1px, transparent 1px)', backgroundSize: '100% 24px' } : undefined}>
                        {children}
                    </div>
                </div>
            </section>
        </dialog>,
        document.body,
    );
}
