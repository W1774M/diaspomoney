'use client';

import Image from 'next/image';
import { useState } from 'react';
import DiaspoLogo from './DiaspoLogo';

interface LogoProps {
  src: string;
  width: number;
  height: number;
  alt: string;
  fallbackText?: string;
  className?: string;
}

const Logo = ({
  src,
  width,
  height,
  alt,
  fallbackText,
  className = '',
}: LogoProps) => {
  const [imageError, setImageError] = useState(false);

  // Si c'est le logo DiaspoMoney principal qui a une erreur, utiliser le SVG
  const isDiaspoLogo = src.includes('Logo_Diaspo') || src.includes('diaspo');
  
  if (imageError || !src || src.trim().length === 0) {
    // Pour le logo DiaspoMoney, utiliser le SVG
    if (isDiaspoLogo) {
      return <DiaspoLogo width={width} height={height} className={className} />;
    }
    
    // Pour les autres, utiliser le fallback texte si fourni
    if (fallbackText) {
      return (
        <div
          className={`flex items-center justify-center bg-gray-200 text-gray-700 font-bold rounded-full ${className}`}
          style={{ width, height }}
        >
          {fallbackText}
        </div>
      );
    }
    
    // Sinon, afficher un placeholder générique
    return (
      <div
        className={`flex items-center justify-center bg-gray-200 rounded ${className}`}
        style={{ width, height }}
      >
        <span className="text-gray-400 text-xs">Image</span>
      </div>
    );
  }

  return (
    <Image
      src={src}
      width={width}
      height={height}
      alt={alt}
      className={className}
      onError={() => setImageError(true)}
      priority
    />
  );
};

export default Logo;
