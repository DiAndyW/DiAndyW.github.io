'use client';

import React, { useRef, useState } from 'react';
import TechList from './TechList';

// Matches the pop-up's fade/scale transition
const DIALOG_MS = 300;

const ProjectSection = () => {
    const [openItem, setOpenItem] = useState<number | null>(null);
    const [shown, setShown] = useState(false);
    const dialogRef = useRef<HTMLDialogElement>(null);
    const closeTimer = useRef(0);

    const Content: {
        id: number;
        title: string;
        organization?: string;
        technologies: string[];
        description: string;
        link?: string;
        featured: boolean;
        points: string[];
    }[] = [
        {
            id: 1,
            title: "Mosaic",
            technologies: ['Swift', 'SwiftUI', 'TypeScript', 'Express.js', 'Python', 'FastAPI', 'Supabase'],
            description: "Designed, built, and shipped a native SwiftUI iOS app where friend groups take on weekly photo challenges that contribute to a shared photo mosaic",
            featured: true,
            points: [
                "Built an Express REST API backed by Supabase, handling authentication, request validation, and per-group tenant isolation while powering the weekly challenge flow, social feed, and push notifications",
                "Designed a FastAPI image-processing microservice, orchestrated by the Express backend, that builds the photomosaic by partitioning target images into tiles and matching photos using visual similarity metrics"
            ]
        },
        {
            id: 2,
            title: "True Talent",
            organization: "LAHacks 2025",
            technologies: ['React', 'Node.js', 'Python', 'Flask'],
            description: "Created a code-interview website that helps detect cheating using AI, allowing companies to find the truly talented",
            link: "https://devpost.com/software/realcoder",
            featured: true,
            points: [
                "Made a responsive website using React, Node.js, and WebSockets, allowing for real time interviews",
                "Used Google Gemini to analyze video, audio, and code for suspicious behavior, providing helpful feedback and follow-up questions for interviewers"
            ]
        },
        {
            id: 3,
            title: "Morii",
            technologies: ['Swift', 'Express.js', 'Node.js', 'MongoDB'],
            description: "Collaborated on a social media app designed to promote emotional awareness and authentic self-expression",
            link: "https://apps.apple.com/us/app/morii-moments-that-stay/id6746750544",
            featured: false,
            points: [
                "Implemented core frontend features using Swift, including a sign-in flow, custom nav bar, homepage, and user profiles",
                "Wrote and tested RESTful API endpoints that returned mood summaries and analytics over customizable time frames"
            ]
        },
        {
            id: 4,
            title: "Bloon Tower Defense Training Camp",
            technologies: ['Three.js', 'Blender'],
            description: "Created a 3D first-person shooter aim trainer inspired by Balloon Towers Defense and Aim Labs.",
            link: "https://diandyw.github.io/BTDTrainingCamp/",
            featured: false,
            points: [
                "Overhauled balloon movement and added settings, allowing for more customizable gameplay",
                "Created custom assets for various objects in game, improving game quality and completeness",
            ]
        },
        {
            id: 5,
            title: "Temple of Doom",
            technologies: ['C++'],
            description: "Designed and developed a 2D dungeon-style game using C++ inspired by classic arcade games",
            featured: false,
            points: [
                "Optimized recursive algorithms for enemy movement, improving processing times by 70% for a smoother experience",
                "Implemented real-time map rendering and random map generation, enhancing gameplay variability",
            ]
        },
    ]

    const featured = Content.filter((item) => item.featured);
    const more = Content.filter((item) => !item.featured);
    // Stays set while the pop-up fades out, so its content doesn't vanish mid-transition
    const active = Content.find((item) => item.id === openItem);

    // Native <dialog> gives us the focus trap, Esc, and focus return to the clicked card
    const openDetails = (id: number) => {
        window.clearTimeout(closeTimer.current);
        setOpenItem(id);
        if (!dialogRef.current?.open) dialogRef.current?.showModal();
        document.documentElement.style.overflow = 'hidden';
        requestAnimationFrame(() => setShown(true));
    };

    const closeDetails = () => {
        setShown(false);
        closeTimer.current = window.setTimeout(() => {
            dialogRef.current?.close();
            document.documentElement.style.overflow = '';
        }, DIALOG_MS);
    };

    const cardClass =
        'w-full h-full text-left bg-[#2d4a57]/20 hover:bg-[#7bb3d1]/20 border-2 border-white/30 hover:border-[#7bb3d1] rounded-lg transition-colors duration-300 cursor-pointer';
    const labelClass = 'text-[#7bb3d1] text-xs uppercase tracking-widest font-bold mb-2';

    return (
        <div className="flex items-center">
        <div className="mt-8 font-normal w-full">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl p-2 sm:p-4 mb-2 sm:mb-4">
                Projects
            </h1>

            <div className="px-2 sm:px-4">
                {/* Featured projects: grid rows stretch, so the pair always matches in height */}
                <div className={labelClass}>Featured</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {featured.map((item) => (
                        <button
                            key={item.id}
                            type="button"
                            onClick={() => openDetails(item.id)}
                            className={`${cardClass} p-3 sm:p-4`}
                        >
                            <h3 className="font-bold text-lg sm:text-xl text-white">{item.title}</h3>
                            {item.organization && (
                                <h4 className="font-semibold text-[#5d97b3] text-sm sm:text-base">{item.organization}</h4>
                            )}
                            <p className="text-gray-200 mt-1 mb-3 leading-relaxed text-sm sm:text-base">{item.description}</p>
                            <TechList technologies={item.technologies} className="text-xs sm:text-sm text-gray-400" />
                        </button>
                    ))}
                </div>

                {/* More projects */}
                <div className={`${labelClass} mt-6`}>More projects</div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                    {more.map((item) => (
                        <button
                            key={item.id}
                            type="button"
                            onClick={() => openDetails(item.id)}
                            className={`${cardClass} px-4 py-3.5`}
                        >
                            <h3 className="font-bold text-white mb-0.5">{item.title}</h3>
                            <p className="text-gray-300 text-sm leading-relaxed">{item.description}</p>
                        </button>
                    ))}
                </div>
            </div>
        </div>

        {/* Details pop-up; clicking the dimmed area around the panel closes it */}
        <dialog
            ref={dialogRef}
            aria-labelledby="project-dialog-title"
            onCancel={(e) => {
                e.preventDefault();
                closeDetails();
            }}
            onClick={(e) => {
                if (e.target === e.currentTarget) closeDetails();
            }}
            className={`fixed inset-0 m-0 h-full max-h-none w-full max-w-none p-4 open:flex items-center justify-center bg-black/55 backdrop-blur-sm backdrop:bg-transparent transition-opacity duration-300 ${
                shown ? 'opacity-100' : 'opacity-0'
            }`}
        >
            {active && (
                <div
                    className={`relative w-full max-w-[620px] max-h-[85vh] overflow-y-auto bg-[#17232c] border-2 border-[#7bb3d1]/50 rounded-xl p-6 sm:p-7 text-white transition-transform duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${
                        shown ? 'translate-y-0 scale-100' : 'translate-y-2 scale-[0.97]'
                    }`}
                >
                    <button
                        type="button"
                        aria-label="Close"
                        autoFocus
                        onClick={closeDetails}
                        className="absolute top-4 right-4 w-8 h-8 grid place-items-center rounded-md text-gray-400 hover:text-white hover:bg-white/10 transition-colors duration-200 cursor-pointer"
                    >
                        ✕
                    </button>

                    <h3 id="project-dialog-title" className="font-bold text-xl sm:text-2xl pr-10">{active.title}</h3>
                    {active.organization && (
                        <p className="font-semibold text-[#5d97b3]">{active.organization}</p>
                    )}
                    <p className="leading-relaxed mt-3 mb-4">{active.description}</p>
                    <div className="mb-4">
                        {active.points.map((point, index) => (
                            <div key={index} className="text-sm flex mb-1.5 leading-relaxed">
                                <span className="pr-2 flex-shrink-0 text-white">•</span>
                                <span>{point}</span>
                            </div>
                        ))}
                    </div>

                    <TechList technologies={active.technologies} />

                    {active.link && (
                        <a
                            href={active.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block mt-3 text-sm text-[#5d97b3] hover:text-[#7bb3d1] transition-colors duration-200 underline"
                        >
                            View Project
                        </a>
                    )}
                </div>
            )}
        </dialog>
    </div>
    );
}

export default ProjectSection;
