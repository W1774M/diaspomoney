'use client';

import { BookingForm } from '@/components/features/providers/BookingForm';
import { InfiniteReviewsCarousel } from '@/components/providers/index';
import { StatusBadge } from '@/components/ui';
import { useNotificationManager } from '@/components/ui/Notification';
import type { BookingFormData } from '@/lib/validations';
import { ProviderInfo, UserRole } from '@/types';
import { Building, Calendar, MapPin, Star } from 'lucide-react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

export default function ProviderDetailPage() {
  const router = useRouter();
  const { addSuccess, addError } = useNotificationManager();
  const id = useParams().id;
  const providerId = Array.isArray(id) ? id[0] : id;

  const [provider, setProvider] = useState<ProviderInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [ratingStats, setRatingStats] = useState<{
    averageRating: number;
    totalReviews: number;
    ratingDistribution: {
      5: number;
      4: number;
      3: number;
      2: number;
      1: number;
    };
  } | null>(null);

  const ratingColor = (rating: number) => {
    if (rating >= 4.5) return 'text-green-600';
    if (rating >= 4.0) return 'text-yellow-600';
    return 'text-red-600';
  };

  const ratingText = (rating: number) => {
    if (rating >= 4.5) return 'Excellent';
    if (rating >= 4.0) return 'Très bien';
    if (rating >= 3.5) return 'Bien';
    return 'Moyen';
  };

  const availableSlots = useMemo(() => {
    type TimeSlot = { start: string; end: string };
    const isTimeSlot = (v: unknown): v is TimeSlot =>
      !!v &&
      typeof v === 'object' &&
      v !== null &&
      'start' in (v as any) &&
      'end' in (v as any);

    const parseStringSlot = (s: string): TimeSlot | null => {
      const [startIso, endIso] = s.split('|');
      if (!startIso || !endIso) return null;
      return { start: startIso, end: endIso };
    };

    if (!provider) return [] as TimeSlot[];

    const raw = Array.isArray(provider.availabilities)
      ? provider.availabilities
      : [];
    const normalized: TimeSlot[] = (raw as any[])
      .map(item =>
        typeof item === 'string'
          ? parseStringSlot(item)
          : isTimeSlot(item)
          ? (item as TimeSlot)
          : null
      )
      .filter((v): v is TimeSlot => !!v);

    // Optionally remove taken appointments if provided in same {start,end} shape
    const taken = Array.isArray(provider.appointments)
      ? (provider.appointments as unknown[]).filter(isTimeSlot)
      : [];

    return normalized.filter(
      slot =>
        !taken.some(appt => appt.start === slot.start && appt.end === slot.end)
    );
  }, [provider]);

  const handleBookingClick = () => {
    setShowBookingModal(true);
    setShowBookingForm(true);
  };

  const handleCloseModal = () => {
    setShowBookingModal(false);
    setShowBookingForm(false);
  };

  const handleFormSubmit = async (_data: BookingFormData) => {
    try {
      // Ici on pourrait envoyer les données à l'API
      // console.log("Données du formulaire:", data);
      // console.log("Prestataire:", provider?.name);

      // Simuler un délai d'envoi
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Fermer le formulaire et afficher un message de succès
      handleCloseModal();

      // Ici on pourrait rediriger vers une page de confirmation
      // ou afficher une notification de succès
      addSuccess('Rendez-vous confirmé avec succès !');
    } catch (error) {
      addError('Erreur lors de la prise de rendez-vous. Veuillez réessayer.');
      console.error('Erreur lors de la prise de rendez-vous:', error);
    }
  };

  useEffect(() => {
    const loadProvider = async () => {
      try {
        setLoading(true);
        if (!providerId) {
          console.log('ProviderDetailPage: Aucun ID de provider fourni');
          setProvider(null);
          setLoading(false);
          return;
        }

        console.log(
          'ProviderDetailPage: Chargement du provider avec ID:',
          providerId
        );

        // Récupérer le prestataire depuis l'API
        try {
          const response = await fetch(`/api/providers/${providerId}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
            cache: 'no-store', // Éviter le cache pour avoir les données les plus récentes
          });

          console.log(
            'ProviderDetailPage: Réponse API status:',
            response.status
          );

          if (response.ok) {
            const data = await response.json();
            console.log('ProviderDetailPage: Données reçues:', {
              success: data.success,
              hasData: !!data.data,
              providerId: data.data?._id || data.data?.id,
              roles: data.data?.roles,
              status: data.data?.status,
            });

            const foundProvider = data.data;

            if (
              foundProvider &&
              Array.isArray(foundProvider.roles) &&
              foundProvider.roles.includes('PROVIDER') &&
              foundProvider.status === 'ACTIVE'
            ) {
              console.log('ProviderDetailPage: Provider valide trouvé');

              // Correction: Ajout d'un fallback pour availabilities et appointments si absents
              const providerData: ProviderInfo = {
                ...foundProvider,
                availabilities: foundProvider.availabilities || [],
                appointments: foundProvider.appointmentsAsProvider || [],
                images: foundProvider.images || [],
                // Assurer que les champs requis sont présents
                _id: foundProvider._id || foundProvider.id,
                id: foundProvider._id || foundProvider.id,
                name:
                  foundProvider.name ||
                  `${foundProvider.firstName || ''} ${
                    foundProvider.lastName || ''
                  }`.trim(),
                email: foundProvider.email,
                roles: foundProvider.roles,
                status: foundProvider.status,
                specialty: foundProvider.specialty,
                rating: foundProvider.rating || 0,
                city: foundProvider.city,
                specialties: foundProvider.specialties || [],
                services: foundProvider.services || [],
                providerInfo: foundProvider.providerInfo,
              };

              setProvider(providerData);

              // Charger les statistiques de rating
              const stats = {
                averageRating: foundProvider.rating || 4.5,
                totalReviews: foundProvider.reviewCount || 12,
                ratingDistribution: {
                  5: Math.floor((foundProvider.reviewCount || 12) * 0.6),
                  4: Math.floor((foundProvider.reviewCount || 12) * 0.25),
                  3: Math.floor((foundProvider.reviewCount || 12) * 0.1),
                  2: Math.floor((foundProvider.reviewCount || 12) * 0.03),
                  1: Math.floor((foundProvider.reviewCount || 12) * 0.02),
                },
              };
              setRatingStats(stats);
            } else {
              console.log('ProviderDetailPage: Provider invalide ou inactif:', {
                hasProvider: !!foundProvider,
                roles: foundProvider?.roles,
                status: foundProvider?.status,
              });
              setProvider(null);
            }
          } else {
            const errorData = await response.json().catch(() => ({}));
            console.error('ProviderDetailPage: Erreur API:', {
              status: response.status,
              statusText: response.statusText,
              error: errorData.error,
            });
            setProvider(null);
          }
        } catch (error) {
          console.error(
            'ProviderDetailPage: Erreur lors du chargement du prestataire:',
            error
          );
          setProvider(null);
        }
      } catch (error) {
        console.error('ProviderDetailPage: Erreur générale:', error);
        setProvider(null);
      } finally {
        setLoading(false);
      }
    };

    loadProvider();
  }, [providerId]);

  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
      </div>
    );
  }

  if (!provider) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='text-center'>
          <h2 className='text-2xl font-bold text-gray-900 mb-4'>
            Prestataire non trouvé
          </h2>
          <p className='text-gray-600'>
            Le prestataire que vous recherchez n&apos;existe pas.
          </p>
          <button
            onClick={() => router.push('/services')}
            className='mt-4 bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors'
            type='button'
          >
            Retour aux prestataires
          </button>
        </div>
      </div>
    );
  }

  // Subcomponents for readability
  const HeaderSection = () => (
    <div className='mb-6'>
      <div className='flex items-center gap-3 mb-2'>
        <h1 className='text-3xl font-bold text-gray-900'>{provider.name}</h1>
        <StatusBadge status='ACTIVE' size='md' />
        {/* Provider type information */}
      </div>
      <p className='text-xl text-gray-600 mb-2'>{provider.specialty}</p>
      {provider.company && (
        <div className='flex items-center text-gray-600 mb-2'>
          <Building className='w-5 h-5 mr-2' />
          <span>{provider.company}</span>
        </div>
      )}
    </div>
  );

  const ImageAndRating = () => (
    <div className='lg:w-1/3'>
      <div className='relative w-full h-64 rounded-lg flex items-center justify-center overflow-hidden bg-gray-100 mb-4'>
        {provider.profileImage ? (
          <Image
            src={provider.profileImage}
            alt={provider.name || ''}
            fill
            className='object-contain object-center'
            sizes='(max-width: 1024px) 100vw, 33vw'
            priority
          />
        ) : (
          <div className='w-full h-full flex items-center justify-center bg-gray-200'>
            <span className='text-gray-500 text-6xl'>
              {provider.name?.charAt(0).toUpperCase() || '?'}
            </span>
          </div>
        )}
      </div>
      <div className='text-center'>
        <div className='flex items-center justify-center mb-2'>
          <Star className='w-6 h-6 text-yellow-400 mr-2' />
          <span
            className={`text-2xl font-bold ${ratingColor(
              ratingStats?.averageRating ?? 0
            )}`}
          >
            {ratingStats?.averageRating !== undefined &&
            ratingStats?.averageRating !== null
              ? ratingStats.averageRating
              : 'N/A'}
          </span>
        </div>
        <p className='text-gray-600 mb-2'>
          {ratingText(ratingStats?.averageRating ?? 0)}
        </p>
        <p className='text-sm text-gray-500'>
          Basé sur {ratingStats?.totalReviews || 0} avis clients
        </p>
      </div>
    </div>
  );

  const LocationSection = () =>
    provider.apiGeo &&
    Array.isArray(provider.apiGeo) &&
    provider.apiGeo.length > 0 ? (
      <div className='flex items-center text-gray-600 mb-4'>
        <MapPin className='w-5 h-5 mr-2' />
        <span>
          {provider.apiGeo
            .map(geo => geo?.name)
            .filter(Boolean)
            .join(', ')}
        </span>
      </div>
    ) : null;

  const ServicesSection = () => {
    // Vérifier les services depuis providerInfo ou selectedServices
    const services =
      provider.providerInfo?.services ||
      provider.specialties ||
      provider.selectedServices ||
      [];

    if (!services || services.length === 0) return null;

    // Gérer le cas où services est un string ou un array
    let servicesList: string[] = [];

    if (Array.isArray(services)) {
      servicesList = services.map(s =>
        typeof s === 'string' ? s : (s as any).name || s.toString()
      );
    } else if (typeof services === 'string') {
      servicesList = (services as string)
        .split(',')
        .map((s: string) => s.trim());
    }

    if (servicesList.length === 0) return null;

    console.log('ServicesSection - Services trouvés:', {
      providerInfoServices: provider.providerInfo?.services,
      specialties: provider.specialties,
      selectedServices: provider.selectedServices,
      finalServices: servicesList,
    });

    return (
      <div className='mb-6'>
        <h3 className='text-lg font-semibold text-gray-900 mb-3'>
          Services proposés
        </h3>
        <div className='flex flex-wrap gap-2'>
          {servicesList.map((service, index) => (
            <span
              key={index}
              className='inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200'
            >
              {service}
            </span>
          ))}
        </div>
      </div>
    );
  };

  const BookingButton = () => {
    const handleQuoteRequest = () => {
      addError(
        'Fonctionnalité pas encore disponible, veuillez patienter pour le moment'
      );
    };

    // Si c'est un provider HEALTH, afficher le bouton de réservation
    if (provider.roles?.includes(UserRole.PROVIDER)) {
      return (
        <div className='mb-6'>
          <button
            onClick={handleBookingClick}
            className='flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-lg'
            data-testid='booking-button'
            type='button'
          >
            <Calendar className='w-5 h-5' />
            Prendre rendez-vous
          </button>
        </div>
      );
    }

    // Pour les autres catégories (EDU, IMMO), afficher le bouton de devis
    return (
      <div className='mb-6'>
        <button
          onClick={handleQuoteRequest}
          className='flex items-center gap-2 bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors font-medium shadow-lg'
          data-testid='quote-button'
          type='button'
        >
          <Calendar className='w-5 h-5' />
          Demander un devis
        </button>
      </div>
    );
  };

  const PhotosSection = () => (
    <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8'>
      <h3 className='text-xl font-semibold text-gray-900 mb-4'>Photos</h3>
      {provider.images && provider.images.length > 0 ? (
        <div className='flex flex-wrap gap-2'>
          {provider.images.map((image, index) => (
            <button
              aria-label={`Voir la photo ${index + 1}`}
              key={index}
              type='button'
              className='focus:outline-none'
              onClick={() => setSelectedImage(image)}
              style={{ border: 'none', background: 'none', padding: 0 }}
            >
              <Image
                src={image}
                alt={provider.name || ''}
                width={100}
                height={100}
                className='rounded shadow hover:scale-105 transition-transform'
                sizes='100px'
              />
            </button>
          ))}
        </div>
      ) : (
        <span className='text-gray-500 text-sm'>
          Aucune photo enregistrée pour ce prestataire.
        </span>
      )}
      {selectedImage && (
        <div
          className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70'
          onClick={() => setSelectedImage(null)}
          style={{ cursor: 'zoom-out' }}
        >
          <div className='relative' onClick={e => e.stopPropagation()}>
            <Image
              src={selectedImage}
              alt={provider.name || ''}
              width={800}
              height={800}
              className='rounded-lg shadow-lg max-h-[80vh] max-w-[90vw] object-contain'
              sizes='(max-width: 800px) 100vw, 800px'
            />
            <button
              className='absolute top-2 right-2 bg-white rounded-full p-1 shadow hover:bg-gray-200'
              onClick={() => setSelectedImage(null)}
              aria-label='Fermer'
              type='button'
            >
              <svg
                width='24'
                height='24'
                fill='none'
                stroke='currentColor'
                strokeWidth='2'
              >
                <path d='M6 6l12 12M6 18L18 6' />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const BookingModal = () => (
    <>
      {showBookingModal && (
        <div
          className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50'
          onClick={handleCloseModal}
          data-testid='booking-modal-overlay'
        >
          {showBookingForm ? (
            <div onClick={e => e.stopPropagation()}>
              <BookingForm
                provider={{
                  _id: provider._id,
                  name: provider.name,
                  specialty: provider.specialty ?? '',
                  ...(provider.roles?.includes(UserRole.CUSTOMER as any)
                    ? { role: UserRole.CUSTOMER as any }
                    : provider.roles?.includes(UserRole.PROVIDER as any)
                    ? { role: UserRole.PROVIDER as any }
                    : {}),
                  selectedServices:
                    typeof provider.selectedServices === 'string'
                      ? provider.selectedServices
                      : '',
                  price: (provider as any).price,
                  services: (provider as any).services,
                  availabilities: availableSlots,
                }}
                onClose={handleCloseModal}
                onSubmit={handleFormSubmit}
              />
            </div>
          ) : null}
        </div>
      )}
    </>
  );

  return (
    <div className='min-h-screen bg-gray-50 py-8'>
      <div className='max-w-6xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* En-tête avec bouton retour */}
        <div className='mb-6'>
          <button
            onClick={() => {
              // Revenir si possible, sinon fallback en conservant la catégorie du prestataire
              if (window.history.length > 1) {
                router.back();
                return;
              }
            }}
            className='flex items-center text-blue-600 hover:text-blue-800 transition-colors'
            type='button'
          >
            <svg
              className='w-5 h-5 mr-2'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M15 19l-7-7 7-7'
              />
            </svg>
            Retour aux prestataires
          </button>
        </div>

        {/* Informations principales */}
        <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-8'>
          <div className='flex flex-col lg:flex-row gap-8'>
            <ImageAndRating />
            <div className='lg:w-2/3'>
              <HeaderSection />
              <LocationSection />
              {provider.specialty !== 'Ecole'}
              <ServicesSection />
              <BookingButton />
            </div>
          </div>
        </div>

        {/* Photos */}
        <PhotosSection />

        {/* Description et détails */}
        <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8'>
          <h3 className='text-xl font-semibold text-gray-900 mb-4'>À propos</h3>
          <p className='text-gray-700 leading-relaxed'>
            {provider.description ||
              `${provider.name} est un prestataire qualifié dans le domaine de ${provider.specialty}. 
Avec une expertise reconnue et une approche centrée sur le client, 
nous nous engageons à fournir des services de qualité adaptés à vos besoins.`}
          </p>
        </div>

        {/* Recommandations */}
        {provider.recommended && (
          <div className='bg-green-50 border border-green-200 rounded-lg p-6'>
            <div className='flex items-center'>
              <Star className='w-6 h-6 text-green-600 mr-3' />
              <div>
                <h4 className='text-lg font-semibold text-green-800'>
                  Prestataire recommandé
                </h4>
                <p className='text-green-700'>
                  Ce prestataire a été recommandé par notre équipe pour la
                  qualité de ses services.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Statistiques de rating détaillées */}
        {ratingStats && ratingStats.totalReviews > 0 && (
          <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8'>
            <h3 className='text-xl font-semibold text-gray-900 mb-4'>
              Évaluations détaillées
            </h3>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              {/* Note moyenne */}
              <div className='text-center'>
                <div className='text-4xl font-bold text-[hsl(25,100%,53%)] mb-2'>
                  {ratingStats.averageRating}
                </div>
                <div className='flex justify-center mb-2'>
                  {[1, 2, 3, 4, 5].map(star => (
                    <Star
                      key={star}
                      className={`w-6 h-6 ${
                        star <= Math.round(ratingStats.averageRating)
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <p className='text-gray-600'>
                  Basé sur {ratingStats.totalReviews} avis
                </p>
              </div>

              {/* Distribution des notes */}
              <div className='space-y-2'>
                {[5, 4, 3, 2, 1].map(rating => (
                  <div key={rating} className='flex items-center'>
                    <span className='text-sm text-gray-600 w-8'>{rating}</span>
                    <Star className='w-4 h-4 text-yellow-400 fill-current mr-2' />
                    <div className='flex-1 bg-gray-200 rounded-full h-2 mx-2'>
                      <div
                        className='bg-[hsl(25,100%,53%)] h-2 rounded-full'
                        style={{
                          width: `${
                            ratingStats.totalReviews > 0
                              ? (ratingStats.ratingDistribution[
                                  rating as keyof typeof ratingStats.ratingDistribution
                                ] /
                                  ratingStats.totalReviews) *
                                100
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                    <span className='text-sm text-gray-600 w-8'>
                      {
                        ratingStats.ratingDistribution[
                          rating as keyof typeof ratingStats.ratingDistribution
                        ]
                      }
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Carousel d'avis clients infini */}
        <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8'>
          <h3 className='text-xl font-semibold text-gray-900 mb-4'>
            Avis clients
          </h3>
          <InfiniteReviewsCarousel providerId={providerId} />
        </div>
      </div>

      {/* Modal de prise de rendez-vous */}
      <BookingModal />
    </div>
  );
}
