export function Footer() {
    return (
        <div className="flex justify-center px-4 py-8 sm:py-12 md:py-16 lg:py-20">
            <div className="text-center text-sm sm:text-base max-w-md">
                <p>
                    You've reached the bottom. Thanks for visiting! Check out my
                    <a 
                        href="/assets/Andy_Wang_Resume.pdf" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="mx-1 text-[#5d97b3] hover:text-[#7bb3d1] transition-colors underline"
                    > 
                        resume 
                    </a>
                    if you'd like.
                </p>
            </div>
        </div>
    );
}