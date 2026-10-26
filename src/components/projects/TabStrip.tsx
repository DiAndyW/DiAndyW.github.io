import { useEffect } from 'react';
import ProjectTabLabel from './ProjectTabLabel';
import { useProjectNavigation } from './useProjectNavigation';
import { tabId } from './tabNavigation';
import type { Project } from './projectsData';

// Narrow side tabs keep every project accessible without adding height on phones.
export default function TabStrip({ projects, page, onPick }: {
    projects: Project[];
    page: number;
    onPick: (page: number) => void;
}) {
    const { refs, onKeyDown } = useProjectNavigation({ count: projects.length, activeIndex: page, mode: 'tabs' });

    useEffect(() => {
        const tab = refs.current[page];
        const parent = tab?.parentElement;
        if (!tab || !parent) return;
        if (tab.offsetTop < parent.scrollTop) parent.scrollTop = tab.offsetTop;
        else if (tab.offsetTop + tab.offsetHeight > parent.scrollTop + parent.clientHeight)
            parent.scrollTop = tab.offsetTop + tab.offsetHeight - parent.clientHeight;
    }, [page, refs]);

    return (
        <div role="tablist" aria-label="Jump to" aria-orientation="vertical" onKeyDown={onKeyDown}
            className="flex h-full flex-col gap-1.5 overflow-y-auto overflow-x-hidden py-1 pr-1 [scrollbar-width:none]">
            {projects.map((project, index) => (
                <button
                    key={project.slug}
                    ref={(element) => { refs.current[index] = element; }}
                    id={tabId(index)}
                    type="button"
                    role="tab"
                    aria-selected={index === page}
                    aria-controls="project-panel"
                    tabIndex={index === page ? 0 : -1}
                    title={project.title}
                    onFocus={(event) => {
                        const parent = event.currentTarget.parentElement!;
                        const tab = event.currentTarget;
                        if (tab.offsetTop < parent.scrollTop) parent.scrollTop = tab.offsetTop;
                        else if (tab.offsetTop + tab.offsetHeight > parent.scrollTop + parent.clientHeight)
                            parent.scrollTop = tab.offsetTop + tab.offsetHeight - parent.clientHeight;
                    }}
                    onClick={() => onPick(index)}
                    className={`relative flex min-h-11 w-full shrink-0 cursor-pointer items-center justify-center gap-1 overflow-hidden rounded-r-lg border-0 py-2 pl-2 pr-1 text-xs leading-none text-[#1f2937] [writing-mode:vertical-rl] hover:brightness-90 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#1f2937] ${index === page ? 'font-bold' : 'font-semibold'}`}
                    style={{ height: 108, background: `var(--notebook-tab-${index % 5})` }}
                >
                    <ProjectTabLabel project={project} compact />
                </button>
            ))}
        </div>
    );
}
