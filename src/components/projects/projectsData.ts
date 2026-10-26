export type ProjectColor = 'blue' | 'green' | 'coral' | 'yellow' | 'orange' | 'sky';
export type StickerId = 'mosaic' | 'true-talent' | 'morii' | 'btd' | 'temple';

export type Project = {
    slug: string;
    title: string;
    previewTitle?: string;
    // Compact name for the tabs, when the title is too long to fit.
    shortTitle?: string;
    org?: string;
    description: string;
    summary?: string;
    bullets: [string, string];
    tech: string[];
    // Shown when there is a public link; otherwise `status` takes its place.
    link?: { href: string; label: string };
    status?: string;
    featured?: boolean;
    color: ProjectColor;
    sticker?: StickerId;
    images?: { src: string; alt: string; width: number; height: number }[];
};

// Each coloured shape is split vertically: left half light, right half shade.
export const TWO_TONE: Record<ProjectColor, { light: string; shade: string }> = {
    blue: { light: '#6fa0e6', shade: '#5f8acb' },
    green: { light: '#a9cd62', shade: '#8fad55' },
    coral: { light: '#ef7d6a', shade: '#d9695a' },
    yellow: { light: '#ffd76e', shade: '#efc256' },
    orange: { light: '#f59a45', shade: '#e0853a' },
    sky: { light: '#93b8ee', shade: '#7fa6df' },
};

// Array order is page order.
export const PROJECTS: Project[] = [
    {
        slug: 'mosaic',
        title: 'Mosaic',
        summary: 'An iOS app that turns weekly photo challenges with friends into a shared mosaic.',
        description:
            'Designed and built a native SwiftUI iOS app, where friend groups take on weekly photo challenges that contribute to a shared photo mosaic!',
        bullets: [
            'Built an Express REST API backed by Supabase, handling authentication, request validation, and per-group tenant isolation while powering the weekly challenge flow, social feed, and push notifications',
            'Designed a FastAPI image-processing microservice, orchestrated by the Express backend, that builds the photomosaic by partitioning target images into tiles and matching photos using visual similarity metrics',
        ],
        tech: ['Swift', 'SwiftUI', 'TypeScript', 'Express.js', 'Python', 'FastAPI', 'Supabase'],
        status: 'In App Store private preview',
        featured: true,
        color: 'blue',
        sticker: 'mosaic',
        images: [{ src: '/assets/projects/mosaic_1-cropped.webp', alt: 'Mosaic app showing a shared photo mosaic and weekly challenge progress', width: 1170, height: 2382 }],
    },
    {
        slug: 'true-talent',
        title: 'True Talent',
        shortTitle: 'Talent',
        summary: 'An AI-assisted coding interview platform that helps interviewers spot cheating.',
        org: 'LA Hacks 2025',
        description:
            'Created a code-interview website that helps detect cheating using AI, allowing companies to find the truly talented.',
        bullets: [
            'Made a responsive website using React, Node.js, and WebSockets, allowing for real time interviews',
            'Used Google Gemini to analyze video, audio, and code for suspicious behavior, providing helpful feedback and follow-up questions for interviewers',
        ],
        tech: ['React', 'Node.js', 'Python', 'Flask'],
        link: { href: 'https://devpost.com/software/realcoder', label: 'View on Devpost' },
        featured: true,
        color: 'green',
        sticker: 'true-talent',
    },
    {
        slug: 'morii',
        title: 'Morii',
        summary: 'A social app for sharing moods and expressing yourself authentically.',
        description:
            'Collaborated on a social media app designed to promote emotional awareness and authentic self-expression.',
        bullets: [
            'Implemented core frontend features using Swift, including a sign-in flow, custom nav bar, homepage, and user profiles',
            'Wrote and tested RESTful API endpoints that returned mood summaries and analytics over customizable time frames',
        ],
        tech: ['Swift', 'Express.js', 'Node.js', 'MongoDB'],
        link: {
            href: 'https://apps.apple.com/us/app/morii-moments-that-stay/id6746750544',
            label: 'View on the App Store',
        },
        color: 'coral',
        sticker: 'morii',
        images: [{ src: '/assets/projects/morii_1.webp', alt: 'Morii promotional artwork showing its mood-sharing feed', width: 459, height: 998 }],
    },
    {
        slug: 'btd-training-camp',
        title: 'Bloon Tower Defense Training Camp',
        previewTitle: 'Bloon TD',
        shortTitle: 'Bloon TD',
        summary: 'A 3D first-person aim trainer inspired by Bloons Tower Defense and Aim Labs.',
        description:
            'Created a 3D first-person shooter aim trainer inspired by Balloon Towers Defense and Aim Labs.',
        bullets: [
            'Overhauled balloon movement and added settings, allowing for more customizable gameplay',
            'Created custom assets for various objects in game, improving game quality and completeness',
        ],
        tech: ['Three.js', 'Blender'],
        link: { href: 'https://diandyw.github.io/BTDTrainingCamp/', label: 'Play in the browser' },
        color: 'yellow',
        sticker: 'btd',
        images: [
            { src: '/assets/projects/btd_1.webp', alt: 'Bloon TD Training Camp first-person gameplay with balloons and a machine gun', width: 3420, height: 1862 },
            { src: '/assets/projects/btd_2.webp', alt: 'Bloon TD Training Camp title screen with play, settings, and leaderboard options', width: 3420, height: 1868 },
        ],
    },
    {
        slug: 'temple-of-doom',
        title: 'Temple of Doom',
        shortTitle: 'Temple',
        summary: 'A C++ dungeon game with real-time maps and enemies that find their way to you.',
        description:
            'Designed and developed a 2D dungeon-style game using C++ inspired by classic arcade games.',
        bullets: [
            'Optimized recursive algorithms for enemy movement, improving processing times by 70% for a smoother experience',
            'Implemented real-time map rendering and random map generation, enhancing gameplay variability',
        ],
        tech: ['C++'],
        status: '',
        color: 'orange',
        sticker: 'temple',
    },
];
