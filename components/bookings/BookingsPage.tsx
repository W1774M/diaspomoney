'use client';

import { useBookings } from '@/hooks';
import { useBookingCancel, useBookingFilters } from '@/hooks/bookings';
import { Booking } from '@/types/bookings';
import { useRouter } from 'next/navigation';
import React, { useCallback } from 'react';
import BookingsHeader from './BookingsHeader';
import BookingsSearch from './BookingsSearch';
import BookingsTable from './BookingsTable';

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
  const { bookings, loading, error } = useBookings({
    limit: 1000,
  });

  const {
    filters,
    filteredBookings,
    availableStatuses,
    availablePaymentStatuses,
    updateFilter,
    clearFilters,
    hasActiveFilters,
  } = useBookingFilters(bookings as Booking[]);

  const { cancelBooking, loading: cancelLoading } = useBookingCancel();

  const handleViewBooking = useCallback(
    (booking: Booking) => {
      router.push(`/dashboard/bookings/${booking._id}`);
    },
    [router]
  );

  const handleEditBooking = useCallback(
    (booking: Booking) => {
      router.push(`/dashboard/bookings/${booking._id}/edit`);
    },
    [router]
  );

  const handleCancelBooking = useCallback(
    async (booking: Booking) => {
      if (!confirm('Êtes-vous sûr de vouloir annuler cette réservation ?')) {
        return;
      }

      await cancelBooking(booking._id || booking['id']);
    },
    [cancelBooking]
  );

  const handleSearchChange = useCallback(
    (value: string) => {
      updateFilter('searchTerm', value);
    },
    [updateFilter]
  );

  const handleStatusChange = useCallback(
    (value: string) => {
      updateFilter('status', value);
    },
    [updateFilter]
  );

  const handlePaymentStatusChange = useCallback(
    (value: string) => {
      updateFilter('paymentStatus', value);
    },
    [updateFilter]
  );

  // const handleDateRangeChange = useCallback(
  //   (field: "start" | "end") => (value: string) => {
  //     const newDateRange = {
  //       ...filters.dateRange,
  //       [field]: value,
  //     };
  //     updateFilter("dateRange", newDateRange);
  //   },
  //   [filters.dateRange, updateFilter],
  // );

  return (
    <div className='min-h-screen bg-gray-50 py-8'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Header */}
        <BookingsHeader onNewBooking={() => {}} />

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
              value={filters.status}
              title='Filtrer par statut'
              onChange={e => handleStatusChange(e.target.value)}
              className='px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent'
            >
              <option value='ALL'>Tous les statuts</option>
              {availableStatuses.map((status, idx) => (
                <option key={idx} value={status}>
                  {status === 'confirmed'
                    ? 'Confirmé'
                    : status === 'pending'
                    ? 'En attente'
                    : status === 'cancelled'
                    ? 'Annulé'
                    : 'Terminé'}
                </option>
              ))}
            </select>

            {/* Payment Status Filter */}
            <select
              value={filters.paymentStatus}
              title='Filtrer par statut de paiement'
              onChange={e => handlePaymentStatusChange(e.target.value)}
              className='px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent'
            >
              <option value='ALL'>Tous les paiements</option>
              {availablePaymentStatuses.map((status, idx) => (
                <option key={idx} value={status}>
                  {status === 'paid'
                    ? 'Payé'
                    : status === 'pending'
                    ? 'En attente'
                    : status === 'failed'
                    ? 'Échoué'
                    : 'Remboursé'}
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
        </div>

        {/* Results Count */}
        <div className='mb-4'>
          <h2 className='text-lg font-semibold text-gray-900'>
            {filteredBookings.length} rendez-vous trouvé
            {filteredBookings.length !== 1 ? 's' : ''}
          </h2>
          {hasActiveFilters && (
            <p className='text-sm text-gray-600'>Filtres appliqués</p>
          )}
        </div>

        {/* Table */}
        <BookingsTable
          bookings={filteredBookings}
          loading={loading || cancelLoading}
          error={error}
          onView={handleViewBooking}
          onEdit={handleEditBooking}
          onCancel={handleCancelBooking}
        />
      </div>
    </div>
  );
});

BookingsPage.displayName = 'BookingsPage';

export default BookingsPage;
