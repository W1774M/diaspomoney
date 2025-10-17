/**
 * Composant d'image optimisée avec CDN
 * DiaspoMoney - Architecture Company-Grade
 */

import React, { useState, useCallback } from 'react';
import Image from 'next/image';
import { getAssetURL, optimizeImage } from '@/config/cdn';

export interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'avif' | 'auto';
  priority?: boolean;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  className?: string;
  sizes?: string;
  fill?: boolean;
  style?: React.CSSProperties;
  onClick?: () => void;
  onLoad?: () => void;
  onError?: () => void;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  quality = 85,
  format = 'auto',
  priority = false,
  placeholder = 'empty',
  blurDataURL,
  className,
  sizes,
  fill = false,
  style,
  onClick,
  onLoad,
  onError,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Optimiser l'URL de l'image avec CDN
  const optimizedSrc = optimizeImage(src, {
    width,
    height,
    quality,
    format
  });

  // Gérer le chargement
  const handleLoad = useCallback(() => {
    setIsLoading(false);
    onLoad?.();
  }, [onLoad]);

  // Gérer les erreurs
  const handleError = useCallback(() => {
    setIsLoading(false);
    setHasError(true);
    onError?.();
  }, [onError]);

  // Si erreur, afficher une image de fallback
  if (hasError) {
    return (
      <div 
        className={`bg-gray-200 flex items-center justify-center ${className}`}
        style={{ width, height, ...style }}
        onClick={onClick}
      >
        <svg 
          className="w-8 h-8 text-gray-400" 
          fill="currentColor" 
          viewBox="0 0 20 20"
        >
          <path 
            fillRule="evenodd" 
            d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" 
            clipRule="evenodd" 
          />
        </svg>
      </div>
    );
  }

  // Configuration de l'image Next.js
  const imageProps = {
    src: optimizedSrc,
    alt,
    priority,
    placeholder,
    blurDataURL,
    className,
    sizes,
    style,
    onLoad: handleLoad,
    onError: handleError,
    onClick,
  };

  // Rendu avec ou sans dimensions fixes
  if (fill) {
    return (
      <div className="relative">
        {isLoading && (
          <div className="absolute inset-0 bg-gray-200 animate-pulse rounded" />
        )}
        <Image
          {...imageProps}
          fill
        />
      </div>
    );
  }

  return (
    <div className="relative">
      {isLoading && (
        <div 
          className="absolute inset-0 bg-gray-200 animate-pulse rounded"
          style={{ width, height }}
        />
      )}
      <Image
        {...imageProps}
        width={width}
        height={height}
      />
    </div>
  );
};

// Composant pour les images de profil utilisateur
export const UserAvatar: React.FC<{
  src?: string;
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}> = ({ src, name, size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  if (!src) {
    return (
      <div className={`${sizeClasses[size]} bg-blue-500 text-white rounded-full flex items-center justify-center font-semibold ${className}`}>
        {initials}
      </div>
    );
  }

  return (
    <OptimizedImage
      src={src}
      alt={`Avatar de ${name}`}
      width={size === 'sm' ? 32 : size === 'md' ? 48 : size === 'lg' ? 64 : 96}
      height={size === 'sm' ? 32 : size === 'md' ? 48 : size === 'lg' ? 64 : 96}
      quality={90}
      format="webp"
      className={`${sizeClasses[size]} rounded-full object-cover ${className}`}
    />
  );
};

// Composant pour les images de produits/services
export const ProductImage: React.FC<{
  src: string;
  alt: string;
  title?: string;
  className?: string;
  aspectRatio?: 'square' | 'video' | 'portrait';
}> = ({ src, alt, title, className = '', aspectRatio = 'square' }) => {
  const aspectClasses = {
    square: 'aspect-square',
    video: 'aspect-video',
    portrait: 'aspect-[3/4]'
  };

  return (
    <div className={`relative overflow-hidden rounded-lg ${aspectClasses[aspectRatio]} ${className}`}>
      <OptimizedImage
        src={src}
        alt={alt}
        fill
        quality={90}
        format="webp"
        className="object-cover"
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      />
      {title && (
        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2">
          <p className="text-sm font-medium truncate">{title}</p>
        </div>
      )}
    </div>
  );
};

// Hook pour précharger les images
export const useImagePreloader = () => {
  const preloadImage = useCallback((src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
      img.src = getAssetURL(src);
    });
  }, []);

  const preloadImages = useCallback(async (sources: string[]): Promise<void[]> => {
    return Promise.all(sources.map(preloadImage));
  }, [preloadImage]);

  return { preloadImage, preloadImages };
};
