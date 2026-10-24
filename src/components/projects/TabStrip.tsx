import { useEffect, useRef, type KeyboardEvent } from 'react';
import FeaturedStar from './FeaturedStar';
import { tabId } from './TabRail';
import { TWO_TONE, type Project } from './projectsData';

// Room kept clear at each end of the strip: the left for the first tab's focus ring, the right so the last tab clears the screen edge.
const PAD_LEFT = 4;
const PAD_RIGHT = 16;
const TAB_HEIGHT = 52; // 44 showing below the paper
const ACTIVE_TAB_HEIGHT = 60;

// The single-column index tabs: every project, in a row hanging from the paper's bottom edge.
// The parent positions it; the strip fills that box and scrolls sideways when the tabs don't fit.
// A thin scrollbar shows under the tabs for mouse and trackpad users (the parent leaves room for it); touch hides it.
export default function TabStrip({
    projects,
    page,
    onPick,
}: {
    projects: Project[];
    page: number;
    onPick: (page: number) => void;
}) {
    const pages = projects.map((_, i) => i);
    const stripRef = useRef<HTMLDivElement>(null);
    const refs = useRef<(HTMLButtonElement | null)[]>([]);
    const mounted = useRef(false);

    // Scroll only the strip (never the window) so a tab sits fully inside it
    const reveal = (k: number, smooth: boolean) => {
        const strip = stripRef.current;
        const tab = refs.current[k];
        if (!strip || !tab) return;
        const min = tab.offsetLeft + tab.offsetWidth + PAD_RIGHT - strip.clientWidth;
        const max = tab.offsetLeft - PAD_LEFT;
        const left = Math.min(Math.max(strip.scrollLeft, min), max);
        if (Math.abs(left - strip.scrollLeft) < 1) return;
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        strip.scrollTo({ left, behavior: smooth && !reduce ? 'smooth' : 'auto' });
    };

    // On every page change, and at once on mount (a deep link may open on a far tab)
    useEffect(() => {
        reveal(pages.indexOf(page), mounted.current);
        mounted.current = true;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page]);

    // ↑/↓ move focus between tabs (wrapping); ←/→ change the page, handled by the notepad.
    // Enter/Space activate through the button's own click.
    const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
        if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
        e.preventDefault();
        const at = refs.current.findIndex((el) => el === document.activeElement);
        const from = at === -1 ? pages.indexOf(page) : at;
        const to = (from + (e.key === 'ArrowDown' ? 1 : -1) + pages.length) % pages.length;
        refs.current[to]?.focus({ preventScroll: true });
        reveal(to, true);
    };

    return (
        <div
            ref={stripRef}
            role="tablist"
            aria-label="Jump to"
            aria-orientation="horizontal"
            onKeyDown={onKeyDown}
            className="relative flex h-full snap-x snap-proximity items-start gap-1.5 overflow-x-auto overflow-y-hidden [scrollbar-width:none] pointer-fine:[scrollbar-width:thin] pointer-coarse:[&::-webkit-scrollbar]:hidden"
            style={{ paddingLeft: PAD_LEFT, paddingRight: PAD_RIGHT, scrollPaddingInline: `${PAD_LEFT}px ${PAD_RIGHT}px` }}
        >
            {pages.map((p, k) => {
                const selected = p === page;
                const project = projects[p];
                const { light } = TWO_TONE[project.color];
                return (
                    <button
                        key={p}
                        ref={(el) => {
                            refs.current[k] = el;
                        }}
                        id={tabId(p)}
                        type="button"
                        role="tab"
                        aria-selected={selected}
                        aria-controls="project-panel"
                        tabIndex={selected ? 0 : -1}
                        title={project.title}
                        onClick={() => onPick(p)}
                        className={`relative flex flex-none cursor-pointer snap-start items-center gap-1.5 overflow-hidden rounded-b-[10px] border-0 px-3.5 pt-2 text-[13px] leading-none text-[#1f2937] transition-[filter] duration-150 hover:brightness-[.9] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
                            selected ? 'font-bold' : 'font-semibold'
                        }`}
                        style={{ height: selected ? ACTIVE_TAB_HEIGHT : TAB_HEIGHT, background: light }}
                    >
                        {project.featured && <FeaturedStar />}
                        <span className="relative whitespace-nowrap">{project.shortTitle ?? project.title}</span>
                    </button>
                );
            })}
        </div>
    );
}
