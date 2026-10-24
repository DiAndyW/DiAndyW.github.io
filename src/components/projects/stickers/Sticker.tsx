import type { ReactNode } from 'react';
import { TWO_TONE, type Project, type StickerId } from '../projectsData';

// Flat SVG illustrations, ported from the Sticker design artboard (viewBox 240 x 180).
// Every motif is drawn on top of the tile; the shared right-half overlay is added by Sticker.

const LABELS: Record<StickerId, string> = {
    mosaic: 'Photo tiles coming together into a heart, for Mosaic',
    'true-talent': 'A magnifying glass over a code window, for True Talent',
    morii: 'A smiling face with a heart and sparkles, for Morii',
    btd: 'Three balloons with a crosshair on one, for Bloon Tower Defense Training Camp',
    temple: 'A stone temple doorway between two torches, for Temple of Doom',
};

// [x, y, fill] for each 17px photo tile; the heart is built from these.
const MOSAIC_TILES: [number, number, string][] = [
    [70, 30, '#fff7ea'], [90, 30, '#ffd76e'], [130, 30, '#a9cd62'], [150, 30, '#fff7ea'],
    [50, 50, '#ef7d6a'], [70, 50, '#a9cd62'], [90, 50, '#fff7ea'], [110, 50, '#ffd76e'], [130, 50, '#ef7d6a'], [150, 50, '#ffd76e'], [170, 50, '#a9cd62'],
    [50, 70, '#fff7ea'], [70, 70, '#f59a45'], [90, 70, '#a9cd62'], [110, 70, '#fff7ea'], [130, 70, '#a9cd62'], [150, 70, '#fff7ea'], [170, 70, '#ef7d6a'],
    [70, 90, '#ffd76e'], [90, 90, '#ef7d6a'], [110, 90, '#a9cd62'], [130, 90, '#f59a45'], [150, 90, '#ffd76e'],
    [90, 110, '#fff7ea'], [110, 110, '#ef7d6a'],
    [110, 130, '#ffd76e'],
];

const MOTIFS: Record<StickerId, ReactNode> = {
    mosaic: (
        <>
            {MOSAIC_TILES.map(([x, y, fill]) => (
                <rect key={`${x}-${y}`} x={x} y={y} width="17" height="17" rx="4" fill={fill} />
            ))}
            {/* the empty slot, then the two tiles flying in */}
            <rect x="130" y="110" width="17" height="17" rx="4" fill="#fff7ea" opacity=".35" />
            <rect x="190" y="104" width="17" height="17" rx="4" fill="#fff7ea" transform="rotate(14 198 112)" />
            <rect x="200" y="132" width="17" height="17" rx="4" fill="#a9cd62" transform="rotate(-10 208 140)" />
            <path d="M168 120 C176 116 182 114 188 112" fill="none" stroke="#fff7ea" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="2 6" opacity=".8" />
        </>
    ),
    'true-talent': (
        <>
            <rect x="38" y="34" width="132" height="96" rx="12" fill="#fff7ea" />
            <circle cx="54" cy="48" r="3.5" fill="#ef7d6a" />
            <circle cx="65" cy="48" r="3.5" fill="#ffd76e" />
            <circle cx="76" cy="48" r="3.5" fill="#a9cd62" />
            <rect x="52" y="64" width="54" height="8" rx="4" fill="#6fa0e6" />
            <rect x="64" y="80" width="70" height="8" rx="4" fill="#ddccb0" />
            <rect x="64" y="96" width="44" height="8" rx="4" fill="#ef7d6a" />
            <rect x="52" y="112" width="30" height="8" rx="4" fill="#6fa0e6" />
            <circle cx="150" cy="104" r="30" fill="#ffffff" opacity=".45" />
            <rect x="128" y="96" width="34" height="9" rx="4.5" fill="#ef7d6a" />
            <circle cx="150" cy="104" r="30" fill="none" stroke="#2d4a57" strokeWidth="10" />
            <path d="M172 126 L196 150" fill="none" stroke="#2d4a57" strokeWidth="15" strokeLinecap="round" />
        </>
    ),
    morii: (
        <>
            <circle cx="114" cy="96" r="48" fill="#fff7ea" />
            <path d="M92 88 Q99 80 106 88" fill="none" stroke="#2b1a12" strokeWidth="4" strokeLinecap="round" />
            <path d="M122 88 Q129 80 136 88" fill="none" stroke="#2b1a12" strokeWidth="4" strokeLinecap="round" />
            <ellipse cx="88" cy="104" rx="8" ry="5" fill="#f6a497" />
            <ellipse cx="140" cy="104" rx="8" ry="5" fill="#f6a497" />
            <path d="M102 108 Q114 120 126 108" fill="none" stroke="#2b1a12" strokeWidth="4" strokeLinecap="round" />
            <path d="M178 66 C168 60 165 54 167 49 C169 44 176 44 178 50 C180 44 187 44 189 49 C191 54 188 60 178 66 Z" fill="#ffd76e" />
            <path d="M186 104 L189 112 L197 115 L189 118 L186 126 L183 118 L175 115 L183 112 Z" fill="#fff7ea" />
            <path d="M56 50 L58 55 L63 57 L58 59 L56 64 L54 59 L49 57 L54 55 Z" fill="#fff7ea" />
        </>
    ),
    btd: (
        <>
            <path d="M78 104 C76 120 84 132 78 150" fill="none" stroke="#6b4430" strokeWidth="2" strokeLinecap="round" />
            <path d="M122 92 C120 112 128 128 122 150" fill="none" stroke="#6b4430" strokeWidth="2" strokeLinecap="round" />
            <path d="M168 108 C166 124 174 136 168 150" fill="none" stroke="#6b4430" strokeWidth="2" strokeLinecap="round" />
            <ellipse cx="78" cy="80" rx="22" ry="26" fill="#6fa0e6" />
            <path d="M74 105 L82 105 L78 110 Z" fill="#6fa0e6" />
            <ellipse cx="70" cy="70" rx="5" ry="8" fill="#a7c6f0" />
            <ellipse cx="168" cy="84" rx="22" ry="26" fill="#a9cd62" />
            <path d="M164 109 L172 109 L168 114 Z" fill="#a9cd62" />
            <ellipse cx="160" cy="74" rx="5" ry="8" fill="#c9e294" />
            <ellipse cx="122" cy="62" rx="26" ry="31" fill="#ef7d6a" />
            <path d="M117 92 L127 92 L122 98 Z" fill="#ef7d6a" />
            <ellipse cx="112" cy="50" rx="6" ry="9" fill="#f6a497" />
            <circle cx="122" cy="62" r="20" fill="none" stroke="#2d4a57" strokeWidth="4" />
            <path d="M122 32 V44 M122 80 V92 M92 62 H104 M140 62 H152" fill="none" stroke="#2d4a57" strokeWidth="4" strokeLinecap="round" />
            <circle cx="122" cy="62" r="3" fill="#2d4a57" />
        </>
    ),
    temple: (
        <>
            <rect x="0" y="146" width="240" height="34" fill="#c4703a" />
            <rect x="58" y="138" width="124" height="10" rx="5" fill="#fff7ea" />
            <path d="M76 140 L76 84 C76 52 164 52 164 84 L164 140 Z" fill="#fff7ea" />
            <path d="M92 140 L92 88 C92 66 148 66 148 88 L148 140 Z" fill="#2b1a12" />
            <path d="M76 104 H92 M148 104 H164 M76 122 H92 M148 122 H164 M84 74 L96 82 M156 74 L144 82 M120 56 V66" fill="none" stroke="#ddccb0" strokeWidth="3" strokeLinecap="round" />
            <circle cx="120" cy="108" r="5" fill="#ffd76e" />
            <path d="M120 113 L120 124" fill="none" stroke="#ffd76e" strokeWidth="3.5" strokeLinecap="round" />
            <rect x="47" y="96" width="6" height="34" rx="3" fill="#6b4430" />
            <path d="M50 70 C42 82 44 92 50 96 C56 92 58 82 50 70 Z" fill="#ffd76e" />
            <path d="M50 80 C47 86 48 92 50 94 C52 92 53 86 50 80 Z" fill="#ef7d6a" />
            <rect x="187" y="96" width="6" height="34" rx="3" fill="#6b4430" />
            <path d="M190 70 C182 82 184 92 190 96 C196 92 198 82 190 70 Z" fill="#ffd76e" />
            <path d="M190 80 C187 86 188 92 190 94 C192 92 193 86 190 80 Z" fill="#ef7d6a" />
        </>
    ),
};

