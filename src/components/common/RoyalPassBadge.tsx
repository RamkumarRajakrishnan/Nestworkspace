import React from 'react';

interface RoyalPassBadgeProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  title?: string;
}

/**
 * RoyalPassBadge - An ultra-luxurious royal insignia seal for Pass bookings,
 * styled in Nest Admin's signature Royal Blue & Sapphire theme (#1B2E79).
 * Features an ornate scalloped cartouche, deep midnight navy gloss core,
 * regal imperial crown with ice-diamond jewels, sculpted platinum/azure "PASS" lettering,
 * and flared royal blue ribbon wings.
 */
export const RoyalPassBadge: React.FC<RoyalPassBadgeProps> = ({
  className = '',
  size = 'md',
  title = 'Nest Pass Booking',
}) => {
  // Size presets
  const sizeClasses = {
    sm: 'h-9 w-auto',
    md: 'h-11 sm:h-12 w-auto',
    lg: 'h-14 sm:h-16 w-auto',
  }[size];

  return (
    <div
      className={`inline-flex items-center justify-center shrink-0 group ${className}`}
      title={title}
    >
      <svg
        viewBox="0 0 160 110"
        className={`${sizeClasses} drop-shadow-md group-hover:scale-105 group-hover:drop-shadow-lg transition-all duration-200 select-none`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Signature Nest Royal Blue 3D Metallic Gradient */}
          <linearGradient id="passBlueMetallic" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#C4D9FD" />
            <stop offset="22%" stopColor="#60A5FA" />
            <stop offset="48%" stopColor="#2563EB" />
            <stop offset="75%" stopColor="#1B2E79" />
            <stop offset="100%" stopColor="#3B82F6" />
          </linearGradient>

          {/* Deep Navy for Ribbon Folds & 3D Depth */}
          <linearGradient id="passBlueDark" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0B1333" />
            <stop offset="50%" stopColor="#060B1E" />
            <stop offset="100%" stopColor="#0F1B47" />
          </linearGradient>

          {/* Crown Metallic Sapphire Gradient */}
          <linearGradient id="passCrownBlue" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="30%" stopColor="#BFDBFE" />
            <stop offset="70%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#1B2E79" />
          </linearGradient>

          {/* Sculpted Ice Platinum/Azure Text Gradient */}
          <linearGradient id="passTextIce" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="35%" stopColor="#EFF6FF" />
            <stop offset="70%" stopColor="#BFDBFE" />
            <stop offset="100%" stopColor="#93C5FD" />
          </linearGradient>

          {/* Glossy Midnight Navy Core */}
          <radialGradient id="passNavyCore" cx="50%" cy="38%" r="56%">
            <stop offset="0%" stopColor="#1E327B" />
            <stop offset="45%" stopColor="#101C46" />
            <stop offset="85%" stopColor="#080E24" />
            <stop offset="100%" stopColor="#040713" />
          </radialGradient>

          {/* Radiant Azure Glow Filter */}
          <filter id="passBlueGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="1" stdDeviation="1.8" floodColor="#3B82F6" floodOpacity="0.6" />
          </filter>
        </defs>

        <g>
          {/* 1. LEFT RIBBON (Flared swallowtail tail) */}
          <path
            d="M 45 74 L 14 78 L 22 86 L 12 94 L 46 87 Z"
            fill="url(#passBlueMetallic)"
            stroke="#0D1945"
            strokeWidth="0.8"
          />
          {/* Left Ribbon Fold Under-Shadow */}
          <path
            d="M 43 74 L 38 86 L 46 87 Z"
            fill="url(#passBlueDark)"
            opacity="0.85"
          />

          {/* 2. RIGHT RIBBON (Flared swallowtail tail) */}
          <path
            d="M 115 74 L 146 78 L 138 86 L 148 94 L 114 87 Z"
            fill="url(#passBlueMetallic)"
            stroke="#0D1945"
            strokeWidth="0.8"
          />
          {/* Right Ribbon Fold Under-Shadow */}
          <path
            d="M 117 74 L 122 86 L 114 87 Z"
            fill="url(#passBlueDark)"
            opacity="0.85"
          />

          {/* 3. RIBBON FRONT BANNER (Curves underneath the seal) */}
          <path
            d="M 36 78 C 50 86 110 86 124 78 C 114 91 46 91 36 78 Z"
            fill="url(#passBlueMetallic)"
            stroke="#0D1945"
            strokeWidth="0.8"
          />

          {/* 4. ORNATE SCALLOPED SHIELD / FRAME */}
          <path
            d="M 80 4 
               C 87 4 94 9 101 11 
               C 108 13 115 11 119 16 
               C 123 21 122 28 126 34 
               C 130 40 137 44 136 51 
               C 135 58 128 62 124 68 
               C 120 74 118 82 112 85 
               C 106 88 98 84 91 87 
               C 84 90 80 93 80 93 
               C 80 93 76 90 69 87 
               C 62 84 54 88 48 85 
               C 42 82 40 74 36 68 
               C 32 62 25 58 24 51 
               C 23 44 30 40 34 34 
               C 38 28 37 21 41 16 
               C 45 11 52 13 59 11 
               C 66 9 73 4 80 4 Z"
            fill="url(#passBlueMetallic)"
            stroke="#0B1333"
            strokeWidth="0.9"
          />

          {/* Inner Border Inset */}
          <path
            d="M 80 8 
               C 86 8 92 12 98 14 
               C 104 16 110 14 114 18 
               C 118 22 117 28 121 34 
               C 125 40 131 43 130 49 
               C 129 55 123 59 119 64 
               C 115 69 113 76 108 79 
               C 103 82 96 78 90 81 
               C 84 84 80 87 80 87 
               C 80 87 76 84 70 81 
               C 64 78 57 82 52 79 
               C 47 76 45 69 41 64 
               C 37 59 31 55 30 49 
               C 29 43 35 40 39 34 
               C 43 28 42 22 46 18 
               C 50 14 56 16 62 14 
               C 68 12 74 8 80 8 Z"
            fill="#0C173D"
          />

          {/* 5. MIDNIGHT NAVY INNER CORE */}
          <path
            d="M 80 10 
               C 85 10 91 14 97 16 
               C 103 18 108 16 112 20 
               C 116 24 115 29 119 35 
               C 123 41 128 44 127 50 
               C 126 55 121 59 117 63 
               C 113 67 111 74 106 77 
               C 101 80 95 76 89 79 
               C 84 82 80 85 80 85 
               C 80 85 76 82 71 79 
               C 65 76 59 80 54 77 
               C 49 74 47 67 43 63 
               C 39 59 34 55 33 50 
               C 32 44 37 41 41 35 
               C 45 29 44 24 48 20 
               C 52 16 57 18 63 16 
               C 69 14 75 10 80 10 Z"
            fill="url(#passNavyCore)"
            stroke="url(#passBlueMetallic)"
            strokeWidth="0.9"
          />

          {/* Dotted Azure Inset Trim */}
          <path
            d="M 80 13 
               C 84 13 89 16 94 18 
               C 99 20 104 18 107 22 
               C 110 25 109 30 113 35 
               C 116 40 121 43 120 48 
               C 119 53 115 56 112 60 
               C 108 64 107 70 102 73 
               C 98 75 92 72 87 75 
               C 83 77 80 80 80 80 
               C 80 80 77 77 73 75 
               C 68 72 62 75 58 73 
               C 53 70 52 64 48 60 
               C 45 56 41 53 40 48 
               C 39 43 44 40 47 35 
               C 51 30 50 25 53 22 
               C 56 18 61 20 66 18 
               C 71 16 76 13 80 13 Z"
            fill="none"
            stroke="#93C5FD"
            strokeWidth="0.6"
            strokeDasharray="2.5, 1.5"
            opacity="0.75"
          />

          {/* 6. REGAL ROYAL CROWN */}
          <g transform="translate(80, 26) scale(0.72)">
            {/* Crown Base Band */}
            <path
              d="M -20 10 C -7 8 7 8 20 10 L 18 13 C 7 11 -7 11 -18 13 Z"
              fill="url(#passCrownBlue)"
              stroke="#0D1945"
              strokeWidth="0.4"
            />
            {/* Crown Base Jewels */}
            <circle cx="-13" cy="11.5" r="0.8" fill="#FFFFFF" />
            <circle cx="-6.5" cy="10.8" r="0.9" fill="#BFDBFE" />
            <circle cx="0" cy="10.5" r="1.1" fill="#FFFFFF" />
            <circle cx="6.5" cy="10.8" r="0.9" fill="#BFDBFE" />
            <circle cx="13" cy="11.5" r="0.8" fill="#FFFFFF" />

            {/* Crown 5 Peaks */}
            <path
              d="M -18 10 
                 L -21 -1 L -12 4 
                 L -7 -7 L 0 3 
                 L 7 -7 L 12 4 
                 L 21 -1 L 18 10 
                 C 7 8 -7 8 -18 10 Z"
              fill="url(#passCrownBlue)"
              stroke="#0D1945"
              strokeWidth="0.5"
            />

            {/* Crown Diamond Pearls / Jewels on Tips */}
            <circle cx="-21" cy="-1.5" r="1.3" fill="#FFFFFF" stroke="#2563EB" strokeWidth="0.3" />
            <circle cx="-7" cy="-7.5" r="1.5" fill="#FFFFFF" stroke="#2563EB" strokeWidth="0.3" />
            <circle cx="0" cy="-9" r="2" fill="#FFFFFF" stroke="#1D4ED8" strokeWidth="0.4" filter="url(#passBlueGlow)" />
            <circle cx="7" cy="-7.5" r="1.5" fill="#FFFFFF" stroke="#2563EB" strokeWidth="0.3" />
            <circle cx="21" cy="-1.5" r="1.3" fill="#FFFFFF" stroke="#2563EB" strokeWidth="0.3" />
          </g>

          {/* 7. SCULPTED CHISELED "PASS" TEXT */}
          {/* Depth Underlayer */}
          <text
            x="80"
            y="55.5"
            textAnchor="middle"
            fontFamily="'Playfair Display', 'Cinzel', 'Georgia', 'Times New Roman', serif"
            fontSize="18"
            fontWeight="900"
            letterSpacing="3.5"
            fill="#030611"
            opacity="0.95"
          >
            PASS
          </text>
          {/* Platinum / Azure Surface */}
          <text
            x="80"
            y="54"
            textAnchor="middle"
            fontFamily="'Playfair Display', 'Cinzel', 'Georgia', 'Times New Roman', serif"
            fontSize="18"
            fontWeight="900"
            letterSpacing="3.5"
            fill="url(#passTextIce)"
            stroke="#0D1945"
            strokeWidth="0.4"
            filter="url(#passBlueGlow)"
          >
            PASS
          </text>

          {/* 8. AZURE LAUREL ARC & DIAMOND ACCENT STAR UNDER "PASS" */}
          <g transform="translate(80, 64) scale(0.85)">
            {/* Center Diamond Star */}
            <polygon
              points="0,-3 1,-1 3,-1 1.5,0.5 2,2.5 0,1.2 -2,2.5 -1.5,0.5 -3,-1 -1,-1"
              fill="#FFFFFF"
              stroke="#2563EB"
              strokeWidth="0.3"
            />
            {/* Left Laurel Branch */}
            <path
              d="M -3 0 Q -14 0 -22 -6"
              fill="none"
              stroke="url(#passBlueMetallic)"
              strokeWidth="0.8"
            />
            <ellipse cx="-7" cy="-1.5" rx="2" ry="0.8" transform="rotate(-20 -7 -1.5)" fill="url(#passBlueMetallic)" />
            <ellipse cx="-13" cy="-3.5" rx="2" ry="0.8" transform="rotate(-35 -13 -3.5)" fill="url(#passBlueMetallic)" />
            <ellipse cx="-18" cy="-6" rx="1.8" ry="0.7" transform="rotate(-50 -18 -6)" fill="url(#passBlueMetallic)" />

            {/* Right Laurel Branch */}
            <path
              d="M 3 0 Q 14 0 22 -6"
              fill="none"
              stroke="url(#passBlueMetallic)"
              strokeWidth="0.8"
            />
            <ellipse cx="7" cy="-1.5" rx="2" ry="0.8" transform="rotate(20 7 -1.5)" fill="url(#passBlueMetallic)" />
            <ellipse cx="13" cy="-3.5" rx="2" ry="0.8" transform="rotate(35 13 -3.5)" fill="url(#passBlueMetallic)" />
            <ellipse cx="18" cy="-6" rx="1.8" ry="0.7" transform="rotate(50 18 -6)" fill="url(#passBlueMetallic)" />
          </g>
        </g>
      </svg>
    </div>
  );
};
