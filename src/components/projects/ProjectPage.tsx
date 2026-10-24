import type { Ref } from 'react';
import TechList from '../TechList';
import Sticker from './stickers/Sticker';
import type { Project } from './projectsData';

// Desktop page geometry: side padding, and the sticker column's share of the width inside it.
const PAGE_PAD_X = 24;
const ART_SPLIT = 0.36;
const ART_GAP = 32;

// The widest sticker that fits the sticker column of a desktop page `pageWidth` wide.
// Leaves a few pixels for the tilt and the lift; never wider than 240.
export function desktopStickerWidth(pageWidth: number): number {
    const column = (pageWidth - 2 * PAGE_PAD_X - ART_GAP) * ART_SPLIT;
    return Math.max(0, Math.min(240, Math.floor(column - 8)));
}

export default function ProjectPage({
    project,
    index,
    compact,
    titleRef,
    stickerWidth = 240,
}: {
    project: Project;
    index: number;
    compact: boolean;
    titleRef?: Ref<HTMLHeadingElement>;
    // Desktop only: use desktopStickerWidth() so the sticker fits its column.
    stickerWidth?: number;
}) {
    const titleId = `project-title-${project.slug}`;

    const heading = (
        <div className={`flex min-w-0 flex-col gap-0.5 ${compact ? 'flex-1' : ''}`}>
            <h3
                id={titleId}
                ref={titleRef}
                tabIndex={-1}
                className={`m-0 line-clamp-2 font-bold leading-[1.25] tracking-[-.015em] outline-none ${
                    compact ? 'text-[21px]' : 'text-2xl'
                }`}
            >
                {project.title}
            </h3>
            {project.org && (
                <p className="m-0 truncate text-[13px] leading-[18px] text-[#9ca3af]">{project.org}</p>
            )}
        </div>
    );

    // Everything that can grow sits in the scrolling body; the footer row stays put beneath it.
    const body = (
        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto">
            {compact ? (
                <div className="flex items-center gap-3.5">
                    {heading}
                    <div className="shrink-0 py-1 pr-1.5">
                        <Sticker project={project} index={index} width={92} />
                    </div>
                </div>
            ) : (
                heading
            )}
            <p className={`m-0 leading-normal ${compact ? 'text-sm' : 'text-[15px]'}`}>
                {project.description}
            </p>
            <ul className="m-0 flex list-none flex-col gap-2 p-0">
                {project.bullets.map((b) => (
                    <li key={b} className="flex gap-2.5 text-[13.5px] leading-[1.45] text-[#d1d5db]">
                        <span aria-hidden="true" className="mt-1.5 size-2 shrink-0 rounded-full bg-current" />
                        <span>{b}</span>
                    </li>
                ))}
            </ul>
            <div role="group" aria-label="Built with">
                <TechList technologies={project.tech} className="text-xs sm:text-[13px] text-gray-400" />
            </div>
        </div>
    );

    const footer = (
        <div className="mt-auto flex h-7 shrink-0 items-center pt-3">
            {project.link ? (
                <a
                    href={project.link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-semibold text-[#7bb3d1] no-underline"
                >
                    {project.link.label}
                </a>
            ) : (
                <span className="text-[13px] text-[#9ca3af]">{project.status}</span>
            )}
        </div>
    );

    if (compact) {
        return (
            <article
                aria-labelledby={titleId}
                className="flex h-full min-h-0 flex-col gap-3 px-5 pb-3.5 pt-[18px] text-white"
            >
                {body}
                {footer}
            </article>
        );
    }

    return (
        <article
            aria-labelledby={titleId}
            className="flex h-full min-h-0 pb-4 pt-5 text-white"
            style={{ paddingInline: PAGE_PAD_X, gap: ART_GAP }}
        >
            {/* sticker column: a share of the page, sticker sized to fit it (at most 240px wide), level with the title */}
            <div
                className="flex shrink-0 items-start justify-center pt-1"
                style={{ width: `calc((100% - ${ART_GAP}px) * ${ART_SPLIT})` }}
            >
                <Sticker project={project} index={index} width={stickerWidth} />
            </div>
            <div className="flex min-w-0 flex-1 flex-col">
                {body}
                {footer}
            </div>
        </article>
    );
}
