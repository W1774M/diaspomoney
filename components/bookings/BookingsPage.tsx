'use client';

import { useBookings } from '@/hooks';
import { useBookingCancel, useBookingFilters } from '@/hooks/bookings';
import type { BookingResponse } from '@/lib/mappers/booking.mapper';
import { getStatusDisplay, getPaymentStatusDisplay } from '@/lib/bookings/utils';
import { BOOKING_STATUSES, TRANSACTION_STATUSES, ROLES } from '@/lib/constants';
import { useAuth } from '@/hooks/auth/useAuth';

// Use BookingResponse as the main type
type Booking = BookingResponse;
import { useRouter } from 'next/navigation';
import React, { useCallback, useMemo, useState } from 'react';
import BookingsHeader from './BookingsHeader';
import BookingsSearch from './BookingsSearch';
import BookingsTable from './BookingsTable';
import Pagination from './Pagination';
import { useBookingsPagination } from '@/contexts/BookingsPaginationContext';

/**
 * Page de gestion des réservations
 * Implémente les design patterns :
 * - Custom Hooks Pattern (useBookings, useBookingFilters, useBookingCancel)
 * - Service Layer Pattern (via API routes qui utilisent bookingService)
 * - Repository Pattern (via bookingService qui utilise les repositories)
 * - Dependency Injection (via bookingService singleton)
 * - Logger Pattern (structured logging via services avec @Log decorator)
 * - Middleware Pattern (authentification via API routes)
 * - Decorator Pattern (@Log, @Cacheable, @InvalidateCache dans bookingService)
 * - Singleton Pattern (bookingService)
 */
