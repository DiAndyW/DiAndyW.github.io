import type { Project } from './projectsData.ts';

// How many project tabs hang off the notepad before the rest collapse into a stack.
export const PINNED_COUNT = 5;

// All values are indices into `projects`.
export function splitTabs(
    projects: Pick<Project, 'featured'>[],
    current: number,
): { pinned: number[]; promoted: number | null; rest: number[] } {
    const indices = projects.map((_, i) => i);
    // Featured first, then list order (filter keeps it stable).
    const ordered = [
        ...indices.filter((i) => projects[i].featured),
        ...indices.filter((i) => !projects[i].featured),
    ];
    const pinned = ordered.slice(0, PINNED_COUNT);
    const rest = indices.filter((i) => !pinned.includes(i));
    // The active tab must always be visible, so an unpinned page borrows a slot.
    const promoted = pinned.includes(current) ? null : current;
    return { pinned, promoted, rest };
}
