import React from 'react';
import { SENSORY_CATEGORIES } from '../types';

interface SensoryWheelProps {
  words: Record<string, string>;
  points: number;
  highlightCategory?: string | null;
}

function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
  const angleInRadians = (angleInDegrees * Math.PI) / 180.0;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians)
  };
}

function describeArc(x: number, y: number, innerRadius: number, outerRadius: number, startAngle: number, endAngle: number) {
  const startOuter = polarToCartesian(x, y, outerRadius, endAngle);
  const endOuter = polarToCartesian(x, y, outerRadius, startAngle);
  const startInner = polarToCartesian(x, y, innerRadius, endAngle);
  const endInner = polarToCartesian(x, y, innerRadius, startAngle);

  const arcSweep = endAngle - startAngle <= 180 ? '0' : '1';

  return [
    'M', startOuter.x, startOuter.y,
    'A', outerRadius, outerRadius, 0, arcSweep, 0, endOuter.x, endOuter.y,
    'L', endInner.x, endInner.y,
    'A', innerRadius, innerRadius, 0, arcSweep, 1, startInner.x, startInner.y,
    'Z'
  ].join(' ');
}

export const SensoryWheel: React.FC<SensoryWheelProps> = ({ words, points, highlightCategory }) => {
  const centerX = 150;
  const centerY = 150;

  return (
    <div className="w-full max-w-[340px] mx-auto select-none">
      <svg
        viewBox="-30 -10 360 320"
        className="w-full h-auto drop-shadow-sm"
        role="img"
        aria-label="Roda deria lima bahagian"
      >
        <defs>
          <filter id="subtle-shadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.08" />
          </filter>
        </defs>

        {SENSORY_CATEGORIES.map((cat, idx) => {
          const startAngle = -90 + idx * 72 + 1.5;
          const endAngle = -90 + (idx + 1) * 72 - 1.5;
          const midAngle = -90 + idx * 72 + 36;
          const d = describeArc(centerX, centerY, 54, 122, startAngle, endAngle);

          const isFilled = (words[cat.key] || '').trim().length >= 2;
          const isHighlighted = highlightCategory === cat.key;
          const labelPos = polarToCartesian(centerX, centerY, 142, midAngle);
          const cosAngle = Math.cos((midAngle * Math.PI) / 180);
          const anchor = Math.abs(cosAngle) < 0.25 ? 'middle' : cosAngle > 0 ? 'start' : 'end';

          return (
            <g key={cat.key} className="transition-all duration-300">
              <path
                d={d}
                fill={isFilled ? cat.color : '#DDE6DE'}
                stroke={isHighlighted ? '#12302B' : 'none'}
                strokeWidth={isHighlighted ? 2.5 : 0}
                className={`transition-colors duration-500 cursor-pointer hover:opacity-95 ${
                  isHighlighted ? 'animate-wheel-pop' : ''
                }`}
                style={{
                  transformOrigin: `${centerX}px ${centerY}px`
                }}
              />
              <text
                x={labelPos.x}
                y={labelPos.y + 4}
                textAnchor={anchor}
                className="text-[11px] font-bold tracking-wider uppercase transition-colors duration-300"
                fill={isFilled ? '#12302B' : '#4F6660'}
                fontWeight={isFilled ? '800' : '600'}
              >
                {cat.name}
              </text>
            </g>
          );
        })}

        {/* Center circle */}
        <circle
          cx={centerX}
          cy={centerY}
          r="48"
          fill="#F9FBF7"
          stroke="#CBD7CE"
          strokeWidth="1.5"
          filter="url(#subtle-shadow)"
        />

        <text
          x={centerX}
          y={centerY + 6}
          textAnchor="middle"
          className="font-display font-extrabold text-[38px] fill-[#12302B] tracking-tight"
        >
          {points}
        </text>

        <text
          x={centerX}
          y={centerY + 24}
          textAnchor="middle"
          className="text-[9px] font-bold tracking-widest uppercase fill-[#4F6660]"
        >
          DARI 100 MATA
        </text>
      </svg>
    </div>
  );
};
