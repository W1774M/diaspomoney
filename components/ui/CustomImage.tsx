'use client';

import Image from 'next/image';
import { useState } from 'react';

interface CustomImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  fill?: boolean;
  sizes?: string;
  quality?: number;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export function CustomImage({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  fill = false,
  sizes,
  quality = 75,
  placeholder = 'empty',
  blurDataURL,
  onLoad,
  onError,
}: CustomImageProps) {
  const [imageError, setImageError] = useState(false);

  const handleError = () => {
    setImageError(true);
    onError?.();
  };

  const handleLoad = () => {
    onLoad?.();
  };

  // Si l'image a échoué à charger, afficher un placeholder avec le texte de l'image
  if (imageError) {
    return (
      <div
        className={`bg-gray-200 flex items-center justify-center ${className}`}
        style={fill ? {} : { width, height }}
      >
        <div className='text-gray-400 text-sm text-center p-2'>
          {alt || 'Image non disponible'}
        </div>
      </div>
    );
  }

  // Pour les images locales, utiliser directement Next.js Image
  if (src.startsWith('/')) {
    return (
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={className}
        priority={priority}
        fill={fill}
        sizes={sizes}
        quality={quality}
        placeholder={placeholder}
        blurDataURL={blurDataURL}
        onLoad={handleLoad}
        onError={handleError}
      />
    );
  }

  // Utiliser une image normale pour les images externes
  if (src.startsWith('https://') || src.startsWith('http://')) {
    return (
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={className}
        onLoad={handleLoad}
        onError={handleError}
        loading={priority ? 'eager' : 'lazy'}
        style={
          fill ? { width: '100%', height: '100%', objectFit: 'cover' } : {}
        }
        crossOrigin='anonymous'
      />
    );
  }

  // Fallback pour les autres cas
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      priority={priority}
      fill={fill}
      sizes={sizes}
      quality={quality}
      placeholder={placeholder}
      blurDataURL={blurDataURL}
      onLoad={handleLoad}
      onError={handleError}
    />
  );
}
