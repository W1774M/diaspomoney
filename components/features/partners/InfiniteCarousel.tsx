'use client';

/**
 * Liste défilante des partenaires.
 * Défilement natif avec scroll-snap, sans lecture automatique ni copies des cartes :
 * chaque partenaire n'existe qu'une fois dans le DOM, les boutons précédent/suivant
 * déplacent d'une largeur visible et se désactivent aux extrémités.
 * Le détail s'ouvre dans une modale <dialog> native.
 */
import ExternalImage from '@/components/common/ExternalImage';
import { NativeModal } from '@/components/ui/NativeModal';
import { ChevronLeft, ChevronRight, ExternalLink, MapPin, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

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

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function PartnerModal({ partner, onClose }: { partner: Partner | null; onClose: () => void }) {
  return (
    <NativeModal
      open={partner !== null}
      onClose={onClose}
      labelledBy='partner-detail-title'
      className='w-full max-w-2xl rounded-2xl shadow-2xl'
    >
      {partner ? (
        <div>
          <div className='relative border-b p-6'>
            <button
              type='button'
              onClick={onClose}
              aria-label='Fermer le détail du partenaire'
              className='absolute right-4 top-4 rounded-full p-1 text-gray-500 transition-colors hover:text-gray-700'
            >
              <X className='h-6 w-6' aria-hidden />
            </button>

            <div className='flex items-center gap-4 pr-10'>
              <ExternalImage
                src={partner.logo}
                alt=''
                className='h-16 w-16 rounded-lg object-contain'
                width={64}
                height={64}
              />
              <div>
                <h2 id='partner-detail-title' className='text-2xl font-bold text-gray-900'>
                  {partner.name}
                </h2>
                <p className='text-gray-600'>{partner.category}</p>
              </div>
            </div>
          </div>

          <div className='space-y-6 p-6'>
            <div>
              <h3 className='mb-2 text-lg font-semibold text-gray-900'>Description</h3>
              <p className='text-gray-700'>{partner.description}</p>
            </div>

            {partner.services.length > 0 ? (
              <div>
                <h3 className='mb-2 text-lg font-semibold text-gray-900'>Services</h3>
                <ul className='flex flex-wrap gap-2'>
                  {partner.services.map((service) => (
                    <li
                      key={service}
                      className='rounded-full bg-orange-50 px-3 py-1 text-sm text-[hsl(25,100%,35%)]'
                    >
                      {service}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <dl className='grid grid-cols-1 gap-4 md:grid-cols-2'>
              {partner.location ? (
                <div>
                  <dt className='mb-1 font-semibold text-gray-900'>Localisation</dt>
                  <dd className='text-gray-600'>{partner.location}</dd>
                </div>
              ) : null}
              {partner.established ? (
                <div>
                  <dt className='mb-1 font-semibold text-gray-900'>Établi en</dt>
                  <dd className='text-gray-600'>{partner.established}</dd>
                </div>
              ) : null}
            </dl>

            {partner.website ? (
              <div className='border-t pt-4'>
                <a
                  href={partner.website}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='inline-flex items-center rounded-lg bg-[hsl(25,100%,45%)] px-6 py-3 font-semibold text-white transition-colors hover:bg-[hsl(25,100%,40%)]'
                >
                  <ExternalLink className='mr-2 h-5 w-5' aria-hidden />
                  Visiter le site
                  <span className='sr-only'> de {partner.name} (nouvel onglet)</span>
                </a>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </NativeModal>
  );
}

function PartnerCard({ partner, onOpen }: { partner: Partner; onOpen: () => void }) {
  return (
    <article className='group relative flex h-full flex-col overflow-hidden rounded-xl bg-white shadow-lg transition-shadow focus-within:ring-2 focus-within:ring-[hsl(25,100%,45%)] hover:shadow-2xl'>
      <div className='flex aspect-video items-center justify-center bg-gradient-to-br from-orange-50 to-amber-100 p-4'>
        <ExternalImage
          src={partner.logo}
          alt=''
          className='h-full w-full object-contain'
          width={300}
          height={200}
        />
      </div>
      <div className='flex flex-1 flex-col p-4'>
        <h3 className='mb-1 line-clamp-2 font-semibold text-gray-900'>
          {/* Le bouton couvre toute la carte via ::after. */}
          <button
            type='button'
            onClick={onOpen}
            aria-haspopup='dialog'
            className='text-left after:absolute after:inset-0 after:content-[""] focus-visible:outline-none'
          >
            {partner.name}
          </button>
        </h3>
        <p className='line-clamp-1 text-sm text-gray-600'>{partner.category}</p>
        {partner.location ? (
          <p className='mt-auto flex items-center gap-1 pt-3 text-sm text-gray-500'>
            <MapPin className='h-4 w-4 shrink-0' aria-hidden />
            {partner.location}
          </p>
        ) : null}
      </div>
    </article>
  );
}

export function InfiniteCarousel() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);
  const scrollerRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/partners', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setPartners((data?.partners as Partner[]) || []);
      } catch {
        // Ignorer les erreurs de fetch
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const updateEdges = useCallback(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const maxScroll = scroller.scrollWidth - scroller.clientWidth;
    setCanPrev(scroller.scrollLeft > 4);
    setCanNext(scroller.scrollLeft < maxScroll - 4);
  }, []);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    updateEdges();
    scroller.addEventListener('scroll', updateEdges, { passive: true });
    const observer = new ResizeObserver(updateEdges);
    observer.observe(scroller);
    return () => {
      scroller.removeEventListener('scroll', updateEdges);
      observer.disconnect();
    };
  }, [partners.length, updateEdges]);

  // Un bouton désactivé perd le focus : on le reporte sur l'autre bouton.
  const prevRef = useRef<HTMLButtonElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!canPrev && document.activeElement === prevRef.current) nextRef.current?.focus();
    if (!canNext && document.activeElement === nextRef.current) prevRef.current?.focus();
  }, [canPrev, canNext]);

  const scrollByPage = (direction: 1 | -1) => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    scroller.scrollBy({
      left: direction * scroller.clientWidth,
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
    });
  };

  if (loaded && partners.length === 0) {
    return (
      <div className='flex w-full flex-col items-center py-12'>
        <div className='w-full max-w-md rounded-lg bg-gray-50 p-8 text-center shadow-sm'>
          <h3 className='mb-2 text-lg font-semibold text-gray-900'>Aucun partenaire disponible</h3>
          <p className='text-gray-600'>
            Nos partenaires seront bientôt disponibles. Revenez plus tard !
          </p>
        </div>
      </div>
    );
  }

  const showControls = canPrev || canNext;
  const controlClass =
    'inline-flex h-11 w-11 items-center justify-center rounded-full border border-orange-200 bg-white text-[hsl(25,100%,40%)] shadow-sm transition-colors hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-40';

  return (
    <>
      <section aria-roledescription='carrousel' aria-label='Nos partenaires' className='relative'>
        <ul
          ref={scrollerRef}
          className='scrollbar-hide flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-1 px-1 pb-4 pt-2 md:gap-6'
        >
          {partners.map((partner, index) => (
            <li
              key={partner.id}
              aria-roledescription='diapositive'
              aria-label={`${index + 1} sur ${partners.length}`}
              className='w-[80%] shrink-0 snap-start sm:w-[calc((100%-1rem)/2)] md:w-[calc((100%-3rem)/3)] lg:w-[calc((100%-4.5rem)/4)] xl:w-[calc((100%-6rem)/5)]'
            >
              <PartnerCard partner={partner} onOpen={() => setSelectedPartner(partner)} />
            </li>
          ))}
        </ul>

        {showControls ? (
          <div className='mt-4 flex justify-center gap-3'>
            <button
              type='button'
              className={controlClass}
              ref={prevRef}
              onClick={() => scrollByPage(-1)}
              disabled={!canPrev}
              aria-label='Partenaires précédents'
            >
              <ChevronLeft className='h-5 w-5' aria-hidden />
            </button>
            <button
              type='button'
              className={controlClass}
              ref={nextRef}
              onClick={() => scrollByPage(1)}
              disabled={!canNext}
              aria-label='Partenaires suivants'
            >
              <ChevronRight className='h-5 w-5' aria-hidden />
            </button>
          </div>
        ) : null}
      </section>

      <PartnerModal partner={selectedPartner} onClose={() => setSelectedPartner(null)} />
    </>
  );
}
