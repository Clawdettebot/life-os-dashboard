import React from 'react';

// Common Lucide React Icons will be passed as the "Icon" prop.
const AnimatedIcon = ({ Icon, animation = 'none', size = 24, color = 'currentColor', className = '', style = {}, ...props }) => {
    if (!Icon) return null;

    // Map the chosen animation to a CSS class
    const animationMap = {
        float: 'animate-float',
        pulse: 'animate-pulse-slow',
        spin: 'animate-spin-slow',
        bounce: 'animate-bounce-hover',
        wiggle: 'animate-wiggle',
        glow: 'animate-glow',
        scale: 'animate-scale-up',
        none: ''
    };

    const animClass = animationMap[animation] || '';

    return (
        <div
            className={`inline-flex items-center justify-center ${animClass} ${className}`}
            style={{ ...style, lineHeight: 0 }}
            {...props}
        >
            <Icon size={size} color={color} />
        </div>
    );
};

export default AnimatedIcon;
