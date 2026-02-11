export function FriendsSection() {
    const People = [
        {
            id: 1,
            name: "Hannah Gonzalez",
            link: "https://hannahskyg.github.io/",
        },
        {
            id: 2,
            name: "Travis (Sryno)",
            link: "https://syrno.net/",
        },
        {
            id: 3,
            name: "Homan Qiu",
            link: "https://i-am.fish/",
        },
        {
            id: 4,
            name: "Charlton Shih",
            link: "https://chewton2k.github.io/CharltonShih/",
        },
        {
            id: 5,
            name: "Erica Huang",
            link: "https://kittenluv1.com/",
        },
        {
            id: 6,
            name: "Kenny Guo",
            link: "https://kguo12.github.io/kennyguowebpage/",
        }
    ]

    return (
        <div className="flex items-center">
            <div className="mt-8 font-normal">
                <div className="text-3xl sm:text-4xl lg:text-5xl p-2 sm:p-4">
                    Friends
                </div>
                <h2 className="text-white mb-4 mt-4 px-4">
                    A list of other awesome people!
                </h2>

                <div className="px-4">
                    {People.map((item) => (
                        <div
                            key={item.id}
                        >
                            • <a href={item.link} className="underline text-[#5d97b3] hover:text-[#7bb3d1]">{item.name}</a>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}