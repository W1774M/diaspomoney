'use client';

import ExternalImage from '@/components/common/ExternalImage';
import { ExternalLink, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface Partner {
  id: string;
  name: string;
  logo: string;
  description: string;
  website: string;
  category: string;
  services: string[];
  location: string;
  established: string;
}

interface PartnerModalProps {
  partner: Partner | null;
  isOpen: boolean;
  onClose: () => void;
}

const PartnerModal = ({ partner, isOpen, onClose }: PartnerModalProps) => {
  if (!partner || !isOpen) return null;

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
      <div className='bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto'>
        {/* Header */}
        <div className='relative p-6 border-b'>
          <button
            title='Fermer'
            onClick={onClose}
            className='absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors'
          >
            <X className='w-6 h-6' />
          </button>

          <div className='flex items-center space-x-4'>
            <ExternalImage
              src={partner.logo}
              alt={partner.name}
              className='w-16 h-16 object-contain rounded-lg'
              width={64}
              height={64}
            />
            <div>
              <h2 className='text-2xl font-bold text-gray-900'>
                {partner.name}
              </h2>
              <p className='text-gray-600'>{partner.category}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className='p-6 space-y-6'>
          {/* Description */}
          <div>
            <h3 className='text-lg font-semibold text-gray-900 mb-2'>
              Description
            </h3>
            <p className='text-gray-700'>{partner.description}</p>
          </div>

          {/* Services */}
          <div>
            <h3 className='text-lg font-semibold text-gray-900 mb-2'>
              Services
            </h3>
            <div className='flex flex-wrap gap-2'>
              {partner.services.map((service, index) => (
                <span
                  key={index}
                  className='px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm'
                >
                  {service}
                </span>
              ))}
            </div>
          </div>

          {/* Details */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
              <h4 className='font-semibold text-gray-900 mb-1'>Localisation</h4>
              <p className='text-gray-600'>{partner.location}</p>
            </div>
            <div>
              <h4 className='font-semibold text-gray-900 mb-1'>Établi en</h4>
              <p className='text-gray-600'>{partner.established}</p>
            </div>
          </div>

          {/* Action Button */}
          <div className='pt-4 border-t'>
            <a
              href={partner.website}
              target='_blank'
              rel='noopener noreferrer'
              className='inline-flex items-center px-6 py-3 bg-[hsl(25,100%,53%)] text-white font-semibold rounded-lg hover:bg-[hsl(25,100%,45%)] transition-colors'
            >
              <ExternalLink className='w-5 h-5 mr-2' />
              Visiter le site
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export function InfiniteCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [disableTransition, setDisableTransition] = useState(false);
  const [hoveredPartnerId, setHoveredPartnerId] = useState<string | null>(null);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [visibleItems, setVisibleItems] = useState(5);
  const carouselRef = useRef<HTMLDivElement>(null);

  // Données des partenaires
  const [partners, setPartners] = useState<Partner[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/partners', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setPartners((data?.partners as Partner[]) || []);
      } catch {}
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Gestion de la responsivité
  useEffect(() => {
    const updateVisibleItems = () => {
      const width = window.innerWidth;
      if (width < 480) {
        setVisibleItems(1); // Très petit mobile: 1 item
      } else if (width < 640) {
        setVisibleItems(1); // Mobile: 1 item
      } else if (width < 768) {
        setVisibleItems(2); // Small tablet: 2 items
      } else if (width < 1024) {
        setVisibleItems(3); // Tablet: 3 items
      } else if (width < 1280) {
        setVisibleItems(4); // Desktop: 4 items
      } else {
        setVisibleItems(5); // Large desktop: 5 items
      }
    };

    updateVisibleItems();
    window.addEventListener('resize', updateVisibleItems);
    return () => window.removeEventListener('resize', updateVisibleItems);
  }, []);

  const baseLength = partners.length;

  // Gestion des différents cas de pagination
  const getCarouselConfig = () => {
    if (baseLength === 0) {
      return {
        track: [],
        startIndex: 0,
        itemWidthPct: 100,
        showIndicators: false,
        showNavigation: false,
      };
    }

    if (baseLength <= visibleItems) {
      // Moins d'items que la capacité visible - pas de carousel infini
      return {
        track: partners,
        startIndex: 0,
        itemWidthPct: 100 / baseLength,
        showIndicators: false,
        showNavigation: false,
      };
    }

    // Plus d'items que la capacité visible - carousel infini
    const track = [...partners, ...partners, ...partners];
    const startIndex = baseLength;

    return {
      track,
      startIndex,
      itemWidthPct: 100 / visibleItems,
      showIndicators: true,
      showNavigation: true,
    };
  };

  const config = getCarouselConfig();
  const { track, startIndex, itemWidthPct, showIndicators, showNavigation } =
    config;

  // Initialiser l'index au milieu au premier rendu
  useEffect(() => {
    if (baseLength > 0 && showNavigation) {
      setCurrentIndex(startIndex);
    } else if (baseLength > 0) {
      setCurrentIndex(0);
    }
  }, [baseLength, startIndex, showNavigation]);

  // Auto-scroll seulement si navigation activée
  useEffect(() => {
    if (hoveredPartnerId || baseLength === 0 || !showNavigation) return;

    const interval = setInterval(() => {
      setDisableTransition(false);
      setCurrentIndex(prev => prev + 1);
    }, 3000);

    return () => clearInterval(interval);
  }, [hoveredPartnerId, baseLength, showNavigation]);

  // Gérer la fin de transition pour recaler l'index au milieu sans animation
  const handleTransitionEnd = () => {
    if (!showNavigation) return;

    if (currentIndex >= startIndex + baseLength) {
      setDisableTransition(true);
      setCurrentIndex(startIndex);
    } else if (currentIndex <= startIndex - 1) {
      setDisableTransition(true);
      setCurrentIndex(startIndex + baseLength - 1);
    }
  };

  const handlePartnerClick = (partner: Partner) => {
    setSelectedPartner(partner);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPartner(null);
  };

  // Cas spécial: aucun partenaire
  if (baseLength === 0) {
    return (
      <div className='w-full flex flex-col items-center py-12'>
        <div className='bg-gray-50 rounded-lg p-8 shadow-sm w-full max-w-md text-center'>
          <div className='w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4'>
            <span className='text-2xl text-gray-400'>🤝</span>
          </div>
          <h3 className='text-lg font-semibold text-gray-900 mb-2'>
            Aucun partenaire disponible
          </h3>
          <p className='text-gray-600'>
            Nos partenaires seront bientôt disponibles. Revenez plus tard !
          </p>
        </div>
      </div>
    );
  }

  // Cas spécial: un seul partenaire - design centré et optimisé
  if (baseLength === 1) {
    const partner = partners[0];
    return (
      <div className='w-full flex justify-center'>
        <div className='w-full max-w-md lg:max-w-lg xl:max-w-xl'>
          <div
            className='relative bg-white rounded-xl shadow-lg overflow-hidden cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-2xl'
            onMouseEnter={() =>
              setHoveredPartnerId(partner && partner.id ? partner.id : null)
            }
            onMouseLeave={() => setHoveredPartnerId(null)}
            onClick={() => handlePartnerClick(partner as Partner)}
          >
            {/* Overlay sombre au hover */}
            <div
              className={`absolute inset-0 bg-black transition-opacity duration-300 z-10 ${
                hoveredPartnerId === (partner && partner.id ? partner.id : null)
                  ? 'opacity-30'
                  : 'opacity-0'
              }`}
            />

            {/* Image du partenaire */}
            <span
              className='aspect-video bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center'
              style={{
                backgroundImage: `url(${
                  partner && partner.logo ? partner.logo : ''
                })`,
                backgroundSize: 'auto 100%',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'center',
              }}
            ></span>

            {/* Contenu */}
            <div className='p-6'>
              <div className='flex items-center justify-between mb-3'>
                <h3 className='text-xl font-bold text-gray-900 truncate'>
                  {partner && partner.name ? partner.name : ''}
                </h3>
                <ExternalLink className='h-5 w-5 text-gray-400' />
              </div>

              <p className='text-gray-600 text-sm mb-4 line-clamp-3'>
                {partner && partner.description ? partner.description : ''}
              </p>

              <div className='flex flex-wrap gap-2 mb-4'>
                {partner && partner.services
                  ? partner.services.slice(0, 3).map((service, idx) => (
                      <span
                        key={idx}
                        className='px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full'
                      >
                        {service}
                      </span>
                    ))
                  : []}
                {partner && partner.services
                  ? partner.services.length > 3 && (
                      <span className='px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full'>
                        +{partner.services.length - 3} autres
                      </span>
                    )
                  : null}
              </div>

              <div className='flex items-center justify-between text-sm text-gray-500'>
                <span className='flex items-center'>
                  📍 {partner && partner.location ? partner.location : ''}
                </span>
                {partner && partner.established ? (
                  <span>Depuis {partner.established}</span>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Cas spécial: deux partenaires - design en grille centrée
  if (baseLength === 2) {
    return (
      <div className='w-full flex justify-center'>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl'>
          {partners.map(partner => (
            <div
              key={partner.id}
              className='relative bg-white rounded-xl shadow-lg overflow-hidden cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-2xl'
              onMouseEnter={() => setHoveredPartnerId(partner.id)}
              onMouseLeave={() => setHoveredPartnerId(null)}
              onClick={() => handlePartnerClick(partner)}
            >
              {/* Overlay sombre au hover */}
              <div
                className={`absolute inset-0 bg-black transition-opacity duration-300 z-10 ${
                  hoveredPartnerId === partner.id ? 'opacity-30' : 'opacity-0'
                }`}
              />

              {/* Image du partenaire */}
              <span
                className='aspect-video bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center'
                style={{
                  backgroundImage: `url(${partner.logo})`,
                  backgroundSize: 'auto 100%',
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'center',
                }}
              ></span>

              {/* Contenu */}
              <div className='p-6'>
                <div className='flex items-center justify-between mb-3'>
                  <h3 className='text-lg font-bold text-gray-900 truncate'>
                    {partner.name}
                  </h3>
                  <ExternalLink className='h-5 w-5 text-gray-400' />
                </div>

                <p className='text-gray-600 text-sm mb-4 line-clamp-2'>
                  {partner.description}
                </p>

                <div className='flex flex-wrap gap-2 mb-4'>
                  {partner.services.slice(0, 2).map((service, idx) => (
                    <span
                      key={idx}
                      className='px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full'
                    >
                      {service}
                    </span>
                  ))}
                  {partner.services.length > 2 && (
                    <span className='px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full'>
                      +{partner.services.length - 2} autres
                    </span>
                  )}
                </div>

                <div className='flex items-center justify-between text-sm text-gray-500'>
                  <span className='flex items-center'>
                    📍 {partner.location}
                  </span>
                  {partner.established && (
                    <span>Depuis {partner.established}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className='relative overflow-hidden'>
        <div
          ref={carouselRef}
          className={`flex ${
            disableTransition
              ? 'transition-none'
              : 'transition-transform duration-1000 ease-in-out'
          }`}
          style={{ transform: `translateX(-${currentIndex * itemWidthPct}%)` }}
          onTransitionEnd={handleTransitionEnd}
        >
          {track.map((partner, index) => (
            <div
              key={`${partner.id}-${index}`}
              className='flex-shrink-0 px-1 sm:px-2 md:px-4'
              style={{ width: `${itemWidthPct}%` }}
            >
              <div
                className={`relative bg-white rounded-xl shadow-lg overflow-hidden cursor-pointer transition-all duration-300 ${
                  hoveredPartnerId === partner.id
                    ? 'scale-105 shadow-2xl'
                    : 'hover:scale-105'
                }`}
                onMouseEnter={() => setHoveredPartnerId(partner.id)}
                onMouseLeave={() => setHoveredPartnerId(null)}
                onClick={() => handlePartnerClick(partner)}
              >
                {/* Overlay sombre au hover */}
                <div
                  className={`absolute inset-0 bg-black transition-opacity duration-300 z-10 ${
                    hoveredPartnerId === partner.id ? 'opacity-30' : 'opacity-0'
                  }`}
                />

                {/* Image du partenaire */}
                <div
                  className='aspect-video bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center'
                  style={{
                    backgroundImage: `url(${partner.logo})`,
                    backgroundSize: 'auto 100%',
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'center',
                  }}
                >
                  <ExternalImage
                    src={partner.logo}
                    alt={partner.name}
                    className='w-full h-full object-contain'
                    width={100}
                    height={100}
                  />
                </div>

                {/* Contenu */}
                <div className='p-2 sm:p-3 md:p-4'>
                  <h3 className='font-semibold text-gray-900 text-xs sm:text-sm mb-1 line-clamp-2'>
                    {partner.name}
                  </h3>
                  <p className='text-xs text-gray-600 mb-2 line-clamp-1'>
                    {partner.category}
                  </p>
                </div>

                {/* Bouton d'action visible au hover */}
                <div
                  className={`absolute bottom-2 sm:bottom-3 md:bottom-4 left-1/2 transform -translate-x-1/2 z-20 transition-opacity duration-300 ${
                    hoveredPartnerId === partner.id
                      ? 'opacity-100'
                      : 'opacity-0'
                  }`}
                >
                  <button className='bg-white text-[hsl(25,100%,53%)] px-2 sm:px-3 md:px-4 py-1 sm:py-2 rounded-full text-xs font-semibold shadow-lg hover:bg-gray-50 transition-colors'>
                    Voir détails
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Indicateurs de position - seulement si navigation activée et plus de partenaires que visible */}
        {showIndicators && baseLength > visibleItems && (
          <div className='flex justify-center mt-6 space-x-2'>
            {Array.from(
              { length: Math.ceil(baseLength / visibleItems) },
              (_, index) => (
                <button
                  title='Indicateur de position'
                  key={index}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    Math.floor(
                      ((currentIndex - startIndex + baseLength) % baseLength) /
                        visibleItems,
                    ) === index
                      ? 'bg-[hsl(25,100%,53%)]'
                      : 'bg-gray-300'
                  }`}
                  onClick={() => {
                    setDisableTransition(false);
                    setCurrentIndex(startIndex + index * visibleItems);
                  }}
                />
              ),
            )}
          </div>
        )}
      </div>

      {/* Modal des détails du partenaire */}
      <PartnerModal
        partner={selectedPartner}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </>
  );
}
