"use client";

import { useState, useEffect } from "react";
import { ServiceCarouselCard } from "./ServiceCarouselCard";

interface Service {
  id: string;
  type: string;
  image: string;
  title: string;
  description: string;
  serviceType: string;
}

interface ServiceCarouselProps {
  services: Service[];
  onServiceClick: (serviceId: string) => void;
}

export function ServiceCarousel({
  services,
  onServiceClick,
}: ServiceCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Auto-scroll
  useEffect(() => {
    if (services.length <= 1) return;

    const interval = setInterval(() => {
      setIsTransitioning(true);
      setCurrentIndex((prev) => (prev + 1) % services.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [services.length]);

  // Reset transition state
  useEffect(() => {
    if (isTransitioning) {
      const timer = setTimeout(() => setIsTransitioning(false), 500);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isTransitioning, currentIndex]);

  if (services.length === 0) return null;

  return (
    <div className="relative w-full">
      {/* Carousel Container */}
      <div className="overflow-hidden rounded-xl">
        {/* Note: Inline style nécessaire pour le transform dynamique du carousel */}
        <div
          className="flex transition-transform duration-700 ease-[cubic-bezier(0.4,0,0.2,1)]"
          style={{
            transform: `translateX(-${currentIndex * 100}%)`,
          }}
        >
          {services.map((service) => (
            <div
              key={service.id}
              className="min-w-full w-full px-1"
            >
              <ServiceCarouselCard
                image={service.image}
                title={service.title}
                description={service.description}
                serviceType={service.serviceType}
                onClick={() => onServiceClick(service.id)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Indicators - Professional fintech style */}
      {services.length > 1 && (
        <div className="flex justify-center gap-3 mt-6" role="tablist" aria-label="Indicateurs de carousel">
          {services.map((_, index) => (
            <button
              key={index}
              type="button"
              role="tab"
              aria-selected={index === currentIndex}
              aria-label={`Aller au service ${index + 1}: ${services[index].title}`}
              className={`rounded-full transition-all duration-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/50 ${
                index === currentIndex
                  ? "w-10 h-2.5 bg-white shadow-lg"
                  : "w-2.5 h-2.5 bg-white/40 hover:bg-white/60"
              }`}
              onClick={() => {
                setIsTransitioning(true);
                setCurrentIndex(index);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

