'use client';

import { useEffect, useState } from 'react';
import { getPaymentStatusDisplay } from '@/lib/bookings/utils';
import { BOOKING_STATUSES } from '@/lib/constants';
import { useUser } from '@/hooks/users/useUser';
import { useBookingSharedElements } from '@/hooks/bookings/useBookingSharedElements';
import type { BookingResponse } from '@/lib/mappers/booking.mapper';

interface BookingInfoSidebarProps {
  booking: BookingResponse;
  formattedReservationNumber: string;
}

export default function BookingInfoSidebar({
  booking,
  formattedReservationNumber,
}: BookingInfoSidebarProps) {
  const { isElementAllowed } = useBookingSharedElements(booking);
  
  const assignedProviderType = booking.metadata?.['assignedProviderType'] as string | undefined;
  const assignedProviderName = booking.metadata?.['assignedProviderName'] as string | undefined;
  const assignedProviderEmail = booking.metadata?.['assignedProviderEmail'] as string | undefined;
  const assignedProviderAssignedAt = booking.metadata?.['assignedProviderAssignedAt'] as string | undefined;
  const takenChargeBy = booking.metadata?.['takenChargeBy'] as string | undefined;
  const takenChargeAt = booking.metadata?.['takenChargeAt'] as string | undefined;
  
  // Récupérer les infos de l'utilisateur qui a pris en charge
  const { user: takenChargeUser, fetchUser } = useUser();
  const [loadingTakenChargeUser, setLoadingTakenChargeUser] = useState(false);
  
  useEffect(() => {
    if (takenChargeBy && !takenChargeUser && !loadingTakenChargeUser) {
      setLoadingTakenChargeUser(true);
      fetchUser(takenChargeBy).finally(() => setLoadingTakenChargeUser(false));
    }
  }, [takenChargeBy, takenChargeUser, fetchUser, loadingTakenChargeUser]);
  
  // Déterminer le statut de paiement : si la commande est CONFIRMED ou FINISHED, le paiement est considéré comme confirmé
  // Mais seulement si l'utilisateur a le droit de voir les infos de paiement
  const paymentStatus = (() => {
    if (!isElementAllowed('paymentInfo')) {
      return null; // Ne pas afficher si non autorisé
    }
    const rawStatus = booking.metadata?.['paymentStatus'] as string | undefined;
    // Si la commande est confirmée ou terminée, le paiement est considéré comme confirmé
    if (booking.status === BOOKING_STATUSES.CONFIRMED || booking.status === BOOKING_STATUSES.FINISHED) {
      return 'confirmed';
    }
    return rawStatus || 'pending';
  })();

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
        {paymentStatus !== null && (
          <div>
            <p className="text-sm text-gray-500">Statut de paiement</p>
            <p className="font-semibold text-sm sm:text-base text-gray-900 break-words">
              {getPaymentStatusDisplay(paymentStatus)}
            </p>
          </div>
        )}

        {/* Afficher qui a pris en charge la commande */}
        {takenChargeBy && (
          <div>
            <p className="text-sm text-gray-500">Prise en charge par</p>
            <p className="font-semibold text-sm sm:text-base text-gray-900 break-words">
              {loadingTakenChargeUser ? (
                <span className="text-gray-400">Chargement...</span>
              ) : takenChargeUser ? (
                `${takenChargeUser.firstName || ''} ${takenChargeUser.lastName || ''}`.trim() || takenChargeUser.email || takenChargeBy
              ) : (
                takenChargeBy
              )}
            </p>
            {takenChargeAt && (
              <p className="text-xs text-gray-500 mt-1">
                Le {new Date(takenChargeAt).toLocaleString('fr-FR')}
              </p>
            )}
          </div>
        )}

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

