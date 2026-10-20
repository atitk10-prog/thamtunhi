import React from 'react';

interface FoxDetectiveProps {
  mood?: 'idle' | 'happy' | 'thinking' | 'detecting' | 'celebrating';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const FoxDetective: React.FC<FoxDetectiveProps> = ({
  mood = 'idle',
  size = 'md',
  className = '',
}) => {
  const sizeMap = {
    sm: 'w-12 h-12',
    md: 'w-20 h-20',
    lg: 'w-32 h-32',
    xl: 'w-44 h-44',
  };

  return (
    <div className={`relative inline-flex items-center justify-center ${sizeMap[size]} ${className}`}>
      <svg
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-md transition-transform duration-300 hover:scale-105"
      >
        {/* Tail */}
        <path
          d="M40 140 C10 160 20 185 60 170 C90 160 70 135 40 140 Z"
          fill="#EA580C"
        />
        <path
          d="M20 170 C30 180 50 178 60 170 C45 165 30 162 20 170 Z"
          fill="#FFF"
        />

        {/* Body */}
        <ellipse cx="100" cy="145" rx="42" ry="40" fill="#F97316" />
        {/* White chest */}
        <ellipse cx="100" cy="150" rx="24" ry="26" fill="#FFF7ED" />
        {/* Detective Coat Lapels / Tie */}
        <path d="M92 125 L100 145 L108 125 Z" fill="#0284C7" />
        <circle cx="100" cy="123" r="4" fill="#0369A1" />

        {/* Fox Ears */}
        {/* Left Ear */}
        <polygon points="50,90 70,30 95,75" fill="#EA580C" />
        <polygon points="58,82 72,42 88,72" fill="#FED7AA" />
        {/* Right Ear */}
        <polygon points="150,90 130,30 105,75" fill="#EA580C" />
        <polygon points="142,82 128,42 112,72" fill="#FED7AA" />

        {/* Head */}
        <path
          d="M50 95 C50 65 150 65 150 95 C150 135 125 140 100 140 C75 140 50 135 50 95 Z"
          fill="#FB923C"
        />
        {/* White Cheeks */}
        <path
          d="M52 105 C55 125 80 138 100 138 C120 138 145 125 148 105 C135 120 115 124 100 124 C85 124 65 120 52 105 Z"
          fill="#FFF7ED"
        />

        {/* Detective Hat (Mũ Thám tử) */}
        <path
          d="M45 70 C45 62 155 62 155 70 L145 74 L55 74 Z"
          fill="#0284C7"
        />
        <path
          d="M62 68 C62 38 138 38 138 68 Z"
          fill="#0369A1"
        />
        {/* Hat Ribbon */}
        <path
          d="M62 62 C75 58 125 58 138 62 L138 68 L62 68 Z"
          fill="#F59E0B"
        />
        {/* Gold Star Badge on Hat */}
        <polygon
          points="100,52 102,57 107,57 103,60 105,65 100,62 95,65 97,60 93,57 98,57"
          fill="#FEF08A"
        />

        {/* Eyes based on mood */}
        {mood === 'happy' || mood === 'celebrating' ? (
          <>
            <path d="M72 98 Q82 86 90 98" stroke="#1E293B" strokeWidth="4" strokeLinecap="round" fill="none" />
            <path d="M110 98 Q118 86 128 98" stroke="#1E293B" strokeWidth="4" strokeLinecap="round" fill="none" />
          </>
        ) : mood === 'thinking' ? (
          <>
            <circle cx="80" cy="94" r="6" fill="#1E293B" />
            <circle cx="120" cy="92" r="7" fill="#1E293B" />
            <circle cx="122" cy="90" r="2" fill="#FFF" />
          </>
        ) : (
          <>
            {/* Friendly sparkling big detective eyes */}
            <circle cx="80" cy="96" r="7" fill="#1E293B" />
            <circle cx="82" cy="93" r="2.5" fill="#FFF" />
            <circle cx="120" cy="96" r="7" fill="#1E293B" />
            <circle cx="122" cy="93" r="2.5" fill="#FFF" />
          </>
        )}

        {/* Cute Nose */}
        <ellipse cx="100" cy="112" rx="5" ry="4" fill="#0F172A" />

        {/* Mouth */}
        {mood === 'happy' || mood === 'celebrating' ? (
          <path d="M92 118 Q100 128 108 118" stroke="#0F172A" strokeWidth="3" strokeLinecap="round" fill="none" />
        ) : (
          <path d="M94 117 Q100 122 106 117" stroke="#0F172A" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        )}

        {/* Magnifying Glass (Kính lúp thám tử) */}
        <g transform="translate(130, 95) rotate(25)">
          {/* Handle */}
          <rect x="18" y="38" width="8" height="24" rx="3" fill="#B45309" stroke="#78350F" strokeWidth="1.5" />
          {/* Glass Rim */}
          <circle cx="22" cy="22" r="20" stroke="#F59E0B" strokeWidth="5" fill="#E0F2FE" fillOpacity="0.75" />
          {/* Sparkle on glass */}
          <circle cx="15" cy="15" r="4" fill="#FFF" fillOpacity="0.8" />
        </g>
      </svg>
    </div>
  );
};
