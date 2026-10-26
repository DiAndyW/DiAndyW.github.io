import { useId, useState, type Ref } from 'react';
import Image from 'next/image';
import ProjectImageViewer from './ProjectImageViewer';
import TechList from '../TechList';
import Sticker from './stickers/Sticker';
import type { Project } from './projectsData';
import { PAGE_PAD_X, ART_SPLIT, ART_GAP } from './notepadGeometry';

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
    const [imageIndex, setImageIndex] = useState<number | null>(null);
    const viewer = imageIndex !== null && project.images?.length ? (
        <ProjectImageViewer project={project} initialIndex={imageIndex} onClose={() => setImageIndex(null)} />
    ) : null;
    const instanceId = useId();
    const titleId = `project-title-${project.slug}-${instanceId}`;

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
                <p className="m-0 truncate text-[13px] leading-[18px] text-[color:var(--notebook-secondary)]">{project.org}</p>
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
                        {project.images?.length ? (
                            <button
                                type="button"
                                aria-label={`View ${project.title} screenshots`}
                                aria-haspopup="dialog"
                                onPointerDown={(event) => event.stopPropagation()}
                                onClick={() => setImageIndex(0)}
                                className="relative block cursor-pointer border-0 bg-transparent p-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#7bb3d1]"
                            >
                                <Sticker project={project} index={index} width={92} />
                                <span aria-hidden="true" className="absolute -bottom-1 -right-1 grid size-6 place-items-center rounded-full border border-[var(--notebook-accent)] bg-[var(--notebook-paper)] text-[color:var(--notebook-accent)]">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-3.5"><rect x="3" y="3" width="18" height="18" rx="3" /><circle cx="8" cy="8" r="1.5" /><path d="m3 17 6-6 4 4 3-3 5 5" /></svg>
                                </span>
                            </button>
                        ) : <Sticker project={project} index={index} width={92} />}
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
                    <li key={b} className="flex gap-2.5 text-[13.5px] leading-[1.45] text-[color:var(--notebook-ink)]">
                        <span aria-hidden="true" className="mt-1.5 size-2 shrink-0 rounded-full bg-current" />
                        <span>{b}</span>
                    </li>
                ))}
            </ul>
            <div role="group" aria-label="Built with">
                <TechList technologies={project.tech} className="text-xs sm:text-[13px] text-[color:var(--notebook-secondary)]" />
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
                    style={{ color: 'var(--notebook-accent)' }}
                >
                    {project.link.label}
                </a>
            ) : (
                <span className="text-[13px] text-[color:var(--notebook-secondary)]">{project.status}</span>
            )}
        </div>
    );

    if (compact) {
        return (
            <article
                aria-labelledby={titleId}
                className="flex h-full min-h-0 flex-col gap-3 px-5 pb-3.5 pt-[18px] text-[color:var(--notebook-ink)]"
            >
                {body}
                {footer}
                {viewer}
            </article>
        );
    }

    return (
        <article
            aria-labelledby={titleId}
            className="flex h-full min-h-0 pb-4 pt-5 text-[color:var(--notebook-ink)]"
            style={{ paddingInline: PAGE_PAD_X, gap: ART_GAP }}
        >
            {/* sticker column: a share of the page, sticker sized to fit it (at most 240px wide), level with the title */}
            <div
                className="flex min-h-0 shrink-0 flex-col items-center gap-6 overflow-y-auto px-1 pb-2 pt-1"
                style={{ width: `calc((100% - ${ART_GAP}px) * ${ART_SPLIT})` }}
            >
                <div className="shrink-0"><Sticker project={project} index={index} width={project.images?.length ? Math.min(160, stickerWidth) : stickerWidth} /></div>
                {project.images?.map((image, imageIndex) => (
                    <button
                        key={image.src}
                        type="button"
                        aria-label={`Enlarge ${project.title} screenshot ${imageIndex + 1}`}
                        aria-haspopup="dialog"
                        onClick={() => setImageIndex(imageIndex)}
                        className="relative w-full max-w-[222px] shrink-0 cursor-pointer border-0 bg-[#ded9cf] p-1.5 shadow-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#7bb3d1]"
                    >
                        <span aria-hidden="true" className="absolute -top-2 left-1/2 z-10 h-5 w-12 -translate-x-1/2 rotate-[7deg] bg-[#d9cdb0]/75" />
                        <Image unoptimized src={image.src} alt={image.alt} width={image.width} height={image.height} sizes="222px" className="mx-auto block h-auto max-h-[270px] w-auto max-w-full" />
                    </button>
                ))}
            </div>
            <div className="flex min-w-0 flex-1 flex-col">
                {body}
                {footer}
            </div>
            {viewer}
        </article>
    );
}
