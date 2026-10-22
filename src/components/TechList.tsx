import React from 'react';

// Technologies as plain text ("Go · Kubernetes · Azure") so they don't read as clickable pills
const TechList = ({
    technologies,
    className = 'text-sm text-gray-300',
}: {
    technologies: string[];
    className?: string;
}) => {
    if (technologies.length === 0) return null;
    return (
        <p className={`leading-relaxed ${className}`}>
            {technologies.map((technology, index) => (
                <React.Fragment key={technology}>
                    {index > 0 && <span className="text-gray-500"> · </span>}
                    {technology}
                </React.Fragment>
            ))}
        </p>
    );
};

export default TechList;
