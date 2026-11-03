import React from 'react';

interface RoyalPassBadgeProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  height?: number | string;
  title?: string;
}

/**
 * RoyalPassBadge - An authentic Crimson Red Sealing Wax Stamp badge,
 * modeled directly after real poured hot wax seals with organic undulating edges,
 * raised stamped circular rim, glossy 3D specular highlights, and crisp
 * embossed white "NEST PASS" typography and regal crown.
 */
export const RoyalPassBadge: React.FC<RoyalPassBadgeProps> = ({
  className = '',
  size = 'md',
  height,
  title = 'Nest Pass Booking',
}) => {
  // Size presets (1:1 circular wax seal aspect ratio)
  const sizeClasses = {
    sm: 'h-12 w-12 sm:h-14 sm:w-14',
    md: 'h-[76px] w-[76px] sm:h-[84px] sm:w-[84px]',
    lg: 'h-24 w-24 sm:h-28 sm:w-28',
    xl: 'h-32 w-32 sm:h-38 sm:w-38',
  }[size];

  return (
    <div
      className={`inline-flex items-center justify-center shrink-0 group ${className}`}
      title={title}
    >
      <svg
        viewBox="0 0 140 140"
        style={height !== undefined ? { height, width: height } : undefined}
        className={`${!height ? sizeClasses : ''} drop-shadow-lg group-hover:scale-105 group-hover:drop-shadow-xl transition-all duration-200 select-none`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* 3D Wax Surface Gradient (Scarlet & Crimson Red matching reference photo) */}
          <radialGradient id="waxBaseRed" cx="42%" cy="38%" r="65%">
            <stop offset="0%" stopColor="#E52D27" />
            <stop offset="35%" stopColor="#D31027" />
            <stop offset="70%" stopColor="#9E0B0F" />
            <stop offset="90%" stopColor="#7A0004" />
            <stop offset="100%" stopColor="#540003" />
          </radialGradient>

          {/* Glossy Specular Highlight on Wax Rim */}
          <linearGradient id="waxGlossRed" x1="20%" y1="0%" x2="80%" y2="100%">
            <stop offset="0%" stopColor="#FFA8A8" stopOpacity="0.85" />
            <stop offset="30%" stopColor="#FFFFFF" stopOpacity="0.45" />
            <stop offset="60%" stopColor="#D31027" stopOpacity="0" />
            <stop offset="100%" stopColor="#540003" stopOpacity="0.5" />
          </linearGradient>

          {/* Inner Recessed Stamp Bed Gradient */}
          <radialGradient id="waxInnerBedRed" cx="45%" cy="42%" r="58%">
            <stop offset="0%" stopColor="#BA1219" />
            <stop offset="55%" stopColor="#8F0B0F" />
            <stop offset="85%" stopColor="#6E0508" />
            <stop offset="100%" stopColor="#4F0104" />
          </radialGradient>

          {/* Outer Deep Shadow */}
          <filter id="waxShadowFilter" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#450002" floodOpacity="0.45" />
            <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodColor="#000000" floodOpacity="0.3" />
          </filter>

          {/* Stamped White Emboss Shadow */}
          <filter id="stampWhiteEmbossFilter" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="1.2" stdDeviation="0.8" floodColor="#380002" floodOpacity="0.85" />
          </filter>
        </defs>

        <g filter="url(#waxShadowFilter)">
          {/* 1. ORGANIC POURED WAX OUTER FLANGE */}
          <path
            d="M 68 8
               C 84 7, 98 11, 110 20
               C 123 30, 133 46, 134 62
               C 135 78, 128 94, 121 106
               C 113 120, 99 131, 83 133
               C 68 135, 53 132, 40 124
               C 26 116, 14 103, 9 88
               C 4 72, 6 56, 12 42
               C 19 28, 32 17, 47 11
               C 54 8, 61 8, 68 8 Z"
            fill="url(#waxBaseRed)"
          />

          {/* Secondary Wax Rim Thickness & Specular Reflection */}
          <path
            d="M 68 10
               C 83 9, 96 13, 108 22
               C 120 32, 130 46, 131 62
               C 132 77, 126 92, 119 104
               C 111 117, 98 128, 82 130
               C 68 132, 53 129, 41 122
               C 28 114, 17 102, 12 87
               C 7 72, 9 57, 15 44
               C 21 31, 33 20, 47 13
               C 54 10, 61 10, 68 10 Z"
            fill="url(#waxGlossRed)"
            opacity="0.38"
          />

          {/* Left Small Wax Droplet Accent (like in reference photo) */}
          <circle cx="8" cy="81" r="2.2" fill="#9E0B0F" />
          <circle cx="8" cy="80.6" r="1.5" fill="#E52D27" opacity="0.6" />

          {/* 2. RAISED CIRCULAR METAL-STAMP RIDGE (Outer Rim) */}
          <circle
            cx="70"
            cy="70"
            r="47"
            fill="none"
            stroke="#FF6B6B"
            strokeWidth="1.8"
            strokeOpacity="0.35"
          />
          <circle
            cx="70"
            cy="70"
            r="46"
            fill="none"
            stroke="#450002"
            strokeWidth="2.5"
            strokeOpacity="0.75"
          />
          <circle
            cx="70"
            cy="70.5"
            r="44.5"
            fill="none"
            stroke="#FFA3A3"
            strokeWidth="1"
            strokeOpacity="0.5"
          />

          {/* 3. INNER RECESSED WAX BED */}
          <circle
            cx="70"
            cy="70"
            r="43.5"
            fill="url(#waxInnerBedRed)"
          />

          {/* Inner Stamp Inset Ring */}
          <circle
            cx="70"
            cy="70"
            r="40"
            fill="none"
            stroke="#FF8A8A"
            strokeWidth="0.8"
            strokeDasharray="2.5, 1.5"
            strokeOpacity="0.45"
          />

          {/* 4. CRISP EMBOSSED WHITE STAMP GRAPHICS */}
          {/* Royal Crown at Top */}
          <g transform="translate(70, 43) scale(0.65)" filter="url(#stampWhiteEmbossFilter)">
            {/* Crown Base */}
            <path
              d="M -16 6 C -6 4.5, 6 4.5, 16 6 L 14 8.5 C 5 7, -5 7, -14 8.5 Z"
              fill="#FFFFFF"
            />
            {/* Crown 5 Peaks */}
            <path
              d="M -14 6 L -17 -3 L -10 1 L -5 -8 L 0 0 L 5 -8 L 10 1 L 17 -3 L 14 6 C 5 4.5, -5 4.5, -14 6 Z"
              fill="#FFFFFF"
            />
            {/* Crown Pearl Points */}
            <circle cx="-17" cy="-3.5" r="1.2" fill="#FFFFFF" />
            <circle cx="-5" cy="-8.5" r="1.4" fill="#FFFFFF" />
            <circle cx="0" cy="-9.5" r="1.8" fill="#FFFFFF" />
            <circle cx="5" cy="-8.5" r="1.4" fill="#FFFFFF" />
            <circle cx="17" cy="-3.5" r="1.2" fill="#FFFFFF" />
          </g>

          {/* "NEST" Text in Crisp White */}
          <text
            x="70"
            y="67"
            textAnchor="middle"
            fontFamily="'Playfair Display', 'Cinzel', 'Times New Roman', Georgia, serif"
            fontSize="13"
            fontWeight="900"
            letterSpacing="3.5"
            fill="#FFFFFF"
            filter="url(#stampWhiteEmbossFilter)"
          >
            NEST
          </text>

          {/* "PASS" Text in Crisp White */}
          <text
            x="70"
            y="84"
            textAnchor="middle"
            fontFamily="'Playfair Display', 'Cinzel', 'Times New Roman', Georgia, serif"
            fontSize="16"
            fontWeight="900"
            letterSpacing="4"
            fill="#FFFFFF"
            filter="url(#stampWhiteEmbossFilter)"
          >
            PASS
          </text>

          {/* Subtle Decorative White Star Divider Under Text */}
          <g transform="translate(70, 93) scale(0.7)" filter="url(#stampWhiteEmbossFilter)">
            <polygon
              points="0,-2.5 0.8,-0.8 2.5,-0.8 1.2,0.4 1.6,2 0,1 -1.6,2 -1.2,0.4 -2.5,-0.8 -0.8,-0.8"
              fill="#FFFFFF"
            />
            <circle cx="-8" cy="0" r="0.8" fill="#FFFFFF" opacity="0.8" />
            <circle cx="8" cy="0" r="0.8" fill="#FFFFFF" opacity="0.8" />
            <path d="M -16 0 L -10 0" stroke="#FFFFFF" strokeWidth="0.8" strokeLinecap="round" opacity="0.75" />
            <path d="M 10 0 L 16 0" stroke="#FFFFFF" strokeWidth="0.8" strokeLinecap="round" opacity="0.75" />
          </g>
        </g>
      </svg>
    </div>
  );
};
