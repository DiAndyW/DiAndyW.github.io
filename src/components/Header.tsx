export function Header() {
    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="flex justify-center sticky top-0 z-50 bg-gray-900">
            <header className="w-7/10 mt-6 mb-2">
                <div className="px-6 py-4">
                    <div className="grid grid-cols-12 items-center">
                        <div className="col-span-6">
                            <button 
                                onClick={scrollToTop}
                                className="text-3xl font-medium text-white hover:text-[#7bb3d1] transition-colors bg-transparent border-none cursor-pointer"
                            >
                                Andy Wang
                            </button>
                        </div>
                            
                        <div className="col-span-6 flex items-center justify-end gap-3">
                            <a href='https://github.com/DiAndyW' className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                                <img src='/assets/github-white.svg' className="w-8" alt="GitHub" />
                            </a>
                            <a href='https://www.linkedin.com/in/di-xuan-wang/' className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                                <img src='/assets/InBug-White.png' className="w-9" alt="LinkedIn" />
                            </a>
                            <a href='/assets/Andy_Wang_Resume.pdf' className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                                <img src='/assets/icons-resume.png' alt='Resume' className="w-9" />
                            </a>
                            <a href='mailto:andy.dxwang@gmail.com' className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                                <img src='/assets/mail-svgrepo-com.svg' alt='Email' className="w-9" />
                            </a>
                        </div>
                    </div>
                </div>
            </header>
        </div>
    );
}