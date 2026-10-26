import Notepad from './projects/Notepad';

const ProjectSection = () => {
    return (
        <div className="mt-8 font-normal">
            <h1 className="p-2 text-3xl sm:p-4 sm:text-4xl lg:text-5xl">Projects</h1>
            <div className="mt-4 px-2 sm:px-4">
                <Notepad />
            </div>
        </div>
    );
};

export default ProjectSection;
