'use client';

import { useAuth } from '@/hooks/auth/useAuth';
import { USER_STATUSES } from '@/lib/constants';
import type { ProviderInfo, Service, User } from '@/lib/types';
import { User as UserIcon, Building, Stethoscope, Wrench, GraduationCap, Mail, Phone, MapPin, Calendar, Shield, Star, CheckCircle, XCircle, Clock } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

type ProviderDetails = User & {
  providerInfo?: ProviderInfo;
  selectedServices?: string | string[];
};

export default function ProviderDetailPage() {
  const { isAuthenticated, isAdmin, isCSM, isLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const providerId = params?.id as string;

  const [provider, setProvider] = useState<ProviderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Vérification des permissions
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || (!isAdmin() && !isCSM()))) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isAdmin, isCSM, isLoading, router]);

  // Récupération des détails du provider
  useEffect(() => {
    if (!providerId || isLoading) return;

    const fetchProvider = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/providers/${providerId}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Prestataire non trouvé');
          }
          throw new Error('Erreur lors de la récupération du prestataire');
        }

        const data = await response.json();
        setProvider(data.data || data.provider || null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
      } finally {
        setLoading(false);
      }
    };

    fetchProvider();
  }, [providerId, isLoading]);

  const getCategoryIcon = (category?: string) => {
    switch (category) {
      case 'HEALTH':
        return Stethoscope;
      case 'BTP':
        return Wrench;
      case 'EDUCATION':
        return GraduationCap;
      default:
        return Building;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; icon: any; label: string }> = {
      [USER_STATUSES.ACTIVE]: {
        color: 'bg-green-100 text-green-800',
        icon: CheckCircle,
        label: 'Actif',
      },
      [USER_STATUSES.PENDING]: {
        color: 'bg-yellow-100 text-yellow-800',
        icon: Clock,
        label: 'En attente',
      },
      [USER_STATUSES.INACTIVE]: {
        color: 'bg-gray-100 text-gray-800',
        icon: XCircle,
        label: 'Inactif',
      },
      [USER_STATUSES.SUSPENDED]: {
        color: 'bg-red-100 text-red-800',
        icon: XCircle,
        label: 'Suspendu',
      },
    };
    const config = statusConfig[status] || {
      color: 'bg-gray-100 text-gray-800',
      icon: Clock,
      label: status,
    };
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
        <Icon className='h-4 w-4 mr-1' />
        {config.label}
      </span>
    );
  };

  const getProviderName = (provider: ProviderDetails) => {
    if (provider.firstName && provider.lastName) {
      return `${provider.firstName} ${provider.lastName}`;
    }
    return provider.name || provider.email || 'Prestataire';
  };

  if (isLoading || loading) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(25,100%,53%)]'></div>
      </div>
    );
  }

  if (!isAuthenticated || (!isAdmin() && !isCSM())) {
    return null;
  }

  if (error) {
    return (
      <div className='min-h-screen bg-gray-50'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
          <div className='bg-white rounded-lg shadow border border-gray-200 p-12 text-center'>
            <XCircle className='h-16 w-16 text-red-400 mx-auto mb-4' />
            <h3 className='text-lg font-medium text-gray-900 mb-2'>Erreur</h3>
            <p className='text-gray-500 mb-4'>{error}</p>
            <Link
              href='/dashboard/providers'
              className='inline-flex items-center px-4 py-2 bg-[hsl(25,100%,53%)] text-white rounded-lg hover:bg-[hsl(25,100%,48%)] transition-colors'
            >
              Retour à la liste
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!provider) {
    return (
      <div className='min-h-screen bg-gray-50'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
          <div className='bg-white rounded-lg shadow border border-gray-200 p-12 text-center'>
            <UserIcon className='h-16 w-16 text-gray-400 mx-auto mb-4' />
            <h3 className='text-lg font-medium text-gray-900 mb-2'>
              Prestataire non trouvé
            </h3>
            <p className='text-gray-500 mb-4'>
              Le prestataire demandé n'existe pas ou a été supprimé.
            </p>
            <Link
              href='/dashboard/providers'
              className='inline-flex items-center px-4 py-2 bg-[hsl(25,100%,53%)] text-white rounded-lg hover:bg-[hsl(25,100%,48%)] transition-colors'
            >
              Retour à la liste
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const CategoryIcon = getCategoryIcon(provider.providerInfo?.category);
  const providerName = getProviderName(provider);
  const initials = providerName
    .split(' ')
    .map((n: string) => n && n.length > 0 ? n.charAt(0) : '')
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'P';

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        {/* Header */}
        <div className='mb-8'>
          <Link
            href='/dashboard/providers'
            className='inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4'
          >
            ← Retour à la liste des prestataires
          </Link>
          <div className='flex items-center justify-between'>
            <div className='flex items-center'>
              <div className='flex-shrink-0 h-16 w-16 rounded-full bg-[hsl(25,100%,53%)] flex items-center justify-center text-white font-bold text-2xl mr-4'>
                {initials}
              </div>
              <div>
                <h1 className='text-3xl font-bold text-gray-900'>{providerName}</h1>
                <div className='flex items-center gap-3 mt-2'>
                  {getStatusBadge(provider.status)}
                  {provider.providerInfo?.isVerified && (
                    <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800'>
                      <Shield className='h-3.5 w-3.5 mr-1' />
                      Vérifié
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
          {/* Colonne principale */}
          <div className='lg:col-span-2 space-y-6'>
            {/* Informations générales */}
            <div className='bg-white rounded-lg shadow border border-gray-200 p-6'>
              <h2 className='text-xl font-semibold text-gray-900 mb-4'>Informations générales</h2>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div className='flex items-start'>
                  <Mail className='h-5 w-5 text-gray-400 mr-3 mt-0.5' />
                  <div>
                    <p className='text-sm text-gray-500'>Email</p>
                    <p className='text-sm font-medium text-gray-900'>{provider.email}</p>
                    {provider['isEmailVerified'] && (
                      <span className='inline-flex items-center text-xs text-green-600 mt-1'>
                        <CheckCircle className='h-3 w-3 mr-1' />
                        Vérifié
                      </span>
                    )}
                  </div>
                </div>
                {provider.phone && (
                  <div className='flex items-start'>
                    <Phone className='h-5 w-5 text-gray-400 mr-3 mt-0.5' />
                    <div>
                      <p className='text-sm text-gray-500'>Téléphone</p>
                      <p className='text-sm font-medium text-gray-900'>{provider.phone}</p>
                    </div>
                  </div>
                )}
                {provider.address && (
                  <div className='flex items-start'>
                    <MapPin className='h-5 w-5 text-gray-400 mr-3 mt-0.5' />
                    <div>
                      <p className='text-sm text-gray-500'>Adresse</p>
                      <p className='text-sm font-medium text-gray-900'>{provider.address}</p>
                      {(provider['city'] || provider['country']) && (
                        <p className='text-xs text-gray-500 mt-1'>
                          {[provider['city'], provider['country']].filter(Boolean).join(', ')}
                        </p>
                      )}
                    </div>
                  </div>
                )}
                {provider.company && (
                  <div className='flex items-start'>
                    <Building className='h-5 w-5 text-gray-400 mr-3 mt-0.5' />
                    <div>
                      <p className='text-sm text-gray-500'>Entreprise</p>
                      <p className='text-sm font-medium text-gray-900'>{provider.company}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Informations prestataire */}
            <div className='bg-white rounded-lg shadow border border-gray-200 p-6'>
              <h2 className='text-xl font-semibold text-gray-900 mb-4'>Informations prestataire</h2>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <p className='text-sm text-gray-500 mb-1'>Type</p>
                  <p className='text-sm font-medium text-gray-900'>
                    {provider.providerInfo?.type === 'INDIVIDUAL' ? 'Individuel' : 'Institution'}
                  </p>
                </div>
                <div>
                  <p className='text-sm text-gray-500 mb-1'>Catégorie</p>
                  <div className='flex items-center'>
                    {CategoryIcon && <CategoryIcon className='h-4 w-4 text-gray-400 mr-2' />}
                    <p className='text-sm font-medium text-gray-900'>
                      {provider.providerInfo?.category || 'Non spécifié'}
                    </p>
                  </div>
                </div>
                {provider.providerInfo?.rating !== undefined && (
                  <div>
                    <p className='text-sm text-gray-500 mb-1'>Note moyenne</p>
                    <div className='flex items-center'>
                      <Star className='h-4 w-4 text-yellow-400 mr-1' />
                      <p className='text-sm font-medium text-gray-900'>
                        {provider.providerInfo.rating.toFixed(1)} / 5
                        {provider.providerInfo.reviewCount !== undefined && (
                          <span className='text-gray-500 ml-1'>
                            ({provider.providerInfo.reviewCount} avis)
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                )}
                  {provider['kycStatus'] && (
                  <div>
                    <p className='text-sm text-gray-500 mb-1'>Statut KYC</p>
                    <p className='text-sm font-medium text-gray-900'>{provider['kycStatus']}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Services et spécialités */}
            {(provider.providerInfo?.specialties?.length || provider.providerInfo?.services?.length || provider.selectedServices) && (
              <div className='bg-white rounded-lg shadow border border-gray-200 p-6'>
                <h2 className='text-xl font-semibold text-gray-900 mb-4'>Services et spécialités</h2>
                <div className='space-y-4'>
                  {provider.providerInfo?.specialties && provider.providerInfo?.specialties?.length > 0 && (
                    <div>
                      <p className='text-sm text-gray-500 mb-2'>Spécialités</p>
                      <div className='flex flex-wrap gap-2'>
                        {provider.providerInfo.specialties.map((specialty: string, index: number) => (
                          <span
                            key={index}
                            className='inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800'
                          >
                            {specialty}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {((provider.providerInfo?.services && provider.providerInfo.services.length > 0) || provider.selectedServices) && (
                    <div>
                      <p className='text-sm text-gray-500 mb-2'>Services</p>
                      <div className='flex flex-wrap gap-2'>
                        {(() => {
                          let services: string[] = [];
                          if (provider.providerInfo?.services && provider.providerInfo.services.length > 0) {
                            services = provider.providerInfo.services.map((service: Service) => service.name);
                          } else if (provider.selectedServices) {
                            const selectedServices = provider.selectedServices as string | string[] | undefined;
                            if (typeof selectedServices === 'string') {
                              services = selectedServices.split(',').map((s: string) => s.trim());
                            } else if (Array.isArray(selectedServices)) {
                              services = selectedServices.map((s: any) => String(s).trim());
                            }
                          }
                          return services.map((service: string, index: number) => (
                            <span
                              key={index}
                              className='inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800'
                            >
                              {service}
                            </span>
                          ));
                        })()}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Description */}
            {provider.providerInfo?.description && (
              <div className='bg-white rounded-lg shadow border border-gray-200 p-6'>
                <h2 className='text-xl font-semibold text-gray-900 mb-4'>Description</h2>
                <p className='text-sm text-gray-700 whitespace-pre-wrap'>{provider.providerInfo.description}</p>
              </div>
            )}
          </div>

          {/* Colonne latérale */}
          <div className='space-y-6'>
            {/* Statut et dates */}
            <div className='bg-white rounded-lg shadow border border-gray-200 p-6'>
              <h2 className='text-xl font-semibold text-gray-900 mb-4'>Statut</h2>
              <div className='space-y-4'>
                <div>
                  <p className='text-sm text-gray-500 mb-2'>Statut actuel</p>
                  {getStatusBadge(provider.status)}
                </div>
                {provider.createdAt && (
                  <div className='flex items-start'>
                    <Calendar className='h-5 w-5 text-gray-400 mr-3 mt-0.5' />
                    <div>
                      <p className='text-sm text-gray-500'>Date d'inscription</p>
                      <p className='text-sm font-medium text-gray-900'>
                        {new Date(provider.createdAt).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                )}
                {provider.updatedAt && (
                  <div>
                    <p className='text-sm text-gray-500'>Dernière mise à jour</p>
                    <p className='text-sm font-medium text-gray-900'>
                      {new Date(provider.updatedAt).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className='bg-white rounded-lg shadow border border-gray-200 p-6'>
              <h2 className='text-xl font-semibold text-gray-900 mb-4'>Actions</h2>
              <div className='space-y-2'>
                <Link
                  href={`/dashboard/bookings?providerId=${provider.id || provider._id}`}
                  className='block w-full text-center px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium'
                >
                  Voir les réservations
                </Link>
                {isCSM() && (
                  <button
                    className='block w-full text-center px-4 py-2 bg-[hsl(25,100%,53%)] text-white rounded-lg hover:bg-[hsl(25,100%,48%)] transition-colors text-sm font-medium'
                  >
                    Modifier
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

