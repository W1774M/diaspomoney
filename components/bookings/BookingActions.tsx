'use client';

import { FileText, UserCheck, Trash2, Edit } from 'lucide-react';
import { AuthorizedContent } from '@/components/auth';
import { BOOKING_STATUSES, ROLES } from '@/lib/constants';
import type { BookingResponse } from '@/lib/mappers/booking.mapper';

interface BookingActionsProps {
  booking: BookingResponse;
  isProgressComplete: boolean;
  isUpdating: boolean;
  deleteLoading: boolean;
  generatingInvoice: boolean;
  onGenerateInvoice: () => void;
  onTakeCharge: () => void;
  onDelete: () => void;
  onEdit?: () => void;
}

export default function BookingActions({
  booking,
  isProgressComplete,
  isUpdating,
  deleteLoading,
  generatingInvoice,
  onGenerateInvoice,
  onTakeCharge,
  onDelete,
  onEdit,
}: BookingActionsProps) {
  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 p-4 sm:p-6">
      <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Actions</h2>
      <AuthorizedContent roles={[ROLES.ADMIN]}>
        <div className="space-y-2">
          {/* Bouton Éditer */}
          {onEdit && (
            <button
              onClick={onEdit}
              className="w-full flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-[hsl(25,100%,53%)] text-white rounded-lg hover:bg-[hsl(25,90%,48%)] transition-colors text-xs sm:text-sm font-medium"
              title="Éditer la réservation"
            >
              <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Éditer la réservation</span>
              <span className="sm:hidden">Éditer</span>
            </button>
          )}

          {/* Bouton Générer une facture */}
          <button
            onClick={onGenerateInvoice}
            disabled={generatingInvoice}
            className="w-full flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs sm:text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            title="Générer une facture PDF professionnelle"
          >
            <FileText className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">
              {generatingInvoice ? 'Génération...' : 'Générer une facture'}
            </span>
            <span className="sm:hidden">{generatingInvoice ? 'Génération...' : 'Facture'}</span>
          </button>

          {/* Bouton Prendre en charge */}
          {booking.status !== BOOKING_STATUSES.CONFIRMED &&
            booking.status !== BOOKING_STATUSES.FINISHED &&
            booking.status !== BOOKING_STATUSES.CANCELLED && (
              <>
                <button
                  onClick={onTakeCharge}
                  disabled={isUpdating || !isProgressComplete}
                  className="w-full flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xs sm:text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  title={
                    !isProgressComplete
                      ? 'La progression doit être à 100% pour prendre en charge la commande'
                      : 'Prendre en charge la commande'
                  }
                >
                  <UserCheck className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">
                    {isUpdating ? 'Prise en charge...' : 'Prendre en charge'}
                  </span>
                  <span className="sm:hidden">{isUpdating ? 'En cours...' : 'Prendre en charge'}</span>
                </button>
                {!isProgressComplete && (
                  <p className="text-xs text-gray-500 mt-1 text-center">
                    La progression doit être à 100% pour prendre en charge la commande
                  </p>
                )}
              </>
            )}

          {/* Bouton Supprimer */}
          <button
            onClick={onDelete}
            disabled={deleteLoading}
            className="w-full flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-xs sm:text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">
              {deleteLoading ? 'Suppression...' : 'Supprimer définitivement'}
            </span>
            <span className="sm:hidden">{deleteLoading ? 'Suppression...' : 'Supprimer'}</span>
          </button>
          <p className="text-xs text-gray-500 mt-2">
            Cette action supprimera la réservation, la transaction, le paiement Stripe et la facture associée.
          </p>
        </div>
      </AuthorizedContent>
    </div>
  );
}

