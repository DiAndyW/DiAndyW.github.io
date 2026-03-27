'use client';

import React from 'react';

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
  return (
    <div className="mt-4 font-normal">
      <h2 className="text-white mb-6 px-4">Good food I've enjoyed</h2>
      <div className="columns-2 gap-4 px-4 max-w-[75%]">
        {dishes.map((dish) => (
          <div
            key={dish.id}
            className="group relative mb-4 break-inside-avoid rounded-lg overflow-hidden border-2 border-white/30 hover:border-[#7bb3d1] transition-colors duration-300"
          >
            {/* Image */}
            <img
              src={dish.src}
              alt={dish.name}
              className="w-full h-auto block"
            />

            {/* Hover overlay */}
            <div className="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out bg-[#1a2f3a]/90 backdrop-blur-sm p-3">
              <p className="text-white text-sm font-semibold">{dish.name}</p>
              <p className="text-white/60 text-xs mt-1 leading-relaxed">{dish.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FoodSection;
