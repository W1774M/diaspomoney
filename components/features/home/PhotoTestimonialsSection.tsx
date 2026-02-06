'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

const PHOTO_TESTIMONIALS = [
  { id: 1, src: '/img/partners/WhatsApp Image 2026-02-05 at 14.59.58.jpeg', alt: 'Partenaires DiaspoMoney' },
  { id: 2, src: '/img/partners/WhatsApp Image 2026-02-05 at 14.59.59 (1).jpeg', alt: 'Partenaires DiaspoMoney' },
  { id: 3, src: '/img/partners/WhatsApp Image 2026-02-05 at 14.59.59 (2).jpeg', alt: 'Partenaires DiaspoMoney' },
  { id: 4, src: '/img/partners/WhatsApp Image 2026-02-05 at 14.59.59 (3).jpeg', alt: 'DiaspoMoney' },
  { id: 5, src: '/img/partners/WhatsApp Image 2026-02-05 at 14.59.59.jpeg', alt: 'Partenaires DiaspoMoney' },
];

const IMAGES_PER_SLIDE = 2;

function chunk<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

export function PhotoTestimonialsSection() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const slides = chunk(PHOTO_TESTIMONIALS, IMAGES_PER_SLIDE);
  const slideCount = slides.length;

  useEffect(() => {
    if (slideCount <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slideCount);
    }, 4000);
    return () => clearInterval(interval);
  }, [slideCount]);

  return (
    <section
      id="photo-testimonials"
      className="py-20 md:py-24 bg-white relative overflow-hidden"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Tag */}
        <div className="flex justify-center mb-6">
          <span
            className="inline-block px-4 py-1.5 rounded-full text-white text-sm font-medium"
            style={{
              backgroundColor: '#F97015',
              fontFamily: 'Plus Jakarta Sans, sans-serif',
            }}
          >
            Témoignages en images
          </span>
        </div>

        {/* Title */}
        <div className="text-center mb-12">
          <h2
            className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4"
            style={{
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              color: '#1C1917',
            }}
          >
            Notre parcours en <span style={{ color: '#F97015' }}>images</span>
          </h2>
          <p
            className="text-lg text-gray-600 max-w-2xl mx-auto"
            style={{
              fontFamily: 'Plus Jakarta Sans, sans-serif',
            }}
          >
            Découvrez en images comment DiaspoMoney connecte la diaspora aux soins de leurs proches.
          </p>
        </div>

        {/* Carousel */}
        <div className="relative w-full max-w-4xl mx-auto">
          <div className="overflow-hidden rounded-2xl border border-gray-200 shadow-lg">
            <div
              className="flex transition-transform duration-500 ease-out"
              style={{
                transform: `translateX(-${currentIndex * 100}%)`,
              }}
            >
              {slides.map((slideItems, slideIdx) => (
                <div
                  key={slideIdx}
                  className="min-w-full w-full flex gap-2 md:gap-3 p-2 md:p-3"
                >
                  {slideItems.map((item) => (
                    <div
                      key={item.id}
                      className={`relative aspect-[4/3] bg-gray-100 rounded-lg overflow-hidden ${
                        slideItems.length === 1 ? 'w-full' : 'flex-1 min-w-0'
                      }`}
                    >
                      <Image
                        src={item.src}
                        alt={item.alt}
                        fill
                        className="object-cover"
                        sizes="(min-width: 1024px) 448px, (min-width: 768px) 336px, 50vw"
                      />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Navigation arrows */}
          {slideCount > 1 && (
            <>
              <button
                type="button"
                onClick={() => setCurrentIndex((prev) => (prev - 1 + slideCount) % slideCount)}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 md:-translate-x-12 w-10 h-10 rounded-full bg-white shadow-lg border border-gray-200 flex items-center justify-center text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#F97015]/50"
                aria-label="Image précédente"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => setCurrentIndex((prev) => (prev + 1) % slideCount)}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 md:translate-x-12 w-10 h-10 rounded-full bg-white shadow-lg border border-gray-200 flex items-center justify-center text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#F97015]/50"
                aria-label="Image suivante"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}

          {/* Indicators */}
          {slideCount > 1 && (
            <div
              className="flex justify-center gap-2 mt-6"
              role="tablist"
              aria-label="Indicateurs du carousel"
            >
              {slides.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  role="tab"
                  aria-selected={index === currentIndex}
                  aria-label={`Aller au slide ${index + 1}`}
                  className={`rounded-full transition-all duration-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#F97015]/50 ${
                    index === currentIndex
                      ? 'w-8 h-2 bg-[#F97015]'
                      : 'w-2 h-2 bg-gray-300 hover:bg-gray-400'
                  }`}
                  onClick={() => setCurrentIndex(index)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default PhotoTestimonialsSection;
