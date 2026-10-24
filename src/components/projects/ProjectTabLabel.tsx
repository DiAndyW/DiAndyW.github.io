import FeaturedStar from './FeaturedStar';
import type { Project } from './projectsData';

export default function ProjectTabLabel({ project, compact = false }: { project: Project; compact?: boolean }) {
    return (
        <>
            {project.featured && <FeaturedStar />}
            <span className={`relative ${compact ? 'whitespace-nowrap' : 'truncate'}`}>
                {compact ? project.shortTitle ?? project.title : project.title}
            </span>
        </>
    );
}
