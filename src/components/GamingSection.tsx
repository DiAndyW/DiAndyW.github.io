'use client';

import React from 'react';

const GamingSection: React.FC = () => {
    const CurrentFavorites = [
        { id: 1, name: "Baldur's Gate 3" },
        { id: 2, name: "Counter Strike 2" },
        { id: 3, name: "Terraria" },
    ];

    const WantToPlay = [
        { id: 1, name: "Red Dead Redemption 2" },
        { id: 2, name: "Timberborn" },
        { id: 3, name: "Jedi: Fallen Order + Survivor" },
    ];

    const GameList = ({ items }: { items: typeof CurrentFavorites }) => (
        <div className="flex flex-col gap-3 px-4">
            {items.map((item) => (
                <div
                    key={item.id}
                    className="flex items-center gap-4 bg-[#2d4a57]/20 border border-white/30 rounded-lg px-4 py-3 transition-all duration-300"
                >
                    <span className="text-[#5d97b3] text-sm font-medium w-4 flex-shrink-0">{item.id}</span>
                    <span className="text-white font-medium text-sm sm:text-base">{item.name}</span>
                </div>
            ))}
        </div>
    );

    return (
        <div className="mt-4 font-normal">
            <h2 className="text-white mb-4 px-4">My current favorites</h2>
            <GameList items={CurrentFavorites} />

            <h2 className="text-white mt-8 mb-4 px-4">Want to play</h2>
            <GameList items={WantToPlay} />
        </div>
    );
};

export default GamingSection;
