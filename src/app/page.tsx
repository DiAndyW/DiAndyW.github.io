'use client';

import { useState, useEffect } from 'react';
import { AboutSection } from "../components/AboutSection";
import ExperienceSection from "../components/ExperienceSection";
import ProjectSection from "../components/ProjectSection";
import { FriendsSection } from '../components/FriendsSection';
import InterestsSection from '../components/InterestsSection';
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";

const smoothScrollTo = (targetY: number, duration = 1000) => {
  const startY = window.scrollY;
  const diff = targetY - startY;
  let start: number | null = null;

  const ease = (t: number) =>
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

  const step = (timestamp: number) => {
    if (!start) start = timestamp;
    const progress = Math.min((timestamp - start) / duration, 1);
    window.scrollTo(0, startY + diff * ease(progress));
    if (progress < 1) requestAnimationFrame(step);
  };

  requestAnimationFrame(step);
};

interface NavItem {
  id: string;
  label: string;
}

interface MobileFABNavProps {
  navItems: NavItem[];
  activeSection: string;
}

const MobileFABNav = ({ navItems, activeSection }: MobileFABNavProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const handleNavClick = (id: string) => {
    setIsExpanded(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="fixed top-6 left-6 z-50 md:hidden">
      {/* Backdrop */}
      {isExpanded && (
        <div
          className="fixed inset-0 -z-10"
          onClick={() => setIsExpanded(false)}
        />
      )}

      {/* Main FAB Button */}
      <button
        onClick={toggleExpanded}
        className={`
          w-14 h-14 bg-[#2d4a57]/80 text-white rounded-full shadow-lg
          transition-all duration-300 hover:scale-110 active:scale-95
          flex items-center justify-center mt-3
          hover:bg-[#5d97b3]/80 focus:outline-none focus:ring-2 focus:ring-[#7bb3d1]
          ${isExpanded ? 'rotate-0 bg-[#5d97b3]' : 'rotate-0'}
        `}
      >
        {/* Menu Icon */}
        <div className="relative w-6 h-6">
          <div className={`absolute inset-0 transition-all duration-300 ${
            isExpanded ? 'opacity-0 rotate-90' : 'opacity-100 rotate-0'
          }`}>
            <div className="w-6 h-0.5 bg-white absolute top-1.5 left-0 rounded"></div>
            <div className="w-6 h-0.5 bg-white absolute top-3 left-0 rounded"></div>
            <div className="w-6 h-0.5 bg-white absolute top-4.5 left-0 rounded"></div>
          </div>
          <div className={`absolute inset-0 transition-all duration-300 ${
            isExpanded ? 'opacity-100 rotate-0' : 'opacity-0 rotate-90'
          }`}>
            <div className="w-6 h-0.5 bg-white absolute top-3.5 left-0 rounded rotate-45 origin-center"></div>
            <div className="w-6 h-0.5 bg-white absolute top-3.5 left-0 rounded -rotate-45 origin-center"></div>
          </div>
        </div>
      </button>

      {/* Navigation Items */}
      <div className={`relative mt-4 transition-all duration-300 ${
        isExpanded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
      }`}>
        <div className="bg-gray-800 border border-[#7bb3d1] rounded-lg p-4 space-y-3">
          {navItems.map((item, index) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`
                block w-full bg-[#2d4a57]/20 text-white px-4 py-2 rounded-full shadow-lg
                transition-all duration-300 hover:scale-105 active:scale-95
                text-sm font-medium whitespace-nowrap
                transform
                ${activeSection === item.id
                  ? 'bg-[#5d97b3] text-white ring-2 ring-[#7bb3d1]'
                  : 'hover:bg-[#33505e]'
                }
              `}
              style={{
                transitionDelay: isExpanded ? `${index * 50}ms` : '0ms'
              }}
            >
              {item.label}
            </button>
          ))}
          <div className="flex items-center justify-center gap-3 pt-2 border-t border-white/10">
            <a href='https://github.com/DiAndyW' target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <img src='/assets/github-white.svg' className="w-6" alt="GitHub" />
            </a>
            <a href='https://www.linkedin.com/in/di-xuan-wang/' target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <img src='/assets/InBug-White.png' className="w-6" alt="LinkedIn" />
            </a>
            <a href='/assets/Andy_Wang_Resume.pdf' target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <img src='/assets/icons-resume.png' className="w-6" alt="Resume" />
            </a>
            <a href='mailto:andy.dxwang@gmail.com' className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <img src='/assets/mail-svgrepo-com.svg' className="w-6" alt="Email" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function Home() {
  const [activeSection, setActiveSection] = useState<string>('about');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries: IntersectionObserverEntry[]) => {
        entries.forEach((entry: IntersectionObserverEntry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      {
        rootMargin: '-50% 0px -50% 0px',
        threshold: 0
      }
    );

    const sections = document.querySelectorAll('section');
    sections.forEach((section: Element) => observer.observe(section));

    return () => {
      sections.forEach((section: Element) => observer.unobserve(section));
    };
  }, []);

  const navItems: NavItem[] = [
    { id: 'about', label: 'About' },
    { id: 'experience', label: 'Experience' },
    { id: 'projects', label: 'Projects' },
    { id: 'interests', label: 'Interests' },
    { id: 'friends', label: 'Friends' },
  ];

  return (
    <div className="scroll-smooth">
      <Header />

      <div className="flex justify-center pt-4 relative">
        <div
          className="fixed top-0 left-0 right-0 z-40 pointer-events-none"
          style={{
            height: '150px',
            background: `linear-gradient(180deg,
              rgb(17, 24, 39) 0%,
              rgb(17, 24, 39) 65%,
              rgba(17, 24, 39, 0.8) 70%,
              rgba(17, 24, 39, 0.4) 85%,
              rgba(17, 24, 39, 0) 100%)`
          }}
        />

        <div className="flex w-full max-w-7xl items-start px-2 sm:px-4">
          <aside className="hidden md:block px-1 sm:px-2 md:px-4 py-4 w-16 sm:w-20 md:w-24 lg:w-1/7 flex-shrink-0 sticky top-24 z-50 min-w-0">
            <ul className="space-y-1 sm:space-y-2">
              {navItems.map((item) => (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      const el = document.getElementById(item.id);
                      if (el) {
                        const headerHeight = document.getElementById('main-header')?.offsetHeight ?? 0;
                        smoothScrollTo(el.getBoundingClientRect().top + window.scrollY - headerHeight);
                      }
                    }}
                    className={`hover:text-[#5d97b3] transition-all duration-200 block
                      ${activeSection === item.id
                        ? 'font-bold text-[#5d97b3]'
                        : ''}
                      text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl
                      leading-tight
                    `}
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </aside>

          <main className="flex-1 px-2 sm:px-4">
            <section id="about">
              <AboutSection />
            </section>
            <section id="experience">
              <ExperienceSection />
            </section>
            <section id="projects">
              <ProjectSection />
            </section>
            <section id="interests">
              <InterestsSection />
            </section>
            <section id="friends">
              <FriendsSection />
            </section>
          </main>

          <div className="hidden md:block w-12 lg:w-1/6 flex-shrink-0 p-2 lg:p-4">
            {/* <img src='../assets/cat.jpg' alt="cat" className="w-full h-auto"/> */}
          </div>
        </div>
      </div>

      <MobileFABNav navItems={navItems} activeSection={activeSection} />

      <Footer />
    </div>
  );
}
