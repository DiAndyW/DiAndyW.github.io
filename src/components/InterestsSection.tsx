'use client';

import React, { useState, useRef } from 'react';
import SpotifySection from './SpotifySection';
import GamingSection from './GamingSection';
import FoodSection from './FoodSection';

const TABS = [
  { id: 'music', label: 'Music' },
  { id: 'gaming', label: 'Gaming' },
  { id: 'food', label: 'Food' },
  { id: 'misc', label: 'Misc' },
] as const;

type TabId = typeof TABS[number]['id'];

const miscCards = [
  {
    id: 1,
    type: 'text' as const,
    frontDisplay: '5',
    title: "The number of cats I've had",
    backTitle: '',
    facts: [
      'Aurora (Orange)',
      'Sunny (Orange) + Luna (Calico) (Siblings)',
      'Emma (Orange) (I looked after her for a friend)',
      'Cinder (Gray) (Short for Cinderella)',
    ],
  },
  {
    id: 2,
    type: 'image' as const,
    src: '/assets/rain.jpg',
    backTitle: 'Post Rain at UCLA',
    facts: ['I love rain'],
  },
];

const FlipCards: React.FC = () => {
  const [flipped, setFlipped] = useState<number | null>(null);
  const isTouch = useRef(false);

  return (
    <div className="flex flex-wrap justify-center gap-4 sm:gap-6 px-4 py-4">
      {miscCards.map((card) => (
        <div
          key={card.id}
          className="w-[calc(50%-0.5rem)] sm:w-64"
          style={{ perspective: '1000px' }}
          onMouseEnter={() => { if (!isTouch.current) setFlipped(card.id); }}
          onMouseLeave={() => { if (!isTouch.current) setFlipped(null); }}
          onTouchStart={() => {
            isTouch.current = true;
            setFlipped(flipped === card.id ? null : card.id);
          }}
        >
          <div className="relative w-full aspect-[4/5]" style={{ transformStyle: 'preserve-3d' }}>
            {/* Front */}
            <div
              className="absolute inset-0 rounded-lg border-2 border-white/30 bg-[#2d4a57]/20 backdrop-blur-sm p-3 sm:p-6 flex flex-col items-center justify-center"
              style={{
                backfaceVisibility: 'hidden',
                transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: flipped === card.id ? 'rotateY(180deg)' : 'rotateY(0deg)',
              }}
            >
              {card.type === 'text' ? (
                <>
                  <div className="text-4xl sm:text-6xl mb-2 sm:mb-4">{card.frontDisplay}</div>
                  <h3 className="text-sm sm:text-xl font-bold text-white text-center">{card.title}</h3>
                </>
              ) : (
                <div className="absolute inset-0">
                  <img src={card.src} alt="Card" className="w-full h-full object-cover rounded-lg" />
                </div>
              )}
            </div>

            {/* Back */}
            <div
              className="absolute inset-0 rounded-lg border-2 border-white/30 bg-[#2d4a57]/20 backdrop-blur-sm p-3 sm:p-6 flex flex-col justify-center"
              style={{
                backfaceVisibility: 'hidden',
                transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: flipped === card.id ? 'rotateY(0deg)' : 'rotateY(-180deg)',
              }}
            >
              {card.backTitle && (
                <h3 className="text-sm sm:text-xl font-bold text-white text-center mb-3 sm:mb-6">{card.backTitle}</h3>
              )}
              <div className="space-y-1.5 sm:space-y-3">
                {card.facts.map((fact, i) => (
                  <div key={i} className="text-white flex items-start">
                    <span className="mr-1.5 text-xs sm:text-sm">•</span>
                    <span className="text-xs sm:text-sm">{fact}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const InterestsSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('music');

  return (
    <div className="mt-8 font-normal">
      <h1 className="text-3xl sm:text-4xl lg:text-5xl p-2 sm:p-4">Interests</h1>
      <h2 className="text-white mb-6 mt-4 px-4">A few things I enjoy outside of work</h2>

      {/* Slash-separated tabs */}
      <div className="flex items-center gap-2 px-4 mb-6">
        {TABS.map((tab, i) => (
          <React.Fragment key={tab.id}>
            {i > 0 && <span className="text-white/20 text-sm select-none">/</span>}
            <button
              onClick={() => setActiveTab(tab.id)}
              className={`
                text-sm font-medium transition-colors duration-200
                ${activeTab === tab.id
                  ? 'text-white'
                  : 'text-white/40 hover:text-white/70'
                }
              `}
            >
              {tab.label}
            </button>
          </React.Fragment>
        ))}
      </div>

      {/* Content panel */}
      <div className="relative overflow-hidden">
        {TABS.map((tab) => (
          <div
            key={tab.id}
            style={{
              transition: 'opacity 0.25s ease, transform 0.25s ease',
              opacity: activeTab === tab.id ? 1 : 0,
              transform: activeTab === tab.id ? 'translateY(0)' : 'translateY(8px)',
              position: activeTab === tab.id ? 'relative' : 'absolute',
              pointerEvents: activeTab === tab.id ? 'auto' : 'none',
              inset: activeTab === tab.id ? undefined : 0,
            }}
          >
            {tab.id === 'music' && <SpotifySection />}

            {tab.id === 'gaming' && <GamingSection />}

            {tab.id === 'food' && <FoodSection />}

            {tab.id === 'misc' && (
              <div>
                <h2 className="text-white mb-4 mt-2 px-4">
                  Random snippets and facts from my life!
                </h2>
                <FlipCards />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default InterestsSection;
