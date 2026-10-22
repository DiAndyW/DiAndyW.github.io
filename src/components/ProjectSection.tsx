'use client';

import React, { useState } from 'react';

const ProjectSection = () => {
    const [selectedItem, setSelectedItem] = useState<number | null>(null);

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

    const toggle = (id: number) => setSelectedItem(selectedItem === id ? null : id);

    return (
        <div className="flex items-center">
        <div className="mt-8 font-normal w-full">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl p-2 sm:p-4 mb-2 sm:mb-4">
                Projects
            </h1>

            <div className="px-2 sm:px-4">
                {/* Featured projects */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {featured.map((item) => (
                        <div
                            key={item.id}
                            className="bg-[#2d4a57]/20 hover:bg-[#7bb3d1]/20 border-2 border-white/30 rounded-lg p-3 sm:p-4 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer hover:border-[#7bb3d1] self-start"
                            onClick={() => toggle(item.id)}
                        >
                            {/* Header */}
                            <div className="flex justify-between items-start mb-1">
                                <h3 className="font-bold text-lg sm:text-xl text-white">
                                    {item.title}
                                </h3>
                                <div className="text-gray-400 text-lg font-light flex-shrink-0 ml-3">
                                    {selectedItem === item.id ? '−' : '+'}
                                </div>
                            </div>

                            {item.organization && (
                                <h4 className="font-semibold text-[#5d97b3] mb-2 text-sm sm:text-base">
                                    {item.organization}
                                </h4>
                            )}

                            {/* Description */}
                            <p className="text-white mb-3 leading-relaxed text-sm sm:text-base">
                                {item.description}
                            </p>

                            {/* Technologies */}
                            <div className="flex flex-wrap gap-1.5 sm:gap-2">
                                {item.technologies.map((technology, index) => (
                                    <span
                                        key={index}
                                        className="text-white border-2 border-white/30 rounded-full text-xs sm:text-sm px-2 sm:px-3 py-1"
                                    >
                                        {technology}
                                    </span>
                                ))}
                            </div>

                            {/* Extended description */}
                            <div
                                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                                    selectedItem === item.id
                                        ? 'max-h-[1000px] opacity-100'
                                        : 'max-h-0 opacity-0'
                                }`}
                            >
                                <div className="border-t pt-3 mt-3">
                                    <div className="space-y-2 mb-3">
                                        {item.points.map((point, index) => (
                                            <div key={index} className="text-xs sm:text-sm text-white flex items-start">
                                                <span className="pr-2 text-[#7bb3d1] flex-shrink-0">•</span>
                                                <span>{point}</span>
                                            </div>
                                        ))}
                                    </div>

                                    {item.link && (
                                        <a
                                            href={item.link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center text-xs sm:text-sm text-[#5d97b3] hover:text-[#7bb3d1] font-medium transition-colors duration-200 underline"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            View Project
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* More projects */}
                <div className="text-[#7bb3d1] text-xs uppercase tracking-widest font-bold mt-6 mb-2">
                    More projects
                </div>
                <div>
                    {more.map((item) => (
                        <div
                            key={item.id}
                            className="border-b border-white/15 py-3 px-1 cursor-pointer hover:bg-[#7bb3d1]/10 transition-colors duration-300"
                            onClick={() => toggle(item.id)}
                        >
                            <div className="flex justify-between items-baseline gap-3">
                                <div className="min-w-0 sm:truncate">
                                    <span className="font-bold text-white">{item.title}</span>
                                    <span className="text-gray-300 text-sm"> · {item.description}</span>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0 text-sm text-gray-400">
                                    <span className="hidden sm:inline">{item.technologies[0]}</span>
                                    {item.link && (
                                        <a
                                            href={item.link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            aria-label={`Open ${item.title}`}
                                            className="text-[#5d97b3] hover:text-[#7bb3d1] transition-colors duration-200"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            ↗
                                        </a>
                                    )}
                                    <span className="text-gray-400 font-light">
                                        {selectedItem === item.id ? '−' : '+'}
                                    </span>
                                </div>
                            </div>

                            <div
                                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                                    selectedItem === item.id
                                        ? 'max-h-[1000px] opacity-100'
                                        : 'max-h-0 opacity-0'
                                }`}
                            >
                                <div className="pt-3 space-y-1">
                                    {item.points.map((point, index) => (
                                        <div key={index} className="text-xs sm:text-sm text-gray-300 flex items-start">
                                            <span className="pr-2 text-[#7bb3d1] flex-shrink-0">•</span>
                                            <span>{point}</span>
                                        </div>
                                    ))}
                                    <div className="flex flex-wrap gap-1.5 pt-2">
                                        {item.technologies.map((technology, index) => (
                                            <span
                                                key={index}
                                                className="text-white border-2 border-white/30 rounded-full text-xs px-2 py-1"
                                            >
                                                {technology}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </div>
    );
}

export default ProjectSection;
