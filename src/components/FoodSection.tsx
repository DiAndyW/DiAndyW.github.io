'use client';

import React, { useState } from 'react';

interface DishCard {
  id: number;
  name: string;
  description: string;
  src: string;
}

const dishes: DishCard[] = [
  {
    id: 1,
    name: 'Soy Garlic Chicken Bowl',
    description: 'First dish I made after finals. Feels good to relax',
    src: 'assets/img1.jpg',
  },
  {
    id: 2,
    name: 'Loco Moco',
    description: 'The sauce on this amplified everything around it',
    src: 'assets/img2.jpg',
  },
  {
    id: 3,
    name: 'Japanese Beef Curry Bowl',
    description: 'A classic',
    src: 'assets/img3.jpg',
  },
  {
    id: 4,
    name: 'Sour and Spicy Malatang',
    description: 'Perfect for a chilly night',
    src: 'assets/img4.jpg',
  },
  {
    id: 5,
    name: 'Galbi-jjim',
    description: 'Expensive but so worth it',
    src: 'assets/img5.jpg',
  },
];

const FoodSection: React.FC = () => {
  const [activeId, setActiveId] = useState<number | null>(null);

  return (
    <div className="mt-4 font-normal">
      <h2 className="text-white mb-6 px-4">Good food I've enjoyed</h2>
      <div className="columns-2 gap-3 px-4">
        {dishes.map((dish) => (
          <div
            key={dish.id}
            onClick={() => setActiveId(activeId === dish.id ? null : dish.id)}
            className={`group relative mb-4 break-inside-avoid rounded-lg overflow-hidden border-2 transition-colors duration-300 cursor-pointer ${
              activeId === dish.id ? 'border-[#7bb3d1]' : 'border-white/30 hover:border-[#7bb3d1]'
            }`}
          >
            {/* Image */}
            <img
              src={dish.src}
              alt={dish.name}
              className="w-full h-auto block"
            />

            {/* Overlay — hover on desktop, click on mobile */}
            <div className={`absolute inset-x-0 bottom-0 transition-transform duration-300 ease-in-out bg-[#1a2f3a]/90 backdrop-blur-sm p-3 ${
              activeId === dish.id ? 'translate-y-0' : 'translate-y-full group-hover:translate-y-0'
            }`}>
              <p className="text-white text-xs sm:text-sm font-semibold">{dish.name}</p>
              <p className="text-white/60 text-[10px] sm:text-xs mt-1 leading-relaxed">{dish.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FoodSection;
