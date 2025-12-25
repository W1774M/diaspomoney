'use client';

import { useBooking } from '@/hooks/bookings';
import { useBookingDelete } from '@/hooks/bookings/useBookingDelete';
import { useBookingProgress } from '@/hooks/bookings/useBookingProgress';
import { useBookingActions } from '@/hooks/bookings/useBookingActions';
import { useBookingStepValidation } from '@/hooks/bookings/useBookingStepValidation';
import { resendPaymentLink } from '@/hooks/bookings/useBookingResendPaymentLink';
import { useBookingGeneratePaymentLink } from '@/hooks/bookings/useBookingGeneratePaymentLink';
import { BOOKING_STATUSES, ROLES } from '@/lib/constants';
import { AuthorizedContent, AuthorizedRoute } from '@/components/auth';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useBookingsPagination, BookingsPaginationProvider } from '@/contexts/BookingsPaginationContext';
import BookingNavigation from '@/components/bookings/BookingNavigation';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { logger } from '@/lib/logger';
import { formatReservationNumber, calculateIsProgressComplete, getServiceTypeLabel } from '@/lib/utils/booking.utils';
import BookingServiceInfo from '@/components/bookings/BookingServiceInfo';
import BookingProgressSection from '@/components/bookings/BookingProgressSection';
import BookingClientInfo from '@/components/bookings/BookingClientInfo';
import BookingBeneficiaryInfo from '@/components/bookings/BookingBeneficiaryInfo';
import BookingAppointmentInfo from '@/components/bookings/BookingAppointmentInfo';
import BookingPaymentInfo from '@/components/bookings/BookingPaymentInfo';
import BookingAdditionalOptions from '@/components/bookings/BookingAdditionalOptions';
import BookingInfoSidebar from '@/components/bookings/BookingInfoSidebar';
import BookingActions from '@/components/bookings/BookingActions';
import BookingEditModal from '@/components/bookings/BookingEditModal';
import { useBookingEdit } from '@/hooks/bookings/useBookingEdit';
import AssignProviderModal from '@/components/bookings/AssignProviderModal';

/**
 * Contenu de la page de détail d'une réservation
 * Implémente les design patterns :
 * - Custom Hooks Pattern (via useBooking, useBookingDelete, useBookingProgress, useBookingActions, useBookingStepValidation)
 * - Service Layer Pattern (via les hooks qui appellent les API routes)
 * - Repository Pattern (indirectement via les API routes)
 * - Logger Pattern (structured logging avec logger de @/lib/logger)
 * - Error Handling Pattern (gestion d'erreurs via try/catch, notifications, et Sentry côté serveur)
 * - Notification Pattern (via useNotificationManager pour les notifications utilisateur)
 * - Modal Pattern (via ConfirmDialog pour les confirmations)
 * - Memoization Pattern (via useMemo pour isProgressComplete)
 * - Context Pattern (via BookingsPaginationProvider pour la pagination)
 * - Authorization Pattern (via AuthorizedContent et AuthorizedRoute)
 * - Component Composition Pattern (via les composants extraits)
 */
