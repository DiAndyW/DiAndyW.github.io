export function AboutSection() {
    return (
        <div className="flex self-center items-center">
            <div className="mt-8 font-normal">
                <img src="/assets/pic.jpg" alt="cat" className="w-1/3 h-auto ml-4 block border-2 border-[#5d97b3] rounded-full max-w-48" />
                <h1 className="text-3xl sm:text-4xl lg:text-5xl p-4">
                Hi! I'm Andy Wang
                </h1>
                <p className="text-base sm:text-lg p-4 pb-2">
                I am an aspiring software developer who is passionate about using their skills to improve the lives of others while also exploring and pushing my own limits.
                Some industries I'm interested in are the environment, biotech, and education. I strive to build things that make a meaningful difference in the world.
                </p>
                <p className="text-base sm:text-lg p-4 pt-2">
                I'm currently a third year undergrad at UCLA. Throughout my time here, I've worked on several projects, with my most recent being
                <a href="https://www.clubhousebruins.com/" target="_blank" rel="noopener noreferrer" className="underline ml-1 text-[#5d97b3] hover:text-[#7bb3d1]">ClubHouse</a>
                , which helps UCLA
                students discover new clubs and rate clubs they're in!
                </p>
                <p className="text-base sm:text-lg p-4 pt-2">
                When I'm not working, you can catch me going on a run after the gym, playing video games, playing piano, chefing up in the kitchen,
                getting shots up at basketball court, or scrolling through cat videos.
                </p>
                <p className="text-base sm:text-lg p-4 pt-2">
                Feel free to reach out, I hope you have a great day! :D
                </p>
            </div>
        </div>
    );
    
}