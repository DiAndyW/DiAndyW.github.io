import ProjectTabLabel from './ProjectTabLabel';
import { useProjectNavigation } from './useProjectNavigation';
import { tabId } from './tabNavigation';
import MoreStack from './MoreStack';
import { splitTabs } from './pinnedProjects';
import type { Project } from './projectsData';
import { TAB_TUCK, TAB_WIDTH, ACTIVE_TAB_WIDTH } from './notepadGeometry';

export { TAB_TUCK } from './notepadGeometry';

// The desktop index tabs: the pinned projects, then the current project if it isn't pinned.
// Rendered behind the paper, so only the part past its right edge shows.
export default function TabRail({
    projects,
    page,
    onPick,
}: {
    projects: Project[];
    page: number;
    onPick: (page: number) => void;
}) {
    const { pinned, promoted, rest } = splitTabs(projects, page);
    const pages = [...pinned, ...(promoted === null ? [] : [promoted])];
    // ↑/↓ wrap focus; Enter/Space activate through the button's own click.
    const { refs, onKeyDown } = useProjectNavigation({
        count: pages.length,
        activeIndex: pages.indexOf(page),
        mode: 'tabs',
    });

    return (
        <>
            <div
                role="tablist"
                aria-label="Jump to"
                aria-orientation="vertical"
                onKeyDown={onKeyDown}
                className="flex flex-col gap-1.5"
            >
                {pages.map((p, k) => {
                    const selected = p === page;
                    const project = projects[p];
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
                            className={`relative flex h-11 cursor-pointer items-center gap-1.5 overflow-hidden rounded-r-[10px] border-0 pr-3 text-left text-xs font-semibold leading-none text-[#1f2937] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white motion-safe:transition-[translate,width] motion-safe:duration-150 motion-reduce:transition-[filter] motion-reduce:duration-150 ${
                                // The open page's tab already sticks out: only the others answer a hover
                                selected ? '' : 'motion-safe:hover:translate-x-1.5 motion-safe:focus-visible:translate-x-1.5 motion-reduce:hover:brightness-[.85]'
                            }`}
                            style={{
                                width: selected ? ACTIVE_TAB_WIDTH : TAB_WIDTH,
                                paddingLeft: TAB_TUCK + 12,
                                background: `var(--notebook-tab-${p % 5})`,
                            }}
                        >
                            <ProjectTabLabel project={project} />
                        </button>
                    );
                })}
            </div>
            {rest.length > 0 && <MoreStack projects={projects} rest={rest} page={page} onPick={onPick} />}
        </>
    );
}
