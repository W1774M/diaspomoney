'use client';

import { useBooking } from '@/hooks/bookings';
import { SPECIALITY_TYPES, BOOKING_STATUSES, ROLES } from '@/lib/constants';
import type { SpecialityType } from '@/lib/types/constants.types';
import { useNotificationManager } from '@/components/ui/Notification';
import { AuthorizedContent, AuthorizedRoute } from '@/components/auth';
import { ArrowLeft, Calendar, User, CreditCard, FileText, Save } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

/**
 * Contenu de la page de détail d'une réservation
 * Implémente les design patterns :
 * - Custom Hooks Pattern (via useBooking)
 * - Service Layer Pattern (via les hooks qui appellent les API)
 * - Error Handling Pattern (gestion d'erreurs via les hooks et notifications)
 */
function BookingDetailPageContent() {
  const params = useParams();
  const bookingId = (params?.id as string) || '';
  const notificationManager = useNotificationManager();

  // Utiliser le Custom Hook Pattern
  const { booking, loading, error, updateStatus, isUpdating } = useBooking(bookingId);
  const [selectedStatus, setSelectedStatus] = useState<string>('');

  // Initialiser selectedStatus quand le booking est chargé
  useEffect(() => {
    if (booking) {
      setSelectedStatus(booking.status);
    }
  }, [booking]);

  // Fonction pour mettre à jour le statut
  const handleStatusUpdate = async () => {
    if (!booking || !selectedStatus || selectedStatus === booking.status) return;

    const success = await updateStatus(selectedStatus);
    if (success) {
      notificationManager.addSuccess('Statut de la réservation mis à jour avec succès');
    } else {
      notificationManager.addError('Erreur lors de la mise à jour du statut');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; label: string }> = {
      [BOOKING_STATUSES.PENDING]: { color: 'bg-yellow-100 text-yellow-800', label: 'En attente' },
      [BOOKING_STATUSES.CONFIRMED]: { color: 'bg-green-100 text-green-800', label: 'Confirmée' },
      [BOOKING_STATUSES.IN_PROGRESS]: { color: 'bg-blue-100 text-blue-800', label: 'En cours' },
      [BOOKING_STATUSES.COMPLETED]: { color: 'bg-blue-100 text-blue-800', label: 'Terminée' },
      [BOOKING_STATUSES.CANCELLED]: { color: 'bg-red-100 text-red-800', label: 'Annulée' },
      [BOOKING_STATUSES.NO_SHOW]: { color: 'bg-gray-100 text-gray-800', label: 'Absent' },
    };

    const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800', label: status };
    return (
      <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      [BOOKING_STATUSES.PENDING]: 'En attente',
      [BOOKING_STATUSES.CONFIRMED]: 'Confirmée',
      [BOOKING_STATUSES.IN_PROGRESS]: 'En cours',
      [BOOKING_STATUSES.COMPLETED]: 'Terminée',
      [BOOKING_STATUSES.CANCELLED]: 'Annulée',
      [BOOKING_STATUSES.NO_SHOW]: 'Absent',
    };
    return labels[status] || status;
  };

  const getServiceTypeLabel = (type: SpecialityType) => {
    const types: Record<SpecialityType, string> = {
      [SPECIALITY_TYPES.HEALTH]: 'Santé',
      [SPECIALITY_TYPES.BTP]: 'Immobilier',
      [SPECIALITY_TYPES.EDUCATION]: 'Éducation',
      [SPECIALITY_TYPES.LEGAL]: 'Juridique',
      [SPECIALITY_TYPES.FINANCE]: 'Finance',
      [SPECIALITY_TYPES.TECHNOLOGY]: 'Technologie',
    };
    return types[type] || type;
  };

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
            href="/dashboard/bookings"
            className="inline-flex items-center text-[hsl(25,100%,53%)] hover:text-[hsl(25,90%,48%)]"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux réservations
          </Link>
        </div>
      </div>
    );
  }

  // appointmentDate est maintenant une string ISO depuis le mapper
  const appointmentDate = booking.appointmentDate
    ? new Date(booking.appointmentDate)
    : null;
  
  // createdAt et updatedAt sont maintenant des strings ISO
  const createdAt = booking.createdAt ? new Date(booking.createdAt) : new Date();

  // Formater le numéro de réservation au format RES-ANNEE-MOIS-reservationNumber
  const formatReservationNumber = (reservationNumber: string | undefined, createdAt: Date): string => {
    const year = createdAt.getFullYear();
    const month = String(createdAt.getMonth() + 1).padStart(2, '0');
    
    if (!reservationNumber) {
      // Si pas de numéro, utiliser l'ID comme numéro de séquence
      return `RES-${year}-${month}-${booking.id.slice(-4)}`;
    }
    
    // Si le numéro existe déjà au format RES-YYYY-NNNN, le convertir en RES-YYYY-MM-NNNN
    if (reservationNumber.startsWith('RES-')) {
      const parts = reservationNumber.split('-');
      if (parts.length >= 3) {
        const yearFromNumber = parts[1]; // YYYY
        const sequence = parts[2] || booking.id.slice(-4); // NNNN
        return `RES-${yearFromNumber}-${month}-${sequence}`;
      }
    }
    
    // Sinon, utiliser le numéro tel quel avec l'année et le mois de création
    return `RES-${year}-${month}-${reservationNumber}`;
  };

  const formattedReservationNumber = formatReservationNumber(booking.reservationNumber, createdAt);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* En-tête */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <Link
              href="/dashboard/bookings"
              className="flex items-center text-[hsl(25,100%,53%)] hover:text-[hsl(25,90%,48%)]"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour aux réservations
            </Link>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Réservation {formattedReservationNumber}
              </h1>
              <p className="text-gray-600 mt-2">
                Créée le {createdAt.toLocaleDateString('fr-FR', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
            {getStatusBadge(booking.status)}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Informations principales */}
          <div className="lg:col-span-2 space-y-6">
            {/* Informations du service */}
            <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Informations du service</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Type de service</p>
                  <p className="font-medium text-gray-900">{getServiceTypeLabel(booking.serviceType)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Service</p>
                  <p className="font-medium text-gray-900">
                    {booking.metadata?.['serviceLabel'] || booking.serviceId || 'Service non spécifié'}
                  </p>
                  {booking.metadata?.['serviceDescription'] && (
                    <p className="text-sm text-gray-600 mt-1">{booking.metadata['serviceDescription']}</p>
                  )}
                </div>
                {booking.metadata?.['serviceCategory'] && (
                  <div>
                    <p className="text-sm text-gray-500">Catégorie</p>
                    <p className="font-medium text-gray-900">{booking.metadata['serviceCategory']}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Informations du bénéficiaire */}
            {booking.recipient && (
              <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-[hsl(25,100%,53%)]" />
                  Bénéficiaire
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Nom complet</p>
                    <p className="font-medium text-gray-900">
                      {booking.recipient.firstName} {booking.recipient.lastName}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Téléphone</p>
                    <p className="font-medium text-gray-900">{booking.recipient.phone}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Rendez-vous */}
            {(appointmentDate || booking.timeslot) && (
              <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-[hsl(25,100%,53%)]" />
                  Rendez-vous
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {appointmentDate && (
                    <div>
                      <p className="text-sm text-gray-500">Date</p>
                      <p className="font-medium text-gray-900">
                        {appointmentDate.toLocaleDateString('fr-FR', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                  )}
                  {booking.timeslot && (
                    <div>
                      <p className="text-sm text-gray-500">Heure</p>
                      <p className="font-medium text-gray-900">{booking.timeslot}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Informations de paiement */}
            {booking.metadata?.['paymentIntentId'] && (
              <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-[hsl(25,100%,53%)]" />
                  Paiement
                </h2>
                <div className="space-y-3">
                  {booking.metadata?.['totalAmount'] && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Montant total</span>
                      <span className="text-lg font-semibold text-gray-900">
                        {typeof booking.metadata['totalAmount'] === 'string'
                          ? `${booking.metadata['totalAmount']}€`
                          : `${booking.metadata['totalAmount'].toFixed(2)}€`}
                      </span>
                    </div>
                  )}
                  {booking.metadata?.['basePrice'] && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500">Prix de base</span>
                      <span className="text-gray-700">
                        {typeof booking.metadata['basePrice'] === 'string'
                          ? `${booking.metadata['basePrice']}€`
                          : `${booking.metadata['basePrice'].toFixed(2)}€`}
                      </span>
                    </div>
                  )}
                  {booking.metadata?.['optionsPrice'] && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500">Options</span>
                      <span className="text-gray-700">
                        {typeof booking.metadata['optionsPrice'] === 'string'
                          ? `${booking.metadata['optionsPrice']}€`
                          : `${booking.metadata['optionsPrice'].toFixed(2)}€`}
                      </span>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-500">ID de transaction</p>
                    <p className="font-mono text-sm text-gray-700">{booking.metadata['paymentIntentId']}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Options supplémentaires */}
            {booking.metadata?.['additionalOptions'] && (
              <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Options supplémentaires</h2>
                <div className="space-y-2">
                  {(() => {
                    try {
                      const options = typeof booking.metadata['additionalOptions'] === 'string'
                        ? JSON.parse(booking.metadata['additionalOptions'])
                        : booking.metadata['additionalOptions'];
                      return Array.isArray(options) ? options.map((opt: any, index: number) => (
                        <div key={index} className="flex justify-between items-center py-2 border-b last:border-0">
                          <span className="text-sm text-gray-600">{opt.label || opt.id}</span>
                          <span className="text-sm font-semibold text-gray-900">+{opt.price}€</span>
                        </div>
                      )) : null;
                    } catch {
                      return <p className="text-sm text-gray-500">Aucune option</p>;
                    }
                  })()}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Informations de contact */}
            <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Informations</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">ID de réservation</p>
                  <p className="font-mono text-sm text-gray-900">{booking.id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Numéro de réservation</p>
                  <p className="font-semibold text-gray-900">{formattedReservationNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Statut</p>
                  <AuthorizedContent roles={[ROLES.ADMIN]}>
                    <div className="mt-2 space-y-2">
                      <select
                        title="Changer le statut de la réservation"
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        disabled={isUpdating}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {Object.values(BOOKING_STATUSES).map((status) => (
                          <option key={status} value={status}>
                            {getStatusLabel(status)}
                          </option>
                        ))}
                      </select>
                      {selectedStatus !== booking.status && (
                        <button
                          onClick={handleStatusUpdate}
                          disabled={isUpdating}
                          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[hsl(25,100%,53%)] text-white rounded-lg hover:bg-[hsl(25,100%,48%)] transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Save className="w-4 h-4" />
                          {isUpdating ? 'Mise à jour...' : 'Enregistrer le statut'}
                        </button>
                      )}
                    </div>
                  </AuthorizedContent>
                  <AuthorizedContent roles={[ROLES.ADMIN]} invert>
                    <div className="mt-2">
                      {getStatusBadge(booking.status)}
                    </div>
                  </AuthorizedContent>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions</h2>
              <div className="space-y-2">
                <button
                  onClick={() => window.print()}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                >
                  <FileText className="w-4 h-4" />
                  Imprimer
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
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
    <AuthorizedRoute redirectTo="/auth/login">
      <BookingDetailPageContent />
    </AuthorizedRoute>
  );
}

