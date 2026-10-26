'use client';

import { useContact } from './contact/ContactProvider';

export function Header() {
    const openContact = useContact();
    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <>
        <div className="h-24 md:hidden" aria-hidden="true" />
        <div id="main-header" className="flex justify-center fixed inset-x-0 top-0 md:sticky z-50 bg-gray-900">
            <header className="w-full md:w-7/10 mt-6 mb-2">
                <div className="px-4 md:px-6 py-4">
                    <div className="grid grid-cols-12 items-center">
                        <div className="col-span-12 md:col-span-6 flex justify-center md:justify-start">
                            <button
                                onClick={scrollToTop}
                                className="text-2xl md:text-3xl font-medium text-white hover:text-[#7bb3d1] transition-colors bg-transparent border-none cursor-pointer"
                            >
                                Andy Wang
                            </button>
                        </div>

                        <div className="col-span-6 hidden md:flex items-center justify-end gap-1 md:gap-3">
                            <a href='https://github.com/DiAndyW' target="_blank" rel="noopener noreferrer" className="p-1.5 md:p-2 hover:bg-white/10 rounded-lg transition-colors">
                                <img src='/assets/github-white.svg' className="w-6 md:w-8" alt="GitHub" />
                            </a>
                            <a href='https://www.linkedin.com/in/di-xuan-wang/' target="_blank" rel="noopener noreferrer" className="p-1.5 md:p-2 hover:bg-white/10 rounded-lg transition-colors">
                                <img src='/assets/InBug-White.png' className="w-6 md:w-9" alt="LinkedIn" />
                            </a>
                            <button type="button" onClick={(event) => openContact(event.currentTarget)} aria-label="Get in touch" aria-haspopup="dialog" className="p-1.5 md:p-2 hover:bg-white/10 rounded-lg transition-colors">
                                <img src='/assets/mail-svgrepo-com.svg' alt='' aria-hidden="true" className="w-6 md:w-9" />
                            </button>
                        </div>
                    </div>
                </div>
            </header>
        </div>
        </>
    );
}
