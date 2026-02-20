import React, { useState } from 'react';

const ExperienceSection = () => {
    const [selectedItem, setSelectedItem] = useState<number | null>(null);

    const Content = [
        {
            id: 1,
            time: "Nov 2025 - Present",
            title: "Undergraduate Researcher",
            organization: "The B. John Garrick Institute for the Risk Sciences at UCLA",
            technologies: ['Python', 'LangChain', 'OpenAI API'],
            description: "Developed an LLM pipeline to extract and validate causal relationships between organizational factors and human performance from Human Reliability Analysis research literature",
            points: [
                "Engineered a multi-pass extraction pipeline using LangChain and GPT, clustering factors and running crafted prompts across 63 research papers to extract causal relationships with evidence",
                "Built a validation script that cleansed extracted PDF text, which is used to verify LLM generated excerpts verbatim against source documents",
                "Implemented batch processing with incremental backups, increasing error tolerance and allowing resume on failure across long API jobs"
            ]
        },
        {
            id: 2,
            time: "June 2025 - Present",
            title: "Software Engineer",
            organization: "UCLA Department of Civil Engineering",
            technologies: ['React Native', 'Leaflet.js', 'Google Maps API', 'FastAPI', 'Firebase', 'Supabase'],
            description: "Built a weather-tracking platform enabling farmers to optimize irrigation through automated field analysis and forecasting crop water demand, providing future irrigation recommendations",
            points: [
                "Utilized Google Earth Engine to predict soil and crop information, reducing manual data entry time by 30%",
                "Created a responsive, cross-platform interface with React Native, Leaflet.js and Google Maps API",
                "Architected a FastAPI backend using Supabase as a lookup table for chunked parcel data stored in Cloudflare R2, used Firebase for user authentication, and implemented query caching, improving retrieval speeds by 60%"
            ]
        },
        {
            id: 3,
            time: "Mar 2025 - Present",
            title: "Lead Fullstack Developer",
            organization: "ClubhouseUCLA",
            technologies: ['React', 'Next.js', 'Vercel', 'Supabase', 'TailwindCSS'],
            description: "Built a website using Next.js and Vercel, helping students review and discover clubs, serving 500+ monthly users",
            link: "https://www.clubhouseucla.com/",
            points: [
                "Built dynamic API routes and optimized query logic to Supabase, reducing page loading times by 50%",
                "Led a team of 8 developers to develop new website features, conducting weekly meetings to delegate tasks, troubleshoot blockers, coordinated with the design team on UI implementation, and oversaw CI/CD pipeline integration"
            ]
        },
        {
            id: 4,
            time: "Mar 2025 - Jun 2025",
            title: "Learning Assistant",
            organization: "UCLA Department of Computer Science",
            technologies: [],
            description: "Led discussions for 30+ students in a Data Structures & Algorithms course",
            points: [
                "Implemented various pedagogy techniques to improve student understanding",
                "Discussed teaching objectives and key focuses weekly with course instructor, teaching assistants, and other learning assistants",
                "Attended seminars to learn and improve facilitation strategies and collaborative learning methods"
            ]
        },
        {
            id: 5,
            time: "Jan 2025 - Present",
            title: "Undergraduate Researcher",
            organization: "UCLA Department of Mathematics Lab",
            technologies: [],
            description: "Researched multi-agent reinforcement learning under information asymmetry, extending the DCM bandit model to support multiple clicks per session",
            points: [
                "Designed and analyzed algorithms achieving sublinear regret in action and reward-asymmetric settings",
                "Conducted 100,000+ simulations in Python to benchmark against UCB variants, validating theoretical bounds and matching or outperforming existing baselines"
            ]
        },
        {
            id: 6,
            time: "Oct 2024 - May 2025",
            title: "Fullstack Developer",
            organization: "Creative Labs | Algoace",
            technologies: ['React Native', 'Java', 'Spring Boot', 'MongoDB', 'TailwindCSS'],
            description: "Worked with a 15 person team to build a gamified coding app helping software engineers enhance technical skills",
            points: [
                "Built and optimized RESTful API with Spring Boot and MongoDB for JWT-based authentication and role-based access control, improving loading speeds by 50%",
                "Developed responsive React Native frontend with TailwindCSS based on designer specifications",
            ]

        },
        {
            id: 7,
            time: "Sep 2024 - Jan 2025",
            title: "Undergraduate Researcher",
            organization: "Elegant Mind Lab UCLA",
            technologies: ['Python', 'ROS 2', 'Arduino'],
            description: "Assisted a 10-person team in developing autonomous surgery robots, focusing on robotic arm communication",
            points: [
                "Streamlined communication between robotic arms utilizing ROS 2, Arduino, and Python, which led to a 100% increase in transmission speed"
            ]

        },

    ]

    return (
        <div className="flex items-center">
        <div className="mt-8 font-normal">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl p-2 sm:p-4">
                Experience
            </h1>
            <h2 className="p-2 sm:p-4">
                <div className="max-w-4xl mx-auto p-3 sm:p-6">
                    {/* Mobile Layout */}
                    <div className="block sm:hidden space-y-3">
                        {Content.map((item) => (
                            <div key={item.id} className="border border-2 border-white/30 rounded-lg overflow-hidden">
                                <button
                                    onClick={() => setSelectedItem(selectedItem === item.id ? null : item.id)}
                                    className="w-full p-3 text-left bg-[#2d4a57]/20 hover:bg-[#7bb3d1]/20 transition-colors duration-300 cursor-pointer"
                                >
                                    <div className="flex justify-between items-center">
                                        <div className="flex-1">
                                            <h3 className="font-bold text-base text-white mb-1">{item.title}</h3>
                                            <p className="text-[#5d97b3] text-sm font-medium">{item.organization}</p>
                                        </div>
                                        <div className="text-right ml-3">
                                            <span className="text-xs text-gray-300 block mb-1">{item.time}</span>
                                            <div className="text-gray-400 text-lg font-light">
                                                {selectedItem === item.id ? '−' : '+'}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <p className="text-gray-300 text-sm mb-1 mt-2 leading-relaxed">{item.description}</p>
                                </button>
                                
                                <div 
                                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                                        selectedItem === item.id 
                                            ? 'max-h-96 opacity-100' 
                                            : 'max-h-0 opacity-0'
                                    }`}
                                >
                                    <div className="p-3 bg-[#2d4a57]/10 border-t border-white/20">
                                        {/* Extended description points */}
                                        <div className="space-y-1 mb-3">
                                            {item.points.map((point, index) => (
                                                <div key={index} className="text-xs flex leading-relaxed">
                                                    <span className="pr-2 flex-shrink-0 text-[#7bb3d1]">•</span>
                                                    <span className="text-gray-300">{point}</span>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Technologies */}
                                        <div className="flex flex-wrap gap-1">
                                            {item.technologies.map(technology => (
                                                <div key={technology} className="border border-2 border-white/30 rounded-full text-xs px-2 py-1">
                                                    {technology}
                                                </div>
                                            ))}
                                        </div>
                                        
                                        {item.link && (
                                            <a 
                                                href={item.link} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="inline-block text-xs text-[#5d97b3] hover:text-[#7bb3d1] transition-colors duration-200 underline"
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
                    <div className="hidden sm:block relative">
                        {/* Extended timeline line */}
                        <div className="absolute top-0 left-2 sm:left-4 bottom-0 w-0.5 bg-gradient-to-b from-gray-300 via-gray-300 via-85% to-transparent"></div>

                        {/* Timeline end marker */}
                        <div className="relative ml-4 sm:ml-8 pb-8">
                            <div className="absolute left-[-12px] sm:left-[-20px] w-3 h-3 bg-gray-400 rounded-full border-2 border-white z-10"></div>
                            <div className="text-white text-sm ml-1">The journey continues...</div>
                        </div>

                        {Content.map((item) => (
                            <div key={item.id} className="relative mb-6 sm:mb-10">
                                {/* Timeline dot */}
                                <div className="absolute left-[5px] sm:left-3 top-5 sm:top-6 w-3 h-3 bg-[#7bb3d1] rounded-full border-2 border-white z-10"></div>

                                <div className="ml-4 sm:ml-8">
                                    <div className="block sm:grid sm:grid-cols-6 sm:gap-4">
                                        <div className="sm:col-span-2 sm:self-start pt-3 sm:pt-4 mb-2 sm:mb-0 ml-1">
                                            <span className="text-sm sm:text-base text-gray-300 font-medium">
                                                {item.time}
                                            </span>
                                        </div>

                                        {/* Description Card */}
                                        <div className="sm:col-span-4 sm:col-end-7 border border-2 border-white/30 rounded-lg p-3 sm:p-4 shadow-sm hover:shadow-md bg-[#2d4a57]/20 hover:bg-[#7bb3d1]/20 hover:border-[#7bb3d1] transition-all duration-300 cursor-pointer" 
                                            onClick={() => setSelectedItem(selectedItem === item.id ? null : item.id)}
                                        >
                                            <h3 className="font-bold mb-2 text-lg sm:text-xl">
                                                {item.title}
                                            </h3>
                                            <h3 className="font-bold mb-2 text-sm sm:text-base text-[#5d97b3]">
                                                {item.organization}
                                            </h3>
                                            <h3 className="mb-3 sm:mb-4 text-sm sm:text-md leading-relaxed">
                                                {item.description}
                                            </h3>

                                            {/* Technologies */}
                                            <div className="flex flex-wrap gap-1 sm:gap-2">
                                                {item.technologies.map(technology => (
                                                    <div key={technology} className="border border-2 border-white/30 rounded-full text-xs sm:text-sm px-2 sm:px-3 py-1">
                                                        {technology}
                                                    </div>
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
                                                <div>
                                                    <div className="border-t my-3 sm:my-4"></div>
                                                    {item.points.map((point, index) => (
                                                        <div key={index} className="text-xs sm:text-sm flex mb-1 leading-relaxed">
                                                            <span className="pr-2 flex-shrink-0 text-[#7bb3d1]">•</span>
                                                            <span>{point}</span>
                                                        </div>
                                                    ))}
                                                    
                                                    {item.link && (
                                                        <a 
                                                            href={item.link} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer"
                                                            className="inline-block mt-2 sm:ml-4 text-xs sm:text-sm text-[#5d97b3] hover:text-[#7bb3d1] transition-colors duration-200 underline"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            View Project
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </h2>
        </div>
    </div>
);
}

export default ExperienceSection;