// Used when a project has no sticker yet: one cream circle (52% of the frame height) with a sparkle.
function Fallback({ shade }: { shade: string }) {
    return (
        <>
            <circle cx="120" cy="90" r="47" fill="#fff7ea" />
            <path d="M120 66 C122 82 128 88 144 90 C128 92 122 98 120 114 C118 98 112 92 96 90 C112 88 118 82 120 66 Z" fill={shade} />
        </>
    );
}

export default function Sticker({
    project,
    index,
    width,
}: {
    project: Project;
    index: number;
    width: number;
}) {
    const border = Math.max(4, Math.round(width * 0.028));
    const radius = Math.max(8, Math.round(width * 0.05));
    const innerRadius = Math.max(5, Math.round(width * 0.035));
    const lift = Math.max(2, Math.round(width * 0.012));
    const tilt = index % 2 === 0 ? -1.5 : 1.5;
    const { light, shade } = TWO_TONE[project.color];
    const label = project.sticker ? LABELS[project.sticker] : `Illustration for ${project.title}`;

    return (
        <div
            className="relative shrink-0"
            style={{ width, aspectRatio: '4 / 3', transform: `rotate(${tilt}deg)` }}
        >
            {/* flat, unblurred lift */}
            <div
                aria-hidden="true"
                className="absolute"
                style={{
                    left: lift,
                    top: lift,
                    right: -lift,
                    bottom: -lift,
                    borderRadius: radius,
                    background: 'rgba(0,0,0,.35)',
                }}
            />
            <div
                className="absolute inset-0 box-border bg-white"
                style={{ padding: border, borderRadius: radius }}
            >
                <svg
                    role="img"
                    aria-label={label}
                    viewBox="0 0 240 180"
                    preserveAspectRatio="xMidYMid slice"
                    className="block h-full w-full"
                    style={{ borderRadius: innerRadius }}
                >
                    <rect x="0" y="0" width="240" height="180" fill={light} />
                    {project.sticker ? MOTIFS[project.sticker] : <Fallback shade={shade} />}
                    {/* right-half shade, as in the favicon */}
                    <rect x="120" y="0" width="120" height="180" fill="#111827" opacity=".09" />
                </svg>
            </div>
        </div>
    );
}
