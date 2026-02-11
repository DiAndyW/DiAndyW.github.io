import React, { useState } from 'react';

const ProjectSection = () => {
    const [selectedItem, setSelectedItem] = useState<number | null>(null);

    const Content = [
        {
            id: 1,
            title: "Bloon Tower Defense Training Camp",
            technologies: ['Three.js', 'Blender'],
            description: "Created a 3D first-person shooter aim trainer inspired by Balloon Towers Defense and Aim Labs.",
            link: "https://diandyw.github.io/BTDTrainingCamp/",
            points: [
                "Overhauled balloon movement and added settings, allowing for more customizable gameplay",
                "Created custom assets for various objects in game, improving game quality and completeness",
            ]
        },
        {
            id: 2,
            title: "Morii",
            technologies: ['Swift', 'Express.js', 'Node.js', 'MongoDB'],
            description: "Collaborated on a social media app designed to promote emotional awareness and authentic self-expression",
            link: "https://apps.apple.com/us/app/morii-moments-that-stay/id6746750544",
            points: [
                "Implemented core frontend features using Swift, including a sign-in flow, custom nav bar, homepage, and user profiles",
                "Wrote and tested RESTful API endpoints that returned mood summaries and analytics over customizable time frames"
            ]
        },
        {
            id: 3,
            // time: "Apr 2025",
            title: "True Talent",
            organization: "LAHacks 2025",
            technologies: ['React', 'Node.js', 'Python', 'Flask'],
            description: "Created a code-interview website that helps detect cheating using AI, allowing companies to find the truly talented",
            link: "https://devpost.com/software/realcoder",
            points: [
                "Made a responsive website using React, Node.js, and WebSockets, allowing for real time interviews",
                "Used Google Gemini to analyze video, audio, and code for suspicious behavior, providing helpful feedback and follow-up questions for interviewers"
            ]
        },
        {
            id: 4,
            // time: "Jan 2024 - Jun 2024",
            title: "Temple of Doom",
            organization: "",
            technologies: ['C++'],
            description: "Designed and developed a 2D dungeon-style game using C++ inspired by classic arcade games",
            points: [
                "Optimized recursive algorithms for enemy movement, improving processing times by 70% for a smoother experience",
                "Implemented real-time map rendering and random map generation, enhancing gameplay variability",
            ]
        },
    ]

    return (
        <div className="flex items-center">
        <div className="mt-8 font-normal">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl p-2 sm:p-4 mb-6 sm:mb-8">
                Projects
            </h1>
            
            <div className="px-4">
                {/* Mobile Layout */}
                <div className="block sm:hidden space-y-3">
                    {Content.map((item) => (
                        <div key={item.id} className="border border-2 border-white/30 rounded-lg overflow-hidden">
                            <div 
                                className="bg-[#2d4a57]/20 hover:bg-[#7bb3d1]/20 transition-colors duration-300 p-3 cursor-pointer"
                                onClick={() => setSelectedItem(selectedItem === item.id ? null : item.id)}
                            >
                                <div className="flex justify-between items-start">
                                    {/* Always visible */}
                                    <div className="flex-1 mr-3">
                                        <h3 className="font-bold text-base text-white mb-1">
                                            {item.title}
                                        </h3>
                                        {item.organization && (
                                            <h4 className="font-semibold text-[#5d97b3] text-sm mb-2">
                                                {item.organization}
                                            </h4>
                                        )}
                                        <p className="text-white leading-relaxed text-sm mb-1">
                                            {item.description}
                                        </p>
                                    </div>

                                    {/* Expand/Collapse indicator */}
                                    <div className="text-gray-400 text-lg font-light flex-shrink-0">
                                        {selectedItem === item.id ? '−' : '+'}
                                    </div>
                                </div>
                            </div>
                            
                            {/* Expandable content */}
                            <div 
                                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                                    selectedItem === item.id 
                                        ? 'max-h-96 opacity-100' 
                                        : 'max-h-0 opacity-0'                               
                                }`}
                            >
                                <div className="p-3 bg-[#2d4a57]/10 border-t border-white/20">
                                    <div className="space-y-1 mb-3">
                                        {item.points.map((point, index) => (
                                            <div key={index} className="text-xs text-white flex items-start">
                                                <span className="pr-2 text-[#7bb3d1] flex-shrink-0">•</span>
                                                <span className="text-gray-300">{point}</span>
                                            </div>
                                        ))}
                                    </div>
                                    
                                    {/* Technologies */}
                                    <div className="flex flex-wrap gap-1">
                                        {item.technologies.map((technology, index) => (
                                            <span 
                                                key={index}
                                                className="text-white border border-2 border-white/30 rounded-full text-xs px-2 py-1"
                                            >
                                                {technology}
                                            </span>
                                        ))}
                                    </div>

                                    {item.link && (
                                        <a 
                                            href={item.link} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center text-xs text-[#5d97b3] hover:text-[#7bb3d1] font-medium transition-colors duration-200 underline"
                                        >
                                            View Project
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Desktop Layout */}
                <div className="hidden sm:block flex-row gap-4 sm:gap-6">
                    {Content.map((item) => (
                        <div 
                            key={item.id} 
                            className="bg-[#2d4a57]/20 hover:bg-[#7bb3d1]/20 border border-2 border-white/30 rounded-lg my-4 sm:my-6 lg:my-8 p-3 sm:p-4 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer hover:border-[#7bb3d1]"
                            onClick={() => setSelectedItem(selectedItem === item.id ? null : item.id)}
                        >
                            {/* Header */}
                            <div className="mb-3 sm:mb-4">
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2">
                                    <h3 className="font-bold text-lg sm:text-xl text-white mb-1 sm:mb-0">
                                        {item.title}
                                    </h3>
                                </div>
                                
                                {item.organization && (
                                    <h4 className="font-semibold text-[#5d97b3] mb-2 sm:mb-3 text-sm sm:text-base">
                                        {item.organization}
                                    </h4>
                                )}
                            </div>

                            {/* Description */}
                            <p className="text-white mb-3 sm:mb-4 leading-relaxed text-sm sm:text-base">
                                {item.description}
                            </p>

                            {/* Technologies */}
                            <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3 sm:mb-4">
                                {item.technologies.map((technology, index) => (
                                    <span 
                                        key={index}
                                        className="text-white border border-2 border-white/30 rounded-full text-xs sm:text-sm px-2 sm:px-3 py-1"
                                    >
                                        {technology}
                                    </span>
                                ))}
                            </div>
                            
                            {/* Extended description */}
                            <div 
                                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                                    selectedItem === item.id 
                                        ? 'max-h-96 opacity-100' 
                                        : 'max-h-0 opacity-0'                               
                                }`}
                            >
                                <div className="border-t pt-3 sm:pt-4 mt-3 sm:mt-4">
                                    <div className="space-y-2 mb-3 sm:mb-4">
                                        {item.points.map((point, index) => (
                                            <div key={index} className="text-xs sm:text-sm text-white flex items-start">
                                                <span className="pr-2 text-[#7bb3d1]">•</span>
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
            </div>
        </div>
    </div>
    );
}

export default ProjectSection;