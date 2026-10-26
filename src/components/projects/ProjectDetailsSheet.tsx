'use client';

import { useState } from 'react';
import Image from 'next/image';
import DetailsSheet from '../DetailsSheet';
import TechList from '../TechList';
import ProjectImageViewer from './ProjectImageViewer';
import type { Project } from './projectsData';

export default function ProjectDetailsSheet({ project, onClose }: { project: Project; onClose: () => void }) {
    const [imageIndex, setImageIndex] = useState<number | null>(null);
    return (
        <DetailsSheet title={project.title} subtitle={project.org} closeLabel="Close project details" onClose={onClose}>
            <p className="mb-5 text-sm leading-relaxed">{project.description}</p>
            <ul className="mb-6 flex list-none flex-col gap-3 p-0">
                {project.bullets.map((bullet) => (
                    <li key={bullet} className="flex gap-3 text-xs leading-relaxed text-[color:var(--notebook-secondary)]">
                        <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-current" />
                        <span>{bullet}</span>
                    </li>
                ))}
            </ul>
            <TechList technologies={project.tech} className="mb-6 text-xs text-[color:var(--notebook-secondary)]" />
            {project.images?.map((image, index) => (
                <button key={image.src} type="button" aria-label={`Enlarge ${project.title} screenshot ${index + 1}`} aria-haspopup="dialog" onClick={() => setImageIndex(index)} className="mx-auto mb-6 block w-fit max-w-full cursor-pointer bg-[#ded9cf] p-1.5 shadow-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--notebook-accent)]">
                    <Image unoptimized src={image.src} alt={image.alt} width={image.width} height={image.height} sizes="180px" className="mx-auto block h-auto max-h-[220px] w-auto max-w-full object-contain" />
                </button>
            ))}
            {project.link ? <a href={project.link.href} target="_blank" rel="noopener noreferrer" className="inline-block py-2 text-xs text-[color:var(--notebook-accent)] underline underline-offset-4">{project.link.label}</a> : <p className="text-xs text-[color:var(--notebook-secondary)]">{project.status}</p>}
            {imageIndex !== null && project.images?.length ? <ProjectImageViewer project={project} initialIndex={imageIndex} onClose={() => setImageIndex(null)} /> : null}
        </DetailsSheet>
    );
}
