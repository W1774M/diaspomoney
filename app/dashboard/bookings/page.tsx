'use client';

import { useAuth } from '@/hooks/auth/useAuth';
import { useBookings } from '@/hooks/useBookings';
import { BOOKING_STATUSES } from '@/lib/constants';
import { Search, ShoppingCart, CheckCircle, XCircle, AlertCircle, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';

export default function BookingsPage() {
  const { isAuthenticated, isAdmin, isCSM, isProvider, isCustomer, user, isLoading } = useAuth();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Déterminer les options de filtrage selon le rôle
  const bookingOptions = useMemo(() => {
    if (isAdmin() || isCSM()) {
      // ADMIN et CSM voient toutes les réservations
      return {
        status: statusFilter || undefined,
        limit: itemsPerPage,
        offset: (currentPage - 1) * itemsPerPage,
      };
    } else if (isProvider() && user?.id) {
      // PROVIDER voit ses propres réservations
      return {
        providerId: user.id,
        status: statusFilter || undefined,
        limit: itemsPerPage,
        offset: (currentPage - 1) * itemsPerPage,
      };
    } else if (isCustomer() && user?.id) {
      // CUSTOMER voit ses propres réservations
      return {
        userId: user.id,
        status: statusFilter || undefined,
        limit: itemsPerPage,
        offset: (currentPage - 1) * itemsPerPage,
      };
    }
    return {
      limit: itemsPerPage,
      offset: (currentPage - 1) * itemsPerPage,
    };
  }, [isAdmin, isCSM, isProvider, isCustomer, user?.id, statusFilter, currentPage]);

  // Récupération des réservations
  const { bookings, loading, error, total, refetch } = useBookings(bookingOptions);

  // Vérification des permissions
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || (!isAdmin() && !isCSM() && !isProvider() && !isCustomer()))) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isAdmin, isCSM, isProvider, isCustomer, isLoading, router]);

  // Filtrage local par terme de recherche
  const filteredBookings = useMemo(() => {
    if (!searchTerm) return bookings;
    
    const searchLower = searchTerm.toLowerCase();
    return bookings.filter((booking: any) => {
      const reservationNumber = booking.reservationNumber || '';
      const providerName = booking.provider 
        ? `${booking.provider.firstName || ''} ${booking.provider.lastName || ''}`.trim()
        : '';
      const requesterName = booking.requester
        ? `${booking.requester.firstName || ''} ${booking.requester.lastName || ''}`.trim()
        : '';
      const serviceName = booking.selectedService?.name || '';
      
      return (
        reservationNumber.toLowerCase().includes(searchLower) ||
        providerName.toLowerCase().includes(searchLower) ||
        requesterName.toLowerCase().includes(searchLower) ||
        serviceName.toLowerCase().includes(searchLower)
      );
    });
  }, [bookings, searchTerm]);

  // Calcul du nombre total de pages
  const totalPages = Math.ceil((total || 0) / itemsPerPage);

  // Gestion du changement de page
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Format de la date
  const formatDate = (date: Date | string) => {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Badge de statut
  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; icon: any; label: string }> = {
      [BOOKING_STATUSES.PENDING]: {
        color: 'bg-yellow-100 text-yellow-800',
        icon: Clock,
        label: 'En attente',
      },
      [BOOKING_STATUSES.CONFIRMED]: {
        color: 'bg-blue-100 text-blue-800',
        icon: CheckCircle,
        label: 'Confirmé',
      },
      [BOOKING_STATUSES.COMPLETED]: {
        color: 'bg-green-100 text-green-800',
        icon: CheckCircle,
        label: 'Terminé',
      },
      [BOOKING_STATUSES.CANCELLED]: {
        color: 'bg-red-100 text-red-800',
        icon: XCircle,
        label: 'Annulé',
      },
      [BOOKING_STATUSES.NO_SHOW]: {
        color: 'bg-orange-100 text-orange-800',
        icon: AlertCircle,
        label: 'Absent',
      },
    };

    const config = statusConfig[status] || {
      color: 'bg-gray-100 text-gray-800',
      icon: AlertCircle,
      label: status,
    };

    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className='h-3 w-3 mr-1' />
        {config.label}
      </span>
    );
  };

  // Format du prix
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(price || 0);
  };

  // Nom du provider
  const getProviderName = (booking: any) => {
    if (booking.provider) {
      const firstName = booking.provider.firstName || '';
      const lastName = booking.provider.lastName || '';
      if (firstName || lastName) {
        return `${firstName} ${lastName}`.trim();
      }
    }
    return booking.provider?.email || 'Prestataire inconnu';
  };

  // Nom du requester/client
  const getRequesterName = (booking: any) => {
    if (booking.requester) {
      const firstName = booking.requester.firstName || '';
      const lastName = booking.requester.lastName || '';
      if (firstName || lastName) {
        return `${firstName} ${lastName}`.trim();
      }
    }
    return booking.requester?.email || 'Client inconnu';
  };

  if (isLoading) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(25,100%,53%)]'></div>
      </div>
    );
  }

  if (!isAuthenticated || (!isAdmin() && !isCSM() && !isProvider() && !isCustomer())) {
    return null;
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        {/* Header */}
        <div className='mb-8'>
          <div className='flex items-center justify-between mb-4'>
            <div className='flex items-center'>
              <ShoppingCart className='h-8 w-8 text-[hsl(25,100%,53%)] mr-3' />
              <div>
                <h1 className='text-3xl font-bold text-gray-900'>Gestion des Réservations</h1>
                <p className='text-gray-600 mt-1'>
                  {total || 0} réservation{(total || 0) !== 1 ? 's' : ''} au total
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filtres et recherche */}
        <div className='bg-white rounded-lg shadow border border-gray-200 p-6 mb-6'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            {/* Recherche */}
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400' />
              <input
                type='text'
                placeholder='Rechercher par numéro, nom, service...'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent'
              />
            </div>

            {/* Filtre statut */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className='px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent'
            >
              <option value=''>Tous les statuts</option>
              <option value={BOOKING_STATUSES.PENDING}>En attente</option>
              <option value={BOOKING_STATUSES.CONFIRMED}>Confirmé</option>
              <option value={BOOKING_STATUSES.COMPLETED}>Terminé</option>
              <option value={BOOKING_STATUSES.CANCELLED}>Annulé</option>
              <option value={BOOKING_STATUSES.NO_SHOW}>Absent</option>
            </select>
          </div>
        </div>

        {/* Liste des réservations */}
        {loading ? (
          <div className='bg-white rounded-lg shadow border border-gray-200 p-12 text-center'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(25,100%,53%)] mx-auto'></div>
            <p className='mt-4 text-gray-600'>Chargement des réservations...</p>
          </div>
        ) : error ? (
          <div className='bg-white rounded-lg shadow border border-gray-200 p-12 text-center'>
            <p className='text-red-600'>{error}</p>
            <button
              onClick={() => refetch()}
              className='mt-4 px-4 py-2 bg-[hsl(25,100%,53%)] text-white rounded-lg hover:bg-[hsl(25,100%,48%)] transition-colors'
            >
              Réessayer
            </button>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className='bg-white rounded-lg shadow border border-gray-200 p-12 text-center'>
            <ShoppingCart className='h-16 w-16 text-gray-400 mx-auto mb-4' />
            <h3 className='text-lg font-medium text-gray-900 mb-2'>
              Aucune réservation trouvée
            </h3>
            <p className='text-gray-500'>
              {searchTerm || statusFilter
                ? 'Aucun résultat ne correspond à vos critères de recherche.'
                : 'Aucune réservation n\'a été enregistrée pour le moment.'}
            </p>
          </div>
        ) : (
          <>
            <div className='bg-white rounded-lg shadow border border-gray-200 overflow-hidden'>
              <div className='overflow-x-auto'>
                <table className='min-w-full divide-y divide-gray-200'>
                  <thead className='bg-gray-50'>
                    <tr>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        N° Réservation
                      </th>
                      {(isAdmin() || isCSM()) && (
                        <>
                          <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                            Client
                          </th>
                          <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                            Prestataire
                          </th>
                        </>
                      )}
                      {isProvider() && (
                        <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                          Client
                        </th>
                      )}
                      {isCustomer() && (
                        <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                          Prestataire
                        </th>
                      )}
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        Service
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        Date
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        Montant
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        Statut
                      </th>
                      <th className='px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className='bg-white divide-y divide-gray-200'>
                    {filteredBookings.map((booking: any) => (
                      <tr key={booking._id || booking.id} className='hover:bg-gray-50'>
                        <td className='px-6 py-4 whitespace-nowrap'>
                          <div className='text-sm font-medium text-gray-900'>
                            {booking.reservationNumber || booking._id?.slice(-8) || 'N/A'}
                          </div>
                        </td>
                        {(isAdmin() || isCSM()) && (
                          <>
                            <td className='px-6 py-4 whitespace-nowrap'>
                              <div className='text-sm text-gray-900'>{getRequesterName(booking)}</div>
                              <div className='text-sm text-gray-500'>{booking.requester?.email}</div>
                            </td>
                            <td className='px-6 py-4 whitespace-nowrap'>
                              <div className='text-sm text-gray-900'>{getProviderName(booking)}</div>
                              <div className='text-sm text-gray-500'>{booking.provider?.email}</div>
                            </td>
                          </>
                        )}
                        {isProvider() && (
                          <td className='px-6 py-4 whitespace-nowrap'>
                            <div className='text-sm text-gray-900'>{getRequesterName(booking)}</div>
                            <div className='text-sm text-gray-500'>{booking.requester?.email}</div>
                          </td>
                        )}
                        {isCustomer() && (
                          <td className='px-6 py-4 whitespace-nowrap'>
                            <div className='text-sm text-gray-900'>{getProviderName(booking)}</div>
                            <div className='text-sm text-gray-500'>{booking.provider?.email}</div>
                          </td>
                        )}
                        <td className='px-6 py-4 whitespace-nowrap'>
                          <div className='text-sm text-gray-900'>
                            {booking.selectedService?.name || 'Service non spécifié'}
                          </div>
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                          {formatDate(booking.date || booking.appointmentDate || booking.createdAt)}
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900'>
                          {formatPrice(booking.price || booking.totalAmount || 0)}
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap'>
                          {getStatusBadge(booking.status)}
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap text-right text-sm font-medium'>
                          <button
                            onClick={() => router.push(`/dashboard/bookings/${booking._id || booking.id}`)}
                            className='text-[hsl(25,100%,53%)] hover:text-[hsl(25,100%,48%)]'
                          >
                            Voir
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className='mt-6 flex items-center justify-between'>
                <div className='text-sm text-gray-700'>
                  Page {currentPage} sur {totalPages} ({total || 0} résultat{(total || 0) !== 1 ? 's' : ''})
                </div>
                <div className='flex space-x-2'>
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className='px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50'
                  >
                    Précédent
                  </button>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className='px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50'
                  >
                    Suivant
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

