'use client';

import React, { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import TechList from './TechList';
import DetailsSheet from './DetailsSheet';

type Category = 'swe' | 'ai' | 'teaching';

const CATEGORIES: { id: Category; label: string; short: string }[] = [
    { id: 'swe', label: 'Software Engineering', short: 'SWE' },
    { id: 'ai', label: 'AI/ML & Research', short: 'AI/ML' },
    { id: 'teaching', label: 'Teaching', short: 'Teaching' },
];

// How much of the previous role stays visible above the selected one
const PEEK = 70;
const GLIDE_MS = 650;
// Height within a role card (and the pane) where the connector attaches, level with the dot
const LINK_Y = 24;
const GAP = 28;

const hasDetails = (item: { points: string[] }) => item.points.length > 0;

const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

const ExperienceSection = () => {
    const [category, setCategory] = useState<Category>('swe');
    const [sheetItem, setSheetItem] = useState<number | null>(null);
    const reelRef = useRef<HTMLDivElement>(null);
    const rowRefs = useRef(new Map<number, HTMLDivElement>());
    const glideFrame = useRef(0);
    const contentRef = useRef<HTMLDivElement>(null);
    const outgoingRef = useRef<HTMLDivElement>(null);
    const crossfadeCleanup = useRef<(() => void) | null>(null);
    const paneColumnRef = useRef<HTMLDivElement>(null);
    const linkStubRef = useRef<SVGPathElement>(null);
    const linkTrunkRef = useRef<SVGPathElement>(null);
    const linkFadeRef = useRef<SVGLinearGradientElement>(null);
    const linkFadeId = useId();

    const Content: {
        id: number;
        time: string;
        title: string;
        organization: string;
        category: Category;
        technologies: string[];
        description: string;
        link?: string;
        points: string[];
    }[] = [
        {
            id: 1,
            time: "2026 – Present",
            title: "Software Developer",
            organization: "LA Blueprint",
            category: 'swe',
            technologies: [],
            description: "",
            points: []
        },
        {
            id: 2,
            time: "2026",
            title: "Software Engineering Intern",
            organization: "Microsoft",
            category: 'swe',
            technologies: ['Go', 'Kubernetes', 'Azure', 'Microsoft Foundry', 'Linux'],
            description: "Built an AI-assisted Kubernetes security posture platform that transforms security scan findings into actionable risk assessments and remediation guidance, helping users identify security issues in offline environments",
            points: [
                "Reduced ungrounded AI-generated security guidance by 91% through model evaluation on Microsoft Foundry and architecture redesign, improving the reliability of automated security analysis",
                "Developed a modular Go-based security evaluation CLI with scanner orchestration and artifact management to automate Kubernetes and Linux security posture assessments",
                "Authored the architecture and implementation plan for a new security evaluation capability, utilizing design reviews and incorporating cross-team feedback around security, scalability, and AI integration"
            ]
        },
        {
            id: 3,
            time: "2026 – Present",
            title: "DevOps Intern",
            organization: "UCLA Student Media",
            category: 'swe',
            technologies: ['JavaScript', 'React'],
            description: "",
            points: []
        },
        {
            id: 4,
            time: "2025 – 2026",
            title: "Undergraduate Researcher",
            organization: "The B. John Garrick Institute for the Risk Sciences at UCLA",
            category: 'ai',
            technologies: ['Python', 'LangChain', 'OpenAI API'],
            description: "Developed an LLM pipeline to extract and validate causal relationships between organizational factors and human performance from Human Reliability Analysis research literature",
            points: [
                "Engineered a multi-pass extraction pipeline using LangChain and GPT, clustering factors and running crafted prompts across 63 research papers to extract causal relationships with evidence",
                "Built a validation script that cleansed extracted PDF text, which is used to verify LLM generated excerpts verbatim against source documents",
                "Implemented batch processing with incremental backups, increasing error tolerance and allowing resume on failure across long API jobs"
            ]
        },
        {
            id: 5,
            time: "2025 – 2026",
            title: "Software Developer",
            organization: "UCLA Department of Civil Engineering",
            category: 'swe',
            technologies: ['React Native', 'Leaflet.js', 'Google Maps API', 'FastAPI', 'Firebase', 'Supabase'],
            description: "Built a weather-tracking platform enabling farmers to optimize irrigation through automated field analysis and forecasting crop water demand, providing future irrigation recommendations",
            points: [
                "Utilized Google Earth Engine to predict soil and crop information, reducing manual data entry time by 30%",
                "Created a responsive, cross-platform interface with React Native, Leaflet.js and Google Maps API",
                "Architected a FastAPI backend using Supabase as a lookup table for chunked parcel data stored in Cloudflare R2, used Firebase for user authentication, and implemented query caching, improving retrieval speeds by 60%"
            ]
        },
        {
            id: 6,
            time: "2025 – Present",
            title: "Lead Fullstack Developer",
            organization: "Clubhouse Bruins",
            category: 'swe',
            technologies: ['React', 'Next.js', 'Vercel', 'Supabase', 'TailwindCSS'],
            description: "Built a website using Next.js and Vercel, helping students review and discover clubs, serving 500+ monthly users",
            link: "https://www.clubhouseucla.com/",
            points: [
                "Built dynamic API routes and optimized query logic to Supabase, reducing page loading times by 50%",
                "Led a team of 8 developers to develop new website features, conducting weekly meetings to delegate tasks, troubleshoot blockers, coordinated with the design team on UI implementation, and oversaw CI/CD pipeline integration"
            ]
        },
        {
            id: 7,
            time: "2025",
            title: "Learning Assistant",
            organization: "UCLA Department of Computer Science",
            category: 'teaching',
            technologies: [],
            description: "Led discussions for 30+ students in a Data Structures & Algorithms course",
            points: [
                "Implemented various pedagogy techniques to improve student understanding",
                "Discussed teaching objectives and key focuses weekly with course instructor, teaching assistants, and other learning assistants",
                "Attended seminars to learn and improve facilitation strategies and collaborative learning methods"
            ]
        },
        {
            id: 8,
            time: "2025 – 2026",
            title: "Undergraduate Researcher",
            organization: "UCLA Department of Mathematics Lab",
            category: 'ai',
            technologies: [],
            description: "Researched multi-agent reinforcement learning under information asymmetry, extending the DCM bandit model to support multiple clicks per session",
            points: [
                "Designed and analyzed algorithms achieving sublinear regret in action and reward-asymmetric settings",
                "Conducted 100,000+ simulations in Python to benchmark against UCB variants, validating theoretical bounds and matching or outperforming existing baselines"
            ]
        },
        {
            id: 9,
            time: "2024 – 2025",
            title: "Fullstack Developer",
            organization: "Creative Labs | Algoace",
            category: 'swe',
            technologies: ['React Native', 'Java', 'Spring Boot', 'MongoDB', 'TailwindCSS'],
            description: "Worked with a 15 person team to build a gamified coding app helping software engineers enhance technical skills",
            points: [
                "Built and optimized RESTful API with Spring Boot and MongoDB for JWT-based authentication and role-based access control, improving loading speeds by 50%",
                "Developed responsive React Native frontend with TailwindCSS based on designer specifications",
            ]

        },
        {
            id: 10,
            time: "2024 – 2025",
            title: "Undergraduate Researcher",
            organization: "Elegant Mind Lab UCLA",
            category: 'ai',
            technologies: ['Python', 'ROS 2', 'Arduino'],
            description: "Assisted a 10-person team in developing autonomous surgery robots, focusing on robotic arm communication",
            points: [
                "Streamlined communication between robotic arms utilizing ROS 2, Arduino, and Python, which led to a 100% increase in transmission speed"
            ]

        },

    ]

    const firstWithDetails = (c: Category) =>
        Content.find((item) => item.category === c && hasDetails(item))?.id ?? null;

    const [selectedItem, setSelectedItem] = useState<number | null>(() => firstWithDetails('swe'));

    const visible = Content.filter((item) => item.category === category);

    const stopGlide = () => cancelAnimationFrame(glideFrame.current);

    // Scroll the timeline (never the page) so the role sits in the top slot beside the details
    const scrollToRole = (id: number, animate: boolean) => {
        const reel = reelRef.current;
        const row = rowRefs.current.get(id);
        if (!reel || !row) return;
        stopGlide();
        const target = row.getBoundingClientRect().top - reel.getBoundingClientRect().top + reel.scrollTop - PEEK;
        if (!animate || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            reel.scrollTop = target;
            return;
        }
        const from = reel.scrollTop;
        const start = performance.now();
        const frame = (now: number) => {
            const t = Math.min(1, (now - start) / GLIDE_MS);
            reel.scrollTop = from + (target - from) * easeInOutCubic(t);
            if (t < 1) glideFrame.current = requestAnimationFrame(frame);
        };
        glideFrame.current = requestAnimationFrame(frame);
    };

    // Redraw the connector from the open role's card to the pane; called on every timeline scroll
    const updateLink = () => {
        const reel = reelRef.current;
        const column = paneColumnRef.current;
        const stub = linkStubRef.current;
        const trunk = linkTrunkRef.current;
        const fade = linkFadeRef.current;
        if (!reel || !column || !stub || !trunk || !fade) return;
        const row = selectedItem === null ? undefined : rowRefs.current.get(selectedItem);
        if (!row || reel.clientHeight === 0) {
            stub.style.opacity = '0';
            trunk.style.opacity = '0';
            return;
        }
        const top = column.getBoundingClientRect().top;
        const reelRect = reel.getBoundingClientRect();
        const cardY = row.getBoundingClientRect().top - top + LINK_Y;
        const y = Math.min(Math.max(cardY, reelRect.top - top), reelRect.bottom - top);
        const offscreen = y !== cardY;
        const paneY = PEEK + LINK_Y;
        // Right-angled: across from the card, up or down at the middle of the gap, then across into the pane
        stub.setAttribute('d', `M0 ${y} H${GAP / 2}`);
        trunk.setAttribute('d', `M${GAP / 2} ${y} V${paneY} H${GAP}`);
        // Once the card scrolls out, drop the stub and let the vertical fade toward the edge it left by
        stub.style.opacity = offscreen ? '0' : '1';
        trunk.style.opacity = '1';
        fade.setAttribute('y1', String(y));
        fade.setAttribute('y2', String(paneY));
        trunk.setAttribute('stroke', offscreen ? `url(#${linkFadeId})` : '#7bb3d1');
    };

    const changeCategory = (next: Category) => {
        if (next === category) return;
        crossfadeCleanup.current?.();
        const content = contentRef.current;
        const outgoing = outgoingRef.current;
        if (content && outgoing && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            // A noninteractive visual copy lets the old content fade without duplicating React refs.
            const snapshot = content.cloneNode(true) as HTMLDivElement;
            snapshot.removeAttribute('data-experience-content');
            snapshot.querySelectorAll('[id]').forEach((node) => node.removeAttribute('id'));
            snapshot.inert = true;
            outgoing.replaceChildren(snapshot);
            const oldReel = content.querySelector('.timeline-reel');
            const copiedReel = snapshot.querySelector('.timeline-reel');
            if (oldReel && copiedReel) copiedReel.scrollTop = oldReel.scrollTop;
            content.parentElement!.style.minHeight = `${content.offsetHeight}px`;
        }
        setCategory(next);
        setSelectedItem(firstWithDetails(next));
        setSheetItem(null);
    };

    useLayoutEffect(() => {
        const content = contentRef.current;
        const outgoing = outgoingRef.current;
        if (!content || !outgoing?.firstChild) return;
        const incomingAnimation = content.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 180, easing: 'ease-in-out' });
        const outgoingAnimation = outgoing.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 180, easing: 'ease-in-out' });
        let finished = false;
        const cleanup = () => {
            if (finished) return;
            finished = true;
            incomingAnimation.cancel();
            outgoingAnimation.cancel();
            outgoing.replaceChildren();
            content.parentElement!.style.minHeight = '';
            crossfadeCleanup.current = null;
        };
        crossfadeCleanup.current = cleanup;
        incomingAnimation.finished.then(cleanup, () => {});
        return cleanup;
    }, [category]);

    // Snap (no glide) to the default role on mount and whenever the tab changes
    useLayoutEffect(() => {
        if (selectedItem !== null) scrollToRole(selectedItem, false);
    }, [category]);

    useLayoutEffect(updateLink, [selectedItem, category]);

    // The reel is display:none below md; re-snap once it appears (rotating a tablet, widening a window)
    useEffect(() => {
        const reel = reelRef.current;
        if (!reel || selectedItem === null) return;
        let wasHidden = reel.clientHeight === 0;
        const observer = new ResizeObserver(() => {
            const hidden = reel.clientHeight === 0;
            if (wasHidden && !hidden) scrollToRole(selectedItem, false);
            updateLink();
            wasHidden = hidden;
        });
        observer.observe(reel);
        return () => observer.disconnect();
    }, [selectedItem]);

    useEffect(() => stopGlide, []);

    const sheetRole = visible.find((item) => item.id === sheetItem);

    return (
        <div className="flex items-center">
        <div className="mt-8 w-full font-normal">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl p-2 sm:p-4">
                Experience
            </h1>
            <div className="flex flex-wrap gap-2 px-2 sm:px-4">
                {CATEGORIES.map((c) => (
                    <button
                        key={c.id}
                        aria-pressed={category === c.id}
                        onClick={() => changeCategory(c.id)}
                        className={`rounded-full border-2 px-3 py-1 text-sm transition-colors duration-300 cursor-pointer ${
                            category === c.id
                                ? 'bg-[#5d97b3] border-[#7bb3d1] font-bold'
                                : 'border-white/30 hover:bg-[#7bb3d1]/20'
                        }`}
                    >
                        <span className="experience-category-label inline-grid sm:hidden" data-label={c.short}><span>{c.short}</span></span>
                        <span className="experience-category-label hidden sm:inline-grid" data-label={c.label}><span>{c.label}</span></span>
                    </button>
                ))}
            </div>
            <div className="relative">
            <div ref={outgoingRef} data-experience-outgoing="" aria-hidden="true" inert className="pointer-events-none absolute inset-0" />
            <div ref={contentRef} data-experience-content="" className="p-2 sm:p-4">
                <div className="max-w-4xl mx-auto p-3 sm:p-6">
                    {/* Mobile Layout */}
                    <div className="block md:hidden space-y-3">
                        {visible.map((item) => {
                            const header = (
                                <>
                                    <span className="block text-xs text-gray-400 mb-1">{item.time}</span>
                                    <span className="flex items-center gap-3">
                                        <span className="flex-1">
                                            <span className="block font-bold text-base">{item.title}</span>
                                            <span className="experience-organization font-bold text-sm text-[#5d97b3]">{item.organization}</span>
                                        </span>
                                    </span>
                                    {!hasDetails(item) && <span className="block text-xs text-gray-500 italic mt-1">coming soon</span>}
                                </>
                            );

                            if (!hasDetails(item)) {
                                return (
                                    <div key={item.id} className="border-2 border-dashed border-white/15 rounded-lg p-3">
                                        {header}
                                    </div>
                                );
                            }

                            return (
                                <div key={item.id} className="experience-card border-2 border-white/30 rounded-lg overflow-hidden bg-[#2d4a57]/20 transition-colors duration-300 motion-reduce:transition-none">
                                    <button
                                        type="button"
                                        aria-haspopup="dialog"
                                        onClick={() => setSheetItem(item.id)}
                                        className="w-full p-3 text-left cursor-pointer"
                                    >
                                        {header}
                                    </button>

                                </div>
                            );
                        })}
                    </div>

                    {/* Desktop Layout: scrollable timeline beside a details pane */}
                    <div className="hidden md:grid grid-cols-[5fr_7fr] gap-7 min-h-[440px]">
                        <div className="relative">
                            <div
                                ref={reelRef}
                                onWheel={stopGlide}
                                onTouchStart={stopGlide}
                                onScroll={updateLink}
                                className="timeline-reel absolute inset-y-0 -left-3 -right-7 overflow-y-auto pl-3 pr-7"
                            >
                                {/* PEEK of top padding lets the first role reach the top slot too */}
                                <div className="relative pl-7" style={{ paddingTop: PEEK }}>
                                    {/* Timeline line */}
                                    <div className="absolute left-2 bottom-0 w-0.5 bg-gradient-to-b from-gray-300 via-gray-300 via-85% to-transparent" style={{ top: PEEK + 4 }}></div>

                                    {/* Timeline end marker */}
                                    <div className="relative pb-6">
                                        <div className="absolute -left-[26px] top-1 w-3 h-3 bg-gray-400 rounded-full border-2 border-white z-10"></div>
                                        <div className="text-white text-sm">The journey continues...</div>
                                    </div>

                                    {visible.map((item) => {
                                        const selected = selectedItem === item.id;
                                        const card = (
                                            <>
                                                <span className="block text-xs text-gray-400">{item.time}</span>
                                                <span className="block font-bold">{item.title}</span>
                                                <span className="experience-organization font-bold text-[#5d97b3]">{item.organization}</span>
                                                {!hasDetails(item) && (
                                                    <span className="block text-xs text-gray-500 italic">coming soon</span>
                                                )}
                                            </>
                                        );

                                        return (
                                            <div
                                                key={item.id}
                                                ref={(el) => {
                                                    if (el) rowRefs.current.set(item.id, el);
                                                    else rowRefs.current.delete(item.id);
                                                }}
                                                className="relative mb-4"
                                            >
                                                {/* Timeline dot */}
                                                <div
                                                    className={`absolute -left-[26px] top-[18px] w-3 h-3 rounded-full border-2 z-10 transition-[transform,box-shadow] duration-300 ${
                                                        hasDetails(item) ? 'bg-[#7bb3d1] border-white' : 'bg-gray-600 border-gray-400'
                                                    } ${selected ? 'scale-150 shadow-[0_0_0_5px_rgba(123,179,209,0.25)] delay-500' : ''}`}
                                                ></div>

                                                {hasDetails(item) ? (
                                                    <button
                                                        type="button"
                                                        aria-current={selected}
                                                        onClick={() => {
                                                            setSelectedItem(item.id);
                                                            scrollToRole(item.id, true);
                                                        }}
                                                        className={`experience-card w-full text-left border-2 rounded-lg px-3.5 py-3 transition-colors duration-300 motion-reduce:transition-none cursor-pointer ${
                                                            selected
                                                                ? 'bg-[#7bb3d1]/20 border-[#7bb3d1]'
                                                                : 'bg-[#2d4a57]/20 border-white/30'
                                                        }`}
                                                    >
                                                        {card}
                                                    </button>
                                                ) : (
                                                    <div className="border-2 border-dashed border-white/15 rounded-lg px-3.5 py-3">
                                                        {card}
                                                    </div>
                                                )}

                                            </div>
                                        );
                                    })}
                                </div>
                                {/* Room below the last role so it can still reach the top slot */}
                                <div aria-hidden style={{ height: `calc(100% - ${PEEK + 90}px)` }}></div>
                            </div>
                        </div>

                        {/* All panes share one cell, so the section is as tall as the tallest role */}
                        <div ref={paneColumnRef} className="relative grid" style={{ paddingTop: PEEK }}>
                            {/* Connector from the open role to the pane; steps up or down to stay attached while the timeline scrolls */}
                            <svg aria-hidden className="absolute top-0 h-full overflow-visible pointer-events-none" style={{ left: -GAP, width: GAP }}>
                                <defs>
                                    <linearGradient ref={linkFadeRef} id={linkFadeId} gradientUnits="userSpaceOnUse" x1={GAP / 2} x2={GAP / 2}>
                                        <stop offset="0" stopColor="#7bb3d1" stopOpacity="0" />
                                        <stop offset="1" stopColor="#7bb3d1" />
                                    </linearGradient>
                                </defs>
                                <path ref={linkStubRef} fill="none" stroke="#7bb3d1" strokeWidth="2" />
                                <path ref={linkTrunkRef} fill="none" stroke="#7bb3d1" strokeWidth="2" strokeLinejoin="miter" />
                            </svg>
                            {visible.filter(hasDetails).map((item) => {
                                const selected = selectedItem === item.id;
                                return (
                                    <div
                                        key={item.id}
                                        className={`[grid-area:1/1] self-start border-2 border-[#7bb3d1]/50 rounded-lg p-5 bg-[#2d4a57]/25 transition-[opacity,transform,visibility] duration-300 ${
                                            selected ? 'visible opacity-100 translate-y-0 delay-150' : 'invisible opacity-0 translate-y-2'
                                        }`}
                                    >
                                        <h3 className="font-bold text-xl mb-1">{item.title}</h3>
                                        <p className="font-bold text-[#5d97b3]">{item.organization}</p>
                                        <p className="text-sm text-gray-400 mt-1 mb-3">{item.time}</p>
                                        <p className="leading-relaxed mb-4">{item.description}</p>
                                        <div className="mb-4">
                                            {item.points.map((point, index) => (
                                                <div key={index} className="text-sm flex mb-1.5 leading-relaxed">
                                                    <span className="pr-2 flex-shrink-0 text-white">•</span>
                                                    <span>{point}</span>
                                                </div>
                                            ))}
                                        </div>

                                        <TechList technologies={item.technologies} />

                                        {item.link && (
                                            <a
                                                href={item.link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-block mt-3 text-sm text-[#5d97b3] hover:text-[#7bb3d1] transition-colors duration-200 underline"
                                            >
                                                View Project
                                            </a>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
            </div>
        </div>
        {sheetRole && (
            <DetailsSheet
                title={sheetRole.title}
                subtitle={<><p className="font-medium text-[#7bb3d1]">{sheetRole.organization}</p><p className="mt-1">{sheetRole.time}</p></>}
                theme="experience"
                closeLabel="Close experience details"
                dismissAtWidth={768}
                onClose={() => setSheetItem(null)}
            >
                <p className="mb-5 text-sm leading-relaxed">{sheetRole.description}</p>
                <ul className="mb-6 flex list-none flex-col gap-3 p-0">
                    {sheetRole.points.map((point) => (
                        <li key={point} className="flex gap-3 text-xs leading-relaxed">
                            <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-current" />
                            <span>{point}</span>
                        </li>
                    ))}
                </ul>
                <TechList technologies={sheetRole.technologies} className="mb-6 text-xs text-gray-400" />
                {sheetRole.link && <a href={sheetRole.link} target="_blank" rel="noopener noreferrer" className="inline-block py-2 text-xs text-[#7bb3d1] underline underline-offset-4">Open website</a>}
            </DetailsSheet>
        )}
    </div>
);
}

export default ExperienceSection;
