import React from 'react';

interface EarnProLogoProps {
  size?: number;
  className?: string;
}

const EarnProLogo: React.FC<EarnProLogoProps> = ({ size = 32, className = "" }) => {
  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Background Circle */}
        <circle
          cx="50"
          cy="50"
          r="48"
          fill="url(#gradient1)"
          stroke="url(#gradient2)"
          strokeWidth="2"
        />
        
        {/* Inner Design - Dollar Sign with Arrow */}
        <path
          d="M35 30 L65 30 M35 40 L60 40 M35 50 L65 50 M35 60 L60 60 M35 70 L65 70"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
          opacity="0.3"
        />
        
        {/* Main Dollar Symbol */}
        <path
          d="M45 25 L45 75 M35 35 C35 30 40 25 50 25 C60 25 65 30 65 35 C65 40 60 42 50 42 C40 42 35 44 35 50 C35 55 40 60 50 60 C60 60 65 55 65 50"
          stroke="white"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        
        {/* Arrow pointing up */}
        <path
          d="M70 45 L80 35 L75 35 L75 25 L85 25 L85 35 L80 35"
          fill="white"
          opacity="0.9"
        />
        
        {/* Gradient Definitions */}
        <defs>
          <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8B5CF6" />
            <stop offset="50%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#1E40AF" />
          </linearGradient>
          <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#A855F7" />
            <stop offset="100%" stopColor="#2563EB" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
};

export default EarnProLogo;
