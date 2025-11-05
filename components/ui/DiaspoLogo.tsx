'use client';

interface DiaspoLogoProps {
  width?: number;
  height?: number;
  className?: string;
}

export default function DiaspoLogo({ 
  width = 200, 
  height = 60, 
  className = '' 
}: DiaspoLogoProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 200 60"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Fond avec dégradé */}
      <defs>
        <linearGradient id="diaspoGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#FF6B00" />
          <stop offset="100%" stopColor="#FFA500" />
        </linearGradient>
      </defs>
      
      {/* Icône stylisée - Transfert/Échange */}
      <g transform="translate(10, 15)">
        <circle cx="15" cy="15" r="12" fill="url(#diaspoGradient)" opacity="0.2"/>
        <path
          d="M15 5 L15 25 M10 10 L15 5 L20 10 M15 25 L15 5 M10 20 L15 25 L20 20"
          stroke="url(#diaspoGradient)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <circle cx="15" cy="15" r="3" fill="url(#diaspoGradient)"/>
      </g>

      {/* Texte "DiaspoMoney" */}
      <text
        x="50"
        y="38"
        fontFamily="Arial, sans-serif"
        fontSize="22"
        fontWeight="bold"
        fill="#FFFFFF"
      >
        Diaspo
      </text>
      <text
        x="118"
        y="38"
        fontFamily="Arial, sans-serif"
        fontSize="22"
        fontWeight="bold"
        fill="url(#diaspoGradient)"
      >
        Money
      </text>

      {/* Baseline */}
      <text
        x="50"
        y="50"
        fontFamily="Arial, sans-serif"
        fontSize="8"
        fill="#CCCCCC"
        opacity="0.8"
      >
        Transférez des services, pas de l'argent
      </text>
    </svg>
  );
}