const BookingsPage = React.memo(function BookingsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { currentPage, itemsPerPage, setCurrentPage, setItemsPerPage } = useBookingsPagination();
  
  // Déterminer si l'utilisateur peut switcher entre customer et provider
  const userRoles = user?.roles || [];
  const isProvider = userRoles.includes(ROLES.PROVIDER);
  const isCustomer = userRoles.includes(ROLES.CUSTOMER);
  const isAdmin = userRoles.includes(ROLES.ADMIN) || userRoles.includes(ROLES.SUPERADMIN);
  // Les admins ne doivent pas voir les boutons de switch car ils voient toutes les commandes
  const canSwitchView = isProvider && isCustomer && !isAdmin;
  
  // État pour le mode de vue (customer ou provider)
  const [viewMode, setViewMode] = useState<'customer' | 'provider'>('customer');
  
  // États pour le tri (par défaut: trier par numéro de réservation décroissant pour voir les plus récentes en premier)
  const [sortBy, setSortBy] = useState<string>('reservationNumber');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // États pour les filtres (initialisés avant useBookings)
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('ALL');
  
  // Calculer l'offset basé sur la page actuelle
  const offset = useMemo(() => (currentPage - 1) * itemsPerPage, [currentPage, itemsPerPage]);
  
  // Mémoriser les options pour éviter les re-renders inutiles
  const bookingsOptions = useMemo(() => ({
    limit: itemsPerPage,
    offset,
    sortBy,
    sortOrder,
    // Passer le filtre de statut à l'API si différent de "ALL"
    ...(statusFilter !== 'ALL' && { status: statusFilter }),
    // Passer le filtre de statut de paiement à l'API si différent de "ALL"
    ...(paymentStatusFilter !== 'ALL' && { paymentStatus: paymentStatusFilter }),
    // Passer le mode de vue si l'utilisateur peut switcher
    ...(canSwitchView && { viewMode }),
  }), [itemsPerPage, offset, sortBy, sortOrder, statusFilter, paymentStatusFilter, canSwitchView, viewMode]);
  
  const { bookings, loading, error, total } = useBookings(bookingsOptions);
  
  // Calculer le nombre total de pages
  const totalPages = useMemo(() => Math.ceil(total / itemsPerPage), [total, itemsPerPage]);

  const {
    filters,
    updateFilter,
    clearFilters,
    hasActiveFilters,
  } = useBookingFilters(bookings);

  const { cancelBooking, loading: cancelLoading } = useBookingCancel();

  const handleViewBooking = useCallback(
    (booking: Booking) => {
      router.push(`/dashboard/bookings/${booking._id}`);
    },
    [router],
  );

  const handleEditBooking = useCallback(
    (booking: Booking) => {
      router.push(`/dashboard/bookings/${booking._id}/edit`);
    },
    [router],
  );

  const handleCancelBooking = useCallback(
    async (booking: BookingResponse) => {
      if (!confirm('Êtes-vous sûr de vouloir annuler cette réservation ?')) {
        return;
      }

      await cancelBooking(booking._id || booking['id']);
    },
    [cancelBooking],
  );

  const handleSearchChange = useCallback(
    (value: string) => {
      updateFilter('searchTerm', value);
      // Réinitialiser à la page 1 lors du changement de recherche
      setCurrentPage(1);
    },
    [updateFilter],
  );

  const handleStatusChange = useCallback(
    (value: string) => {
      updateFilter('status', value);
      setStatusFilter(value);
      // Réinitialiser à la page 1 lors du changement de filtre
      setCurrentPage(1);
    },
    [updateFilter],
  );

  const handlePaymentStatusChange = useCallback(
    (value: string) => {
      updateFilter('paymentStatus', value);
      // Réinitialiser à la page 1 lors du changement de filtre
      setCurrentPage(1);
    },
    [updateFilter],
  );

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    // Scroll vers le haut de la page
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleSort = useCallback((field: string) => {
    if (sortBy === field) {
      // Inverser l'ordre si on clique sur la même colonne
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Nouvelle colonne, trier par défaut en décroissant
      setSortBy(field);
      setSortOrder('desc');
    }
    // Réinitialiser à la page 1 lors du changement de tri
    setCurrentPage(1);
  }, [sortBy, sortOrder]);


  return (
    <div className='bg-gray-50'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4'>
        {/* Header */}
        <BookingsHeader onNewBooking={() => {}} />

        {/* View Mode Switch (si l'utilisateur est à la fois customer et provider) */}
        {canSwitchView && (
          <div className='bg-white rounded-lg shadow-sm p-4 mb-6'>
            <div className='flex items-center gap-4'>
              <span className='text-sm font-medium text-gray-700'>Vue :</span>
              <div className='flex gap-2'>
                <button
                  onClick={() => {
                    setViewMode('customer');
                    setCurrentPage(1); // Réinitialiser à la page 1 lors du changement de vue
                  }}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'customer'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  En tant que client
                </button>
                <button
                  onClick={() => {
                    setViewMode('provider');
                    setCurrentPage(1); // Réinitialiser à la page 1 lors du changement de vue
                  }}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'provider'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  En tant que prestataire
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className='bg-white rounded-lg shadow-sm p-6 mb-6'>
          <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
            {/* Search */}
            <BookingsSearch
              searchTerm={filters.searchTerm}
              setSearchTerm={handleSearchChange}
            />

            {/* Status Filter */}
            <select
              value={statusFilter}
              title='Filtrer par statut'
              onChange={e => handleStatusChange(e.target.value)}
              className='px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent'
            >
              <option value='ALL'>Tous les statuts</option>
              {Object.values(BOOKING_STATUSES).map((status) => (
                <option key={status} value={status}>
                  {getStatusDisplay(status)}
                </option>
              ))}
            </select>

            {/* Payment Status Filter */}
            <select
              value={paymentStatusFilter}
              title='Filtrer par statut de paiement'
              onChange={e => {
                setPaymentStatusFilter(e.target.value);
                handlePaymentStatusChange(e.target.value);
                setCurrentPage(1);
              }}
              className='px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent'
            >
              <option value='ALL'>Tous les paiements</option>
              {Object.values(TRANSACTION_STATUSES).map((status) => (
                <option key={status} value={status}>
                  {getPaymentStatusDisplay(status)}
                </option>
              ))}
            </select>

            {/* Reset Filters */}
            <button
              onClick={clearFilters}
              className='px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors'
            >
              Réinitialiser
            </button>
          </div>
          
          {/* Items per page selector */}
          <div className='mt-4 flex items-center gap-2'>
            <label htmlFor='itemsPerPage' className='text-sm text-gray-700'>
              Éléments par page :
            </label>
            <select
              id='itemsPerPage'
              value={itemsPerPage}
              onChange={e => {
                const newItemsPerPage = parseInt(e.target.value);
                setItemsPerPage(newItemsPerPage);
              }}
              className='px-3 py-1.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm'
            >
              {[5, 10, 15, 20, 25, 30, 50, 100].map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Results Count */}
        <div className='mb-4'>
          <h2 className='text-lg font-semibold text-gray-900'>
            {total} rendez-vous trouvé
            {total !== 1 ? 's' : ''}
            {canSwitchView && (
              <span className='ml-2 text-sm font-normal text-gray-500'>
                ({viewMode === 'customer' ? 'en tant que client' : 'en tant que prestataire'})
              </span>
            )}
          </h2>
          {hasActiveFilters && (
            <p className='text-sm text-gray-600'>Filtres appliqués</p>
          )}
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm">
          <BookingsTable
            bookings={bookings}
            loading={loading || cancelLoading}
            error={error}
            onView={handleViewBooking}
            onEdit={handleEditBooking}
            onCancel={handleCancelBooking}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={handleSort}
          />
          
          {/* Pagination */}
          {!loading && !error && total > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={total}
              itemsPerPage={itemsPerPage}
              onPageChange={handlePageChange}
            />
          )}
        </div>
      </div>
    </div>
  );
});

BookingsPage.displayName = 'BookingsPage';

export default BookingsPage;
