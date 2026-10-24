export type ProjectColor = 'blue' | 'green' | 'coral' | 'yellow' | 'orange' | 'sky';
export type StickerId = 'mosaic' | 'true-talent' | 'morii' | 'btd' | 'temple';

export type Project = {
    slug: string;
    title: string;
    // Compact name for the tabs, when the title is too long to fit.
    shortTitle?: string;
    org?: string;
    description: string;
    bullets: [string, string];
    tech: string[];
    // Shown when there is a public link; otherwise `status` takes its place.
    link?: { href: string; label: string };
    status?: string;
    featured?: boolean;
    color: ProjectColor;
    sticker?: StickerId;
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
    },
    {
        slug: 'true-talent',
        title: 'True Talent',
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
    },
    {
        slug: 'btd-training-camp',
        title: 'Bloon Tower Defense Training Camp',
        shortTitle: 'Bloon TD',
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
    },
    {
        slug: 'temple-of-doom',
        title: 'Temple of Doom',
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
