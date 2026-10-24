// Marks a featured project's tab, like a star stuck on a bookmark. Inked like the tab's label so it reads on every colour.
export default function FeaturedStar() {
    return (
        <>
            <svg aria-hidden="true" width="11" height="11" viewBox="0 0 10 10" className="relative shrink-0">
                <path d="M5 .8 6.3 3.5 9.2 3.9 7.1 5.9 7.6 8.8 5 7.4 2.4 8.8 2.9 5.9.8 3.9 3.7 3.5Z" fill="currentColor" />
            </svg>
            <span className="sr-only">Featured: </span>
        </>
    );
}
