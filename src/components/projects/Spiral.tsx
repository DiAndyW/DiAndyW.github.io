// A row of two-tone binder rings, each with a punched hole just below it.
// The parent positions this and gives it its width; the rings spread evenly across it.
export default function Spiral({
    rings,
    ringWidth,
    ringHeight,
}: {
    rings: number;
    ringWidth: number;
    ringHeight: number;
}) {
    const hole = ringWidth - 2;
    return (
        <div aria-hidden="true" className="flex w-full justify-between">
            {Array.from({ length: rings }, (_, k) => (
                <div
                    key={k}
                    className="relative"
                    style={{ width: ringWidth, height: ringHeight + 6 }}
                >
                    <div
                        className="absolute left-px rounded-full bg-[#0b1219]"
                        style={{ top: ringHeight - 6, width: hole, height: hole }}
                    />
                    <div
                        className="absolute left-0 top-0 flex overflow-hidden"
                        style={{ width: ringWidth, height: ringHeight, borderRadius: ringWidth / 2 }}
                    >
                        <div className="flex-1 bg-[#d1d5db]" />
                        <div className="flex-1 bg-[#9ca3af]" />
                    </div>
                </div>
            ))}
        </div>
    );
}
