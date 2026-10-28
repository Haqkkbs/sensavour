import React from 'react';
import { FOOD_DETAILS, FoodDetail } from '../types';

interface SensoryWheelProps {
  onSelectFood: (foodKey: string) => void;
  selectedFoodKey: string;
  filterRegion: 'all' | 'sabah' | 'sarawak';
}

const WHEEL_ITEMS = [
  { key: 'Hinava', color: '#D4452E', region: 'sabah' },
  { key: 'Pinasakan Sada', color: '#E3A21A', region: 'sabah' },
  { key: 'Tuhau', color: '#2E9170', region: 'sabah' },
  { key: 'Linopot', color: '#4F74B3', region: 'sabah' },
  { key: 'Ambuyat', color: '#9A5392', region: 'all' },
  { key: 'Sarawak Laksa', color: '#C8402B', region: 'sarawak' },
  { key: 'Manok Pansuh', color: '#D97706', region: 'sarawak' },
  { key: 'Midin', color: '#059669', region: 'sarawak' },
  { key: 'Kek Lapis Sarawak', color: '#DB2777', region: 'sarawak' },
  { key: 'Tonsom/Nonsom Bambangan', color: '#7C3AED', region: 'sabah' }
];

export const SensoryWheel: React.FC<SensoryWheelProps> = ({
  onSelectFood,
  selectedFoodKey,
  filterRegion
}) => {
  const filteredItems = WHEEL_ITEMS.filter(item => {
    if (filterRegion === 'all') return true;
    return item.region === filterRegion || item.region === 'all';
  });

  const totalSlices = filteredItems.length;
  const angleSize = 360 / (totalSlices || 1);
  const radius = 135;
  const center = 160;

  return (
    <div className="w-full max-w-[360px] mx-auto select-none flex flex-col items-center">
      <svg
        viewBox="0 0 320 320"
        className="w-full h-auto drop-shadow-md"
        role="img"
        aria-label="Roda Pancaidera Interaktif SENSAVOUR"
      >
        <defs>
          <filter id="wheel-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#12302B" floodOpacity="0.15" />
          </filter>
          <linearGradient id="center-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#F4F8F3" />
          </linearGradient>
        </defs>

        {/* Outer Base Circle */}
        <circle
          cx={center}
          cy={center}
          r={radius + 8}
          fill="none"
          stroke="#CBD7CE"
          strokeWidth="3"
          opacity="0.6"
        />

        {filteredItems.map((item, i) => {
          const angleStart = i * angleSize - 90;
          const angleEnd = (i + 1) * angleSize - 90;
          const angleMid = angleStart + angleSize / 2;

          const radStart = (angleStart * Math.PI) / 180;
          const radEnd = (angleEnd * Math.PI) / 180;
          const radMid = (angleMid * Math.PI) / 180;

          const x1 = center + radius * Math.cos(radStart);
          const y1 = center + radius * Math.sin(radStart);
          const x2 = center + radius * Math.cos(radEnd);
          const y2 = center + radius * Math.sin(radEnd);

          const innerR = 55;
          const ix1 = center + innerR * Math.cos(radStart);
          const iy1 = center + innerR * Math.sin(radStart);
          const ix2 = center + innerR * Math.cos(radEnd);
          const iy2 = center + innerR * Math.sin(radEnd);

          const largeArc = angleSize > 180 ? 1 : 0;

          const pathD = [
            `M ${ix1} ${iy1}`,
            `L ${x1} ${y1}`,
            `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
            `L ${ix2} ${iy2}`,
            `A ${innerR} ${innerR} 0 ${largeArc} 0 ${ix1} ${iy1}`,
            'Z'
          ].join(' ');

          const isSelected = selectedFoodKey === item.key;
          const labelR = radius * 0.72;
          const lx = center + labelR * Math.cos(radMid);
          const ly = center + labelR * Math.sin(radMid);

          // Calculate text rotation so it reads nicely outward
          let textAngle = angleMid;
          if (textAngle > 90 && textAngle < 270) {
            textAngle += 180;
          }

          const shortName = item.key.length > 12 ? item.key.slice(0, 11) + '…' : item.key;

          return (
            <g
              key={item.key}
              onClick={() => onSelectFood(item.key)}
              className="cursor-pointer transition-all duration-300 group"
            >
              <path
                d={pathD}
                fill={item.color}
                stroke="#FFFFFF"
                strokeWidth="2.5"
                className={`transition-all duration-300 hover:brightness-110 ${
                  isSelected ? 'brightness-125 stroke-[4px] drop-shadow-md' : 'opacity-90'
                }`}
                style={{
                  transformOrigin: `${center}px ${center}px`,
                }}
              />
              <text
                x={lx}
                y={ly}
                textAnchor="middle"
                dominantBaseline="central"
                transform={`rotate(${textAngle}, ${lx}, ${ly})`}
                className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-tight select-none pointer-events-none fill-white drop-shadow-xs"
              >
                {shortName}
              </text>
            </g>
          );
        })}

        {/* Center Hub */}
        <circle
          cx={center}
          cy={center}
          r="53"
          fill="url(#center-grad)"
          stroke="#12302B"
          strokeWidth="3.5"
          filter="url(#wheel-shadow)"
        />

        <text
          x={center}
          y={center - 8}
          textAnchor="middle"
          dominantBaseline="central"
          className="font-display font-extrabold text-[13px] fill-[#12302B] tracking-wider"
        >
          BORNEO
        </text>
        <text
          x={center}
          y={center + 6}
          textAnchor="middle"
          dominantBaseline="central"
          className="font-display font-extrabold text-[11px] fill-[#C8402B] tracking-widest"
        >
          GASTRONOMI
        </text>
        <text
          x={center}
          y={center + 20}
          textAnchor="middle"
          dominantBaseline="central"
          className="text-[8px] font-bold uppercase tracking-widest fill-[#4F6660]"
        >
          TEKAN SEGMEN
        </text>
      </svg>
    </div>
  );
};
