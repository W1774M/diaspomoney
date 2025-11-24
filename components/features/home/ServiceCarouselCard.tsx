"use client";

import { useState } from "react";
import Image from "next/image";
import imageLoader from "@/lib/image-loader";

interface ServiceCarouselCardProps {
  image: string;
  title: string;
  description: string;
  serviceType: string;
  onClick: () => void;
}

export function ServiceCarouselCard({
  image,
  title,
  description,
  serviceType,
  onClick,
}: ServiceCarouselCardProps) {
  const [imageError, setImageError] = useState(false);

  // Couleurs professionnelles selon le type de service (fintech style)
  const getServiceColors = () => {
    if (serviceType === "Santé") {
      return {
        gradient: "from-emerald-700 via-emerald-600 to-emerald-700",
        buttonBg: "bg-emerald-800",
        buttonHover: "hover:bg-emerald-900",
        buttonBorder: "border-emerald-800",
        accent: "emerald",
      };
    }
    if (serviceType === "Éducation") {
      return {
        gradient: "from-blue-700 via-blue-600 to-blue-700",
        buttonBg: "bg-blue-800",
        buttonHover: "hover:bg-blue-900",
        buttonBorder: "border-blue-800",
        accent: "blue",
      };
    }
    return {
      gradient: "from-amber-700 via-amber-600 to-amber-700",
      buttonBg: "bg-amber-800",
      buttonHover: "hover:bg-amber-900",
      buttonBorder: "border-amber-800",
      accent: "amber",
    };
  };

  const colors = getServiceColors();

  return (
    <div 
      className="bg-gray-900 rounded-xl overflow-hidden w-full cursor-pointer group shadow-2xl hover:shadow-3xl transition-all duration-300 hover:-translate-y-1 border border-gray-800 focus-within:ring-4 focus-within:ring-white/50 focus-within:outline-none"
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      aria-label={`Accéder au service ${title}`}
    >
      {/* Image Section - Person on black background with overlay */}
      <div className="relative h-80 md:h-96 w-full bg-gradient-to-b from-gray-900 to-black overflow-hidden">
        {!imageError ? (
          <>
            <Image
              src={image}
              alt={`${title} - ${description}`}
              fill
              loader={imageLoader}
              className="object-contain object-center group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
              onError={() => setImageError(true)}
              loading="lazy"
              quality={85}
              priority={false}
            />
            {/* Subtle overlay for better text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
            <div className="text-center p-4">
              <div className="text-7xl mb-2 opacity-80">
                {serviceType === "Santé" ? "🏥" : serviceType === "Éducation" ? "🎓" : "🏗️"}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Content Section - Professional gradient background */}
      <div className={`bg-gradient-to-b ${colors.gradient} p-8 text-white relative overflow-hidden`}>
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 opacity-5 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')]" />
        
        <div className="relative z-10">
          {/* Title with better typography */}
          <h3 className="text-4xl font-bold mb-5 tracking-tight">{title}</h3>

          {/* Description with improved readability */}
          <p className="text-white/95 text-lg mb-8 leading-relaxed font-light">
            {description}
          </p>

          {/* CTA Button - Professional fintech style */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
            className={`w-full ${colors.buttonBg} ${colors.buttonHover} border-2 border-white/20 text-white font-semibold py-4 px-8 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:border-white/40 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 group/btn focus:outline-none focus:ring-4 focus:ring-white/50`}
            aria-label={`Accéder au service ${title}`}
          >
            <span>Accéder</span>
            <svg
              className="w-5 h-5 transition-transform duration-300 group-hover/btn:translate-x-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

