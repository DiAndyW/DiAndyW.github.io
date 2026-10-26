export function Footer() {
    return (
        <div className="flex justify-center px-4 py-8 sm:py-12 md:py-16 lg:py-20">
            <div className="text-center text-sm sm:text-base max-w-md">
                <p>
                    You've reached the bottom. Thanks for visiting!
                </p>
                <p className="mt-4 text-gray-400 text-xs">
                    © {new Date().getFullYear()} Andy Wang. All rights reserved.
                </p>
            </div>
        </div>
    );
}