function BookingDetailPageContent() {
  const params = useParams();
  const bookingId = (params?.id as string) || '';
  const { getBookingsUrl } = useBookingsPagination();
  const bookingsPageUrl = getBookingsUrl();

  // Hooks pour la gestion des données
  const { booking, loading, error, updateStatus, refetch } = useBooking(bookingId);
  const { deleteBooking, loading: deleteLoading } = useBookingDelete();

  // Calculer si la progression est complète
  const isProgressComplete = useMemo(() => calculateIsProgressComplete(booking), [booking]);

  // Hook pour la progression
  const progress = useBookingProgress(booking);

  // Hook pour les actions (prendre en charge, supprimer, générer facture)
  const {
    isUpdating,
    deleteLoading: deleteLoadingFromActions,
    generatingInvoice,
    showTakeChargeDialog,
    showDeleteDialog,
    setShowTakeChargeDialog,
    setShowDeleteDialog,
    handleTakeChargeClick,
    handleTakeCharge,
    handleDeleteBookingClick,
    handleDeleteBooking,
    handleGenerateInvoice,
  } = useBookingActions({
    booking,
    bookingId,
    updateStatus,
    refetch,
    deleteBooking,
    isProgressComplete,
    bookingsPageUrl,
  });

  // Hook pour générer un lien de paiement
  const {
    generatingPaymentLink,
    generatePaymentLink,
  } = useBookingGeneratePaymentLink({
    bookingId,
    refetch,
  });

  // Hook pour la validation des étapes
  const {
    validatingStep,
    resendingPaymentLink,
    showValidateStepDialog,
    stepToValidate,
    setShowValidateStepDialog,
    setStepToValidate,
    handleValidateStepClick,
    handleValidateStep,
    handleResendPaymentLink,
  } = useBookingStepValidation({
    booking,
    bookingId,
    refetch,
    onResendPaymentLink: async () => {
      await resendPaymentLink(bookingId);
    },
  });

  // Hook pour l'édition
  const {
    isEditing,
    isSaving,
    isValidatingPromoCode,
    promoCodeData,
    promoCodeError,
    editData,
    setEditData,
    isPaymentCompleted,
    openEditModal,
    closeEditModal,
    saveBooking,
    validatePromotionCode,
  } = useBookingEdit({
    booking,
    bookingId,
    refetch,
  });

  const [isAssignProviderOpen, setIsAssignProviderOpen] = useState(false);

  // Marquer la commande comme vue quand elle est chargée
  useEffect(() => {
    if (booking && bookingId) {
      fetch(`/api/bookings/${encodeURIComponent(bookingId)}/mark-viewed`, {
        method: 'POST',
      })
        .then(async (response) => {
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            if (response.status !== 404) {
              logger.warn(
                { bookingId, status: response.status, error: errorData.error },
                'Error marking booking as viewed',
              );
            } else {
              logger.debug({ bookingId }, 'Booking not found when marking as viewed (may have been deleted)');
            }
          }
        })
        .catch((error) => {
          logger.error({ error, bookingId }, 'Network error marking booking as viewed');
        });
    }
  }, [booking, bookingId]);

  // Fonction pour obtenir le badge de statut
  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; label: string }> = {
      [BOOKING_STATUSES.DRAFT]: { color: 'bg-gray-100 text-gray-800', label: 'Brouillon' },
      [BOOKING_STATUSES.PENDING]: { color: 'bg-yellow-100 text-yellow-800', label: 'En attente' },
      [BOOKING_STATUSES.CONFIRMED]: { color: 'bg-green-100 text-green-800', label: 'Confirmée' },
      [BOOKING_STATUSES.FINISHED]: { color: 'bg-blue-100 text-blue-800', label: 'Terminée' },
      [BOOKING_STATUSES.CANCELLED]: { color: 'bg-red-100 text-red-800', label: 'Annulée' },
    };

    const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800', label: status };
    return (
      <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${config.color}`}>
        {config.label}
      </span>
    );
  };

  // États de chargement et d'erreur
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(25,100%,53%)] mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement de la réservation...</p>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Réservation non trouvée'}</p>
          <Link
            href={bookingsPageUrl}
            className="inline-flex items-center text-[hsl(25,100%,53%)] hover:text-[hsl(25,90%,48%)]"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux réservations
          </Link>
        </div>
      </div>
    );
  }

  // Préparer les données pour l'affichage
  const appointmentDate = booking.appointmentDate ? new Date(booking.appointmentDate) : null;
  const createdAt = booking.createdAt ? new Date(booking.createdAt) : new Date();
  const formattedReservationNumber = formatReservationNumber(booking.reservationNumber, createdAt, booking.id);

  // Message pour la validation de l'étape
  const getValidateStepMessage = (step: number) => {
    if (step === 3) {
      return `Êtes-vous sûr de vouloir valider l'Étape 3 : Paiement ?\n\nCette action va :\n• Générer un lien de paiement sécurisé (si pas déjà généré)\n• Envoyer ce lien par email au client avec le récapitulatif de la commande\n• Marquer l'étape comme complétée\n\nVous pouvez également générer un lien de paiement séparément sans valider l'étape.`;
    }
    const stepNames: Record<number, string> = {
      1: "l'Étape 1 : Informations client",
      2: "l'Étape 2 : Sélection du service",
      4: "l'Étape 4 : Confirmation",
    };
    return `Êtes-vous sûr de vouloir valider ${stepNames[step] || `l'étape ${step}`} ?\n\nCette action marquera l'étape comme complétée et passera à l'étape suivante.`;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-6 lg:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* En-tête */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between mb-4">
            <Link
              href={bookingsPageUrl}
              className="flex items-center text-[hsl(25,100%,53%)] hover:text-[hsl(25,90%,48%)] text-sm sm:text-base"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Retour aux réservations</span>
              <span className="sm:hidden">Retour</span>
            </Link>
          </div>

          {/* Navigation entre les réservations */}
          <div className="mb-4 sm:mb-6">
            <BookingNavigation currentBookingId={bookingId} />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 break-words">
                Réservation {formattedReservationNumber}
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 mt-1 sm:mt-2 break-words">
                Créée le {createdAt.toLocaleDateString('fr-FR', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
            <div className="flex-shrink-0">{getStatusBadge(booking.status)}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Colonne principale */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            <BookingServiceInfo booking={booking} getServiceTypeLabel={getServiceTypeLabel} />

            <AuthorizedContent roles={[ROLES.ADMIN, ROLES.CSM]}>
              <BookingProgressSection
                booking={booking}
                progress={progress}
                onValidateStep={handleValidateStepClick}
                onResendPaymentLink={handleResendPaymentLink}
                onGeneratePaymentLink={generatePaymentLink}
                validatingStep={validatingStep}
                resendingPaymentLink={resendingPaymentLink}
                generatingPaymentLink={generatingPaymentLink}
              />
            </AuthorizedContent>

            <BookingClientInfo booking={booking} />
            <BookingBeneficiaryInfo booking={booking} />
            <BookingAppointmentInfo booking={booking} appointmentDate={appointmentDate} />
            <BookingPaymentInfo booking={booking} />
            <BookingAdditionalOptions booking={booking} />
          </div>

          {/* Sidebar */}
          <div className="space-y-4 sm:space-y-6">
            <BookingInfoSidebar booking={booking} formattedReservationNumber={formattedReservationNumber} />
            <BookingActions
              booking={booking}
              isProgressComplete={isProgressComplete}
              isUpdating={isUpdating}
              deleteLoading={deleteLoading || deleteLoadingFromActions}
              generatingInvoice={generatingInvoice}
              onGenerateInvoice={handleGenerateInvoice}
              onTakeCharge={handleTakeChargeClick}
              onDelete={handleDeleteBookingClick}
              onEdit={openEditModal}
              onAssignProvider={() => setIsAssignProviderOpen(true)}
            />
          </div>
        </div>
      </div>

      {/* Modals de confirmation */}
      <ConfirmDialog
        isOpen={showTakeChargeDialog}
        onClose={() => {
          if (!isUpdating) {
            setShowTakeChargeDialog(false);
          }
        }}
        onConfirm={handleTakeCharge}
        title="Prendre en charge la commande"
        message="Êtes-vous sûr de vouloir prendre en charge cette commande ?\n\nCette action passera le statut de la réservation à « Confirmée »."
        confirmText="Prendre en charge"
        cancelText="Annuler"
        variant="success"
        isLoading={isUpdating}
      />

      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDeleteBooking}
        title="Supprimer la réservation"
        message="Êtes-vous sûr de vouloir supprimer définitivement cette réservation ?\n\nCette action supprimera :\n• La réservation\n• La transaction associée\n• Le paiement Stripe (remboursement ou annulation)\n• La facture associée\n\nCette action est irréversible."
        confirmText="Supprimer"
        cancelText="Annuler"
        variant="danger"
        isLoading={deleteLoading || deleteLoadingFromActions}
      />

      {stepToValidate !== null && (
        <ConfirmDialog
          isOpen={showValidateStepDialog}
          onClose={() => {
            setShowValidateStepDialog(false);
            setStepToValidate(null);
          }}
          onConfirm={handleValidateStep}
          title="Valider l'étape"
          message={getValidateStepMessage(stepToValidate)}
          confirmText="Valider"
          cancelText="Annuler"
          variant="default"
          isLoading={validatingStep !== null}
        />
      )}

      {/* Modal d'édition */}
      <BookingEditModal
        isOpen={isEditing}
        onClose={closeEditModal}
        onSave={saveBooking}
        editData={editData}
        setEditData={setEditData}
        isSaving={isSaving}
        isValidatingPromoCode={isValidatingPromoCode}
        promoCodeData={promoCodeData}
        promoCodeError={promoCodeError}
        onValidatePromoCode={validatePromotionCode}
        isPaymentCompleted={isPaymentCompleted}
      />

      {/* Modal d'attribution prestataire */}
      <AssignProviderModal
        isOpen={isAssignProviderOpen}
        onClose={() => setIsAssignProviderOpen(false)}
        bookingId={bookingId}
        currentProviderId={booking.providerId}
        {...(booking.metadata?.['assignedProviderType'] === 'EXTERNAL' &&
        booking.metadata?.['assignedProviderEmail']
          ? { currentAssignedProviderEmail: booking.metadata['assignedProviderEmail'] as string }
          : {})}
        onAssigned={async () => {
          await refetch();
        }}
      />
    </div>
  );
}

/**
 * Page de détail d'une réservation
 * Implémente les design patterns :
 * - Authorization Pattern (via AuthorizedRoute aligné avec @Authorize decorator backend)
 */
export default function BookingDetailPage() {
  return (
    <AuthorizedRoute redirectTo="/login">
      <BookingsPaginationProvider>
        <BookingDetailPageContent />
      </BookingsPaginationProvider>
    </AuthorizedRoute>
  );
}
