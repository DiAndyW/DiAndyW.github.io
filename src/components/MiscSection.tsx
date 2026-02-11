import React from "react";

interface BaseCard {
    id: number;
    type: 'text' | 'image';
    backContent: {
        title: string;
        facts: string[];
    };
}

interface TextCard extends BaseCard {
    type: 'text';
    title: string;
    frontImage: string;
    frontText: string;
}

interface ImageCard extends BaseCard {
    type: 'image';
    frontImage: string;
    isLocalImage?: boolean; 
}

type CardContent = TextCard | ImageCard;

const MiscSection: React.FC = () => {
    const Content: CardContent[] = [
        {
            id: 1,
            type: 'text',
            title: "The number of cats I've had",
            frontImage: "5",
            frontText: "",
            backContent: {
                title: "",
                facts: [
                    "Aurora (Orange)",
                    "Sunny (Orange) + Luna (Calico) (Siblings)",
                    "Emma (Orange) (I looked after her for a friend)",
                    "Cinder (Gray) (Short for Cinderella)"
                ]
            }
        },
        {
            id: 2,
            type: 'image',
            frontImage: "/assets/rain.jpg", 
            isLocalImage: true,
            backContent: {
                title: "Post Rain at UCLA",
                facts: [
                    "I love rain",
                    "Thanks for reading"
                ]
            }
        },
        {
            id: 3,
            type: 'text',
            title: "What's been on repeat",
            frontImage: "🎵",
            frontText: "",
            backContent: {
                title: "Can't get 'em out of my head!",
                facts: [
                    "Laufey - A Matter of Time",
                    "Daniel Caeser - Who Knows",
                    "Hu Xia - 那些年",
                    "YOASOBI - 海のまにまに"
                ]
            }
        }
    ];

    return (
        <div className="flex items-center">
            <div className="mt-8 font-normal">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl p-2 sm:p-4">
                    Misc
                </h1>
                <h2 className="text-white mb-4 mt-4 px-4">
                    Here are some random snippets or facts from my life!
                </h2>

                <div className="flex flex-wrap gap-6 justify-center px-4">
                    {Content.map((item) => (
                        <div 
                            key={item.id} 
                            className="group"
                            style={{ perspective: '1000px' }}
                        >
                            <div 
                                className="relative w-64 h-80 transition-transform duration-800"
                                style={{
                                    transformStyle: 'preserve-3d',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'rotateY(180deg)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'rotateY(0deg)';
                                }}
                                // touch support for mobile
                                onTouchStart={(e) => {
                                    e.currentTarget.style.transform = 'rotateY(180deg)';
                                }}
                            >
                                {/* Front of card */}
                                <div 
                                    className="absolute inset-0 w-full h-full rounded-lg border border-white/30 border-2 bg-[#2d4a57]/20 backdrop-blur-sm p-6 flex flex-col items-center justify-center hover:shadow-lg transition-shadow duration-200"
                                    style={{
                                        backfaceVisibility: 'hidden'
                                    }}
                                >
                                    {item.type === 'text' ? (
                                        // Text card front
                                        <>
                                            <div className="text-6xl mb-4">
                                                {item.frontImage}
                                            </div>
                                            <h3 className="text-xl font-bold text-white text-center mb-2">
                                                {item.title}
                                            </h3>
                                            <p className="text-white/80 text-center">
                                                {item.frontText}
                                            </p>
                                        </>
                                    ) : (
                                        // Image card front - fills entire card
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            {item.isLocalImage ? (
                                                <img 
                                                    src={item.frontImage} 
                                                    alt="Card image"
                                                    className="w-full h-full object-cover rounded-lg"
                                                />
                                            ) : (
                                                <div className="text-[12rem] leading-none">
                                                    {item.frontImage}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Back of card */}
                                <div 
                                    className="absolute inset-0 w-full h-full rounded-lg border border-white/30 border-2 bg-[#2d4a57]/20 backdrop-blur-sm p-6 flex flex-col justify-center"
                                    style={{
                                        backfaceVisibility: 'hidden',
                                        transform: 'rotateY(180deg)'
                                    }}
                                >
                                    <h3 className="text-xl font-bold text-white text-center mb-6">
                                        {item.backContent.title}
                                    </h3>
                                    <div className="space-y-3">
                                        {item.backContent.facts.map((fact, index) => (
                                            <div key={index} className="text-white flex items-start">
                                                <span className="mr-2">•</span>
                                                <span className="text-sm">{fact}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default MiscSection;