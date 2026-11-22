"use client";

import type { BookingsTableProps } from "@/lib/types";
import { Calendar, Loader2, ArrowUp, ArrowDown } from "lucide-react";
import React from "react";
import BookingCard from "./BookingCard";
import { AuthorizedContent } from "@/components/auth";
import { ROLES } from "@/lib/constants";

const BookingsTable = React.memo<BookingsTableProps>(function BookingsTable({
  bookings,
  loading,
  error,
  onView,
  onEdit,
  onCancel,
  sortBy,
  sortOrder,
  onSort,
}) {
  
  // Fonction helper pour rendre un en-tête de colonne triable
  const renderSortableHeader = (field: string, label: string) => {
    if (!onSort) {
      return (
        <th scope='col' className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
          {label}
        </th>
      );
    }

    const isActive = sortBy === field;
    const isAsc = isActive && sortOrder === 'asc';

    return (
      <th
        scope='col'
        aria-sort={isActive ? (isAsc ? 'ascending' : 'descending') : 'none'}
        className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider"
      >
        {/* le tri est une action : bouton natif, état annoncé par aria-sort */}
        <button
          type="button"
          onClick={() => onSort(field)}
          className="inline-flex min-h-8 items-center gap-1 rounded px-3 py-1 uppercase tracking-wider hover:bg-gray-100"
        >
          <span>{label}</span>
          {isActive ? (
            isAsc ? (
              <ArrowUp className="h-4 w-4" />
            ) : (
              <ArrowDown className="h-4 w-4" />
            )
          ) : (
            <ArrowUp className="h-4 w-4 opacity-30" />
          )}
        </button>
      </th>
    );
  };
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-brand-700" />
        <span className="ml-2 text-gray-600">
          Chargement des réservations...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <svg
              className="w-12 h-12 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Erreur</h3>
          <p className="text-gray-500 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-brand-600 text-white px-4 py-2 rounded-md hover:bg-brand-700 transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="text-center py-12">
        <Calendar className="h-12 w-12 text-gray-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Aucune réservation trouvée
        </h3>
        <p className="text-gray-600">
          Vous n&apos;avez pas encore de réservations
        </p>
      </div>
    );
  }

  return (
    <div tabIndex={0} role='region' aria-labelledby='table-bookingstable-1' className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
<caption id='table-bookingstable-1' className='visually-hidden'>Liste des réservations</caption>
        <thead className="bg-gray-50">
          <tr>
            {renderSortableHeader('reservationNumber', 'Réservation')}
            {renderSortableHeader('appointmentDate', 'Date')}
            {renderSortableHeader('amount', 'Montant')}
            <th scope='col' className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
              Statut
            </th>
            <th scope='col' className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
              Paiement
            </th>
            <AuthorizedContent roles={[ROLES.ADMIN, ROLES.CSM]}>
              {renderSortableHeader('completionRate', 'Taux de remplissage')}
            </AuthorizedContent>
            <th scope='col' className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {bookings.map(booking => (
              <BookingCard
                key={booking._id}
                booking={booking}
                onView={onView}
                onEdit={onEdit}
                onCancel={onCancel}
                showProgress={true}
              />
            ))}
          </tbody>
        </table>
      </div>
    );
});

BookingsTable.displayName = "BookingsTable";

export default BookingsTable;
