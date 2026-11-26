'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';

const PHOTO_TESTIMONIALS = [
  { id: 1, src: '/img/partners/WhatsApp Image 2026-02-05 at 14.59.59 (1).jpeg', alt: 'Cabinet dentaire d’une clinique partenaire, fauteuil et équipement de soins' },
  { id: 2, src: '/img/partners/WhatsApp Image 2026-02-25 at 12.18.54.jpeg', alt: 'Salle de radiologie du House of Health Medical Complex à Douala' },
  { id: 3, src: '/img/partners/WhatsApp Image 2026-02-05 at 14.59.59.jpeg', alt: 'Une dentiste soigne une patiente dans une clinique partenaire' },
];

const IMAGES_PER_SLIDE = 2;

function chunk<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

const slides = chunk(PHOTO_TESTIMONIALS, IMAGES_PER_SLIDE);
const slideCount = slides.length;

/**
 * Carrousel à défilement natif (scroll-snap) : utilisable au doigt, au clavier et sans JS.
 * Pas de lecture automatique ; le script ne fait que piloter les boutons, les marqueurs
 * et annoncer la diapositive courante une fois le défilement terminé.
 * Moins de 3 diapositives : navigation finie (pas de boucle), boutons désactivés aux extrémités.
 */
export function PhotoTestimonialsSection() {
  const trackRef = useRef<HTMLDivElement>(null);
  const prevRef = useRef<HTMLButtonElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const pendingTarget = useRef<number | null>(null);
  const settledIndex = useRef(0);
  const [current, setCurrent] = useState(0);
  const [status, setStatus] = useState('');

  const nearestSlide = useCallback((): number => {
    const track = trackRef.current;
    if (!track) return 0;
    const center = track.scrollLeft + track.clientWidth / 2;
    let best = 0;
    let bestDistance = Infinity;
    Array.from(track.children).forEach((child, index) => {
      const el = child as HTMLElement;
      const distance = Math.abs(el.offsetLeft + el.offsetWidth / 2 - center);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = index;
      }
    });
    return best;
  }, []);

  const scrollToSlide = useCallback((index: number) => {
    const track = trackRef.current;
    const slide = track?.children[index] as HTMLElement | undefined;
    if (!track || !slide) return;
    pendingTarget.current = index;
    setCurrent(index);
    const smooth = window.matchMedia('(prefers-reduced-motion: no-preference)').matches;
    // Défile uniquement la piste (jamais la page), contrairement à scrollIntoView().
    track.scrollTo({
      left: slide.offsetLeft - (track.clientWidth - slide.offsetWidth) / 2,
      behavior: smooth ? 'smooth' : 'auto',
    });
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    let frame = 0;
    const onScroll = () => {
      // Pendant un défilement piloté par un bouton, on garde la cible en attente.
      if (pendingTarget.current !== null || frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        setCurrent(nearestSlide());
      });
    };

    const onSettle = () => {
      pendingTarget.current = null;
      const index = nearestSlide();
      setCurrent(index);
      if (index !== settledIndex.current) {
        settledIndex.current = index;
        setStatus(`Diapositive ${index + 1} sur ${slideCount}`);
      }
      // Bouton devenu désactivé alors qu'il avait le focus : on le reporte sur l'autre.
      if (index === 0 && document.activeElement === prevRef.current) nextRef.current?.focus();
      if (index === slideCount - 1 && document.activeElement === nextRef.current) {
        prevRef.current?.focus();
      }
    };

    let settleTimer: number | undefined;
    const hasScrollEnd = 'onscrollend' in window;
    const onScrollFallback = () => {
      window.clearTimeout(settleTimer);
      settleTimer = window.setTimeout(onSettle, 120);
    };

    track.addEventListener('scroll', onScroll, { passive: true });
    if (hasScrollEnd) track.addEventListener('scrollend', onSettle);
    else track.addEventListener('scroll', onScrollFallback, { passive: true });

    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(settleTimer);
      track.removeEventListener('scroll', onScroll);
      track.removeEventListener('scrollend', onSettle);
      track.removeEventListener('scroll', onScrollFallback);
    };
  }, [nearestSlide]);

  const step = (direction: 1 | -1) => {
    const from = pendingTarget.current ?? current;
    const target = Math.min(slideCount - 1, Math.max(0, from + direction));
    scrollToSlide(target);
  };

  return (
    <section
      id="photo-testimonials"
      className="py-20 md:pt-12 md:pb-1 bg-white relative overflow-hidden"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Tag */}
        <div className="flex justify-center mb-6">
          <span
            className="inline-block px-4 py-1.5 rounded-full text-white text-sm font-medium"
            style={{
              backgroundColor: 'var(--brand-600)',
              fontFamily: 'var(--font-plus-jakarta-sans), sans-serif',
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
              fontFamily: 'var(--font-plus-jakarta-sans), sans-serif',
              color: '#1C1917',
            }}
          >
            Notre parcours en <span className='text-brand-600'>images</span>
          </h2>
          <p
            className="text-lg text-gray-600 max-w-2xl mx-auto"
            style={{
              fontFamily: 'var(--font-plus-jakarta-sans), sans-serif',
            }}
          >
            Découvrez en images comment DiaspoMoney connecte la diaspora aux soins de leurs proches.
          </p>
        </div>

        {/* Carousel */}
        <section
          className="relative w-full max-w-4xl mx-auto"
          aria-roledescription="carrousel"
          aria-label="Notre parcours en images"
        >
          {slideCount > 1 && (
            <div className="pointer-events-none absolute inset-y-0 -inset-x-4 z-10 flex items-center justify-between md:-inset-x-12">
              <button
                ref={prevRef}
                type="button"
                onClick={() => step(-1)}
                disabled={current === 0}
                className="pointer-events-auto touch-manipulation w-10 h-10 rounded-full bg-white shadow-lg border border-gray-200 flex items-center justify-center text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
                aria-label="Diapositive précédente"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                ref={nextRef}
                type="button"
                onClick={() => step(1)}
                disabled={current === slideCount - 1}
                className="pointer-events-auto touch-manipulation w-10 h-10 rounded-full bg-white shadow-lg border border-gray-200 flex items-center justify-center text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
                aria-label="Diapositive suivante"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}

          <div
            ref={trackRef}
            tabIndex={0}
            role="group"
            aria-label="Diapositives"
            className="flex overflow-x-auto snap-x snap-mandatory overscroll-x-contain touch-manipulation scrollbar-hide rounded-2xl border border-gray-200 shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
          >
            {slides.map((slideItems, slideIdx) => (
              <div
                key={slideIdx}
                role="group"
                aria-roledescription="diapositive"
                aria-label={`${slideIdx + 1} sur ${slideCount}`}
                className="min-w-full w-full shrink-0 snap-center flex gap-2 md:gap-3 p-2 md:p-3"
              >
                {slideItems.map((item) => (
                  <div
                    key={item.id}
                    className={`relative aspect-[8/3] bg-gray-100 rounded-lg overflow-hidden ${
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

          <p className="sr-only" role="status" aria-live="polite">
            {status}
          </p>

          {/* Marqueurs : la diapositive active se distingue par sa largeur, pas seulement sa couleur */}
          {slideCount > 1 && (
            <nav className="flex justify-center gap-1 mt-6" aria-label="Choisir une diapositive">
              {slides.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  aria-label={`Aller à la diapositive ${index + 1}`}
                  aria-current={index === current ? 'true' : undefined}
                  onClick={() => scrollToSlide(index)}
                  className="group flex h-6 min-w-6 items-center justify-center rounded-full px-1 touch-manipulation focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-600"
                >
                  <span
                    className={`block h-2 rounded-full transition-[width,background-color] duration-300 ${
                      index === current ? 'w-8 bg-brand-600' : 'w-2 bg-gray-400 group-hover:bg-gray-500'
                    }`}
                  />
                </button>
              ))}
            </nav>
          )}
        </section>
      </div>
    </section>
  );
}

export default PhotoTestimonialsSection;
