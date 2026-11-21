'use client';

import Image from 'next/image';
import { useState } from 'react';

interface LogoProps {
  src: string;
  width: number;
  height: number;
  alt: string;
  fallbackText?: string;
  className?: string;
  /** « eager » pour un logo visible au chargement (header) ; jamais préchargé. */
  loading?: 'eager' | 'lazy';
}

const Logo = ({
  src,
  width,
  height,
  alt,
  fallbackText,
  className = '',
  loading = 'lazy',
}: LogoProps) => {
  const [imageError, setImageError] = useState(false);

  const shouldShowFallback =
    (!src || src.trim().length === 0 || imageError) && !!fallbackText;

  if (shouldShowFallback) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-200 text-gray-700 font-bold ${className}`}
        style={{ width, height }}
      >
        {fallbackText}
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
      loading={loading}
    />
  );
};

export default Logo;
