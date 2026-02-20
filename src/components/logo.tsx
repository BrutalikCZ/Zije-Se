import React, { useState } from "react";

export const Logo = ({ className, onMouseEnter, onMouseLeave, ...props }: React.SVGProps<SVGSVGElement>) => {
    const [isHovered, setIsHovered] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);

    const handleMouseEnter = (e: React.MouseEvent<SVGSVGElement>) => {
        setIsHovered(true);
        setIsAnimating(true);
        if (onMouseEnter) onMouseEnter(e);
    };

    const handleMouseLeave = (e: React.MouseEvent<SVGSVGElement>) => {
        setIsHovered(false);
        if (onMouseLeave) onMouseLeave(e);
    };

    const handleAnimationIteration = () => {
        if (!isHovered) {
            setIsAnimating(false);
        }
    };

    const showEasterEgg = isHovered || isAnimating;

    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 1024 1024"
            className={className}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            {...props}
        >
            {showEasterEgg ? (
                <>
                    <defs>
                        <style>
                            {`
                            /* Definice cool loop bounce animace */
                            @keyframes rotateBounce {
                                0% { transform: rotate(0deg); animation-timing-function: ease-in; }
                                15% { transform: rotate(190deg); animation-timing-function: ease-in-out; }
                                20% { transform: rotate(175deg); animation-timing-function: ease-in-out; }
                                25% { transform: rotate(183deg); animation-timing-function: ease-in-out; }
                                29% { transform: rotate(178deg); animation-timing-function: ease-in-out; }
                                32% { transform: rotate(180deg); }
                                50% { transform: rotate(180deg); animation-timing-function: ease-in; }
                                65% { transform: rotate(-10deg); animation-timing-function: ease-in-out; }
                                70% { transform: rotate(5deg); animation-timing-function: ease-in-out; }
                                75% { transform: rotate(-3deg); animation-timing-function: ease-in-out; }
                                79% { transform: rotate(2deg); animation-timing-function: ease-in-out; }
                                82% { transform: rotate(0deg); }
                                100% { transform: rotate(0deg); }
                            }
                            `}
                        </style>
                    </defs>
                    <g
                        style={{ transformOrigin: '512px 512px', animation: 'rotateBounce 4s infinite' }}
                        onAnimationIteration={handleAnimationIteration}
                    >
                        <rect fill="none" width="1024" height="1024" />
                        {/* We use currentColor for the white path to respect dark mode inversion on the logo unless they wanted strictly white, but I'll use white for authenticity of the easter egg */}
                        <path fill="currentColor" d="M936,367.49v-220.32C936,65.89,868.46,0,785.15,0h-13.74c-34.65,0-68.24,11.63-95.13,32.95l-79.73,63.2c-55.42,43.93-134.83,43.93-190.25,0l-79.73-63.2C299.68,11.63,266.09,0,231.44,0h-8.59C139.54,0,72,65.89,72,147.17v220.32c0,81.28,67.54,147.17,150.85,147.17h562.3c83.31,0,150.85-65.89,150.85-147.17Z" />
                        <path fill="#3388ff" d="M850.79,660.78l-315.45,348.73c-17.49,19.33-45.83,19.33-63.32,0l-314.82-348.02c-28.18-31.16-8.27-84.43,31.58-84.49,162.93-.27,469.1-1.54,630.57-.7,39.79.21,59.57,53.39,31.44,84.49Z" />
                    </g>
                </>
            ) : (
                <g>
                    <path
                        fill="currentColor"
                        d="M936,367.49v-220.32C936,65.89,868.46,0,785.15,0h-13.74c-34.65,0-68.24,11.63-95.13,32.95l-79.73,63.2c-55.42,43.93-134.83,43.93-190.25,0l-79.73-63.2C299.68,11.63,266.09,0,231.44,0h-8.59C139.54,0,72,65.89,72,147.17v220.32c0,81.28,67.54,147.17,150.85,147.17h562.3c83.31,0,150.85-65.89,150.85-147.17Z"
                    />
                    <path
                        fill="#3388ff"
                        d="M850.79,660.78l-315.45,348.73c-17.49,19.33-45.83,19.33-63.32,0l-314.82-348.02c-28.18-31.16-8.27-84.43,31.58-84.49,162.93-.27,469.1-1.54,630.57-.7,39.79.21,59.57,53.39,31.44,84.49Z"
                    />
                </g>
            )}
        </svg>
    );
};
