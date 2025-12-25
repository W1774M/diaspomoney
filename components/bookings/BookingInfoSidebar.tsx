'use client';

import { getPaymentStatusDisplay } from '@/lib/bookings/utils';
import type { BookingResponse } from '@/lib/mappers/booking.mapper';

interface BookingInfoSidebarProps {
  booking: BookingResponse;
  formattedReservationNumber: string;
}

export default function BookingInfoSidebar({
  booking,
  formattedReservationNumber,
}: BookingInfoSidebarProps) {
  const assignedProviderType = booking.metadata?.['assignedProviderType'] as string | undefined;
  const assignedProviderName = booking.metadata?.['assignedProviderName'] as string | undefined;
  const assignedProviderEmail = booking.metadata?.['assignedProviderEmail'] as string | undefined;
  const assignedProviderAssignedAt = booking.metadata?.['assignedProviderAssignedAt'] as string | undefined;

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 p-4 sm:p-6">
      <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Informations</h2>
      <div className="space-y-3">
        <div>
          <p className="text-sm text-gray-500">ID de réservation</p>
          <p className="font-mono text-xs sm:text-sm text-gray-900 break-all">{booking.id}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Numéro de réservation</p>
          <p className="font-semibold text-sm sm:text-base text-gray-900 break-words">
            {formattedReservationNumber}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Statut de paiement</p>
          <p className="font-semibold text-sm sm:text-base text-gray-900 break-words">
            {getPaymentStatusDisplay(booking.metadata?.['paymentStatus'] as string || 'pending')}
          </p>
        </div>

        <div>
          <p className="text-sm text-gray-500">Prestataire attribué</p>
          {assignedProviderType === 'EXTERNAL' ? (
            <div className="text-sm text-gray-900">
              <p className="font-semibold break-words">{assignedProviderName || 'Prestataire externe'}</p>
              <p className="break-words">{assignedProviderEmail || '—'}</p>
            </div>
          ) : booking.providerId ? (
            <div className="text-sm text-gray-900">
              <p className="font-semibold break-words">{assignedProviderName || 'Prestataire enregistré'}</p>
              <p className="font-mono text-xs break-all">{booking.providerId}</p>
            </div>
          ) : (
            <p className="text-sm text-gray-500 italic">Non attribué</p>
          )}
          {assignedProviderAssignedAt && (
            <p className="text-xs text-gray-500 mt-1">
              Attribué le {new Date(assignedProviderAssignedAt).toLocaleString('fr-FR')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

