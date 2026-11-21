'use client';

import { FileText, UserCheck, Trash2, Edit, UserPlus, CheckCircle, MessageSquare, CreditCard, Check, Download } from 'lucide-react';
import { AuthorizedContent } from '@/components/auth';
import { BOOKING_STATUSES, ROLES } from '@/lib/constants';
import type { BookingResponse } from '@/lib/mappers/booking.mapper';
import { useAuth } from '@/hooks';

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
  onAssignProvider?: () => void;
  onMarkAsFinished?: () => void;
  onRequestFeedback?: () => void;
  requestingFeedback?: boolean;
  // Nouvelles props pour validation d'étapes
  progress?: {
    nextStepToValidate: number | null;
    stepStatuses: Record<number, {
      isCompleted: boolean;
      isCurrent: boolean;
      isPaymentWaiting: boolean;
    }>;
  };
  onValidateStep?: (step: number) => void;
  validatingStep?: number | null;
  onGeneratePaymentLink?: () => void;
  generatingPaymentLink?: boolean;
  onDownloadSummary?: () => void;
  downloadingSummary?: boolean;
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
  onAssignProvider,
  onMarkAsFinished,
  onRequestFeedback,
  requestingFeedback = false,
  progress,
  onValidateStep,
  validatingStep,
  onGeneratePaymentLink,
  generatingPaymentLink = false,
  onDownloadSummary,
  downloadingSummary = false,
}: BookingActionsProps) {
  const { user } = useAuth();
  const metadata = booking.metadata || {};
  const paymentStatus = metadata['paymentStatus'] as string | undefined;
  const isPaymentCompleted = paymentStatus === 'confirmed' || paymentStatus === 'completed' || paymentStatus === 'succeeded';
  const isTakenCharge = booking.status === BOOKING_STATUSES.CONFIRMED || booking.status === BOOKING_STATUSES.FINISHED;
  const takenChargeBy = metadata['takenChargeBy'] as string | undefined;
  
  // Vérifier si l'utilisateur est un provider et s'il est assigné à cette réservation
  const userRoles = user?.roles || [];
  const isProvider = userRoles.includes(ROLES.PROVIDER);
  const isAssignedProvider = isProvider && booking.providerId === user?.id;
  
  // Vérifier si l'étape 4 est validée (progression complète)
  const isStep4Validated = isProgressComplete;
  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 p-4 sm:p-6">
      <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Actions</h2>
      
      {/* Actions pour les admins uniquement */}
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

          {/* Boutons de validation d'étapes (1 à 4) */}
          {onValidateStep && progress && progress.nextStepToValidate !== null && progress.nextStepToValidate <= 4 && (
            <>
              {/* Pour l'étape 3 : générer lien de paiement si paiement non effectué */}
              {progress.nextStepToValidate === 3 && !isPaymentCompleted && onGeneratePaymentLink && (
                <button
                  onClick={onGeneratePaymentLink}
                  disabled={generatingPaymentLink}
                  className="w-full flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xs sm:text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Générer un lien de paiement et l'envoyer au client"
                >
                  <CreditCard className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">
                    {generatingPaymentLink ? 'Génération...' : 'Générer un lien de paiement'}
                  </span>
                  <span className="sm:hidden">{generatingPaymentLink ? 'Génération...' : 'Lien paiement'}</span>
                </button>
              )}
              {/* Bouton valider l'étape */}
              <button
                onClick={() => onValidateStep(progress.nextStepToValidate!)}
                disabled={validatingStep === progress.nextStepToValidate}
                className="w-full flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-xs sm:text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                title={`Valider l'étape ${progress.nextStepToValidate}`}
              >
                <Check className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">
                  {validatingStep === progress.nextStepToValidate ? 'Validation...' : `Valider étape ${progress.nextStepToValidate}`}
                </span>
                <span className="sm:hidden">{validatingStep === progress.nextStepToValidate ? 'Validation...' : `Étape ${progress.nextStepToValidate}`}</span>
              </button>
            </>
          )}

          {/* Bouton Attribuer un prestataire - seulement si prise en charge et pas terminée */}
          {onAssignProvider && 
           isTakenCharge && 
           booking.status !== BOOKING_STATUSES.FINISHED && 
           booking.status !== BOOKING_STATUSES.CANCELLED && (
            <button
              onClick={onAssignProvider}
              className="w-full flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-xs sm:text-sm font-medium"
              title="Attribuer la réservation à un prestataire (enregistré ou externe)"
            >
              <UserPlus className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Attribuer un prestataire</span>
              <span className="sm:hidden">Attribuer</span>
            </button>
          )}

          {/* Bouton Télécharger résumé */}
          {onDownloadSummary && (
            <button
              onClick={onDownloadSummary}
              disabled={downloadingSummary}
              className="w-full flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-xs sm:text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              title="Télécharger le résumé de la commande (PDF)"
            >
              <Download className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">
                {downloadingSummary ? 'Génération...' : 'Télécharger résumé'}
              </span>
              <span className="sm:hidden">{downloadingSummary ? 'Génération...' : 'Résumé'}</span>
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

          {/* Bouton Prendre en charge - seulement après validation étape 4 */}
          {booking.status !== BOOKING_STATUSES.CONFIRMED &&
            booking.status !== BOOKING_STATUSES.FINISHED &&
            booking.status !== BOOKING_STATUSES.CANCELLED &&
            isStep4Validated && (
              <>
                <button
                  onClick={onTakeCharge}
                  disabled={isUpdating}
                  className="w-full flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xs sm:text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Prendre en charge la commande"
                >
                  <UserCheck className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">
                    {isUpdating ? 'Prise en charge...' : 'Prendre en charge'}
                  </span>
                  <span className="sm:hidden">{isUpdating ? 'En cours...' : 'Prendre en charge'}</span>
                </button>
                {takenChargeBy && (
                  <p className="text-xs text-gray-500 mt-1 text-center">
                    Prise en charge par : {takenChargeBy}
                  </p>
                )}
              </>
            )}

          {/* Bouton Marquer comme terminé - seulement si prise en charge */}
          {booking.status !== BOOKING_STATUSES.FINISHED &&
            booking.status !== BOOKING_STATUSES.CANCELLED &&
            isTakenCharge &&
            onMarkAsFinished && (
              <button
                onClick={onMarkAsFinished}
                disabled={isUpdating}
                className="w-full flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-xs sm:text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                title="Marquer la commande comme terminée"
              >
                <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">
                  {isUpdating ? 'Mise à jour...' : 'Marquer comme terminé'}
                </span>
                <span className="sm:hidden">{isUpdating ? 'En cours...' : 'Terminé'}</span>
              </button>
            )}

          {/* Bouton Demander Feedbacks */}
          {booking.status === BOOKING_STATUSES.FINISHED &&
            onRequestFeedback && (
              <button
                onClick={onRequestFeedback}
                disabled={requestingFeedback}
                className="w-full flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-xs sm:text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                title="Demander un feedback sur la prestation"
              >
                <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">
                  {requestingFeedback ? 'Envoi...' : 'Demander Feedbacks'}
                </span>
                <span className="sm:hidden">{requestingFeedback ? 'Envoi...' : 'Feedbacks'}</span>
              </button>
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

      {/* Actions pour les providers assignés */}
      {isAssignedProvider && (
        <div className="space-y-2 mt-4">
          {/* Bouton Télécharger résumé */}
          {onDownloadSummary && (
            <button
              onClick={onDownloadSummary}
              disabled={downloadingSummary}
              className="w-full flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-xs sm:text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              title="Télécharger le résumé de la commande (PDF)"
            >
              <Download className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">
                {downloadingSummary ? 'Génération...' : 'Télécharger résumé'}
              </span>
              <span className="sm:hidden">{downloadingSummary ? 'Génération...' : 'Résumé'}</span>
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

          {/* Bouton Marquer comme terminé - seulement si prise en charge */}
          {booking.status !== BOOKING_STATUSES.FINISHED &&
            booking.status !== BOOKING_STATUSES.CANCELLED &&
            isTakenCharge &&
            onMarkAsFinished && (
              <button
                onClick={onMarkAsFinished}
                disabled={isUpdating}
                className="w-full flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-xs sm:text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                title="Marquer la commande comme terminée"
              >
                <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">
                  {isUpdating ? 'Mise à jour...' : 'Marquer comme terminé'}
                </span>
                <span className="sm:hidden">{isUpdating ? 'En cours...' : 'Terminé'}</span>
              </button>
            )}

          {/* Bouton Demander Feedbacks */}
          {booking.status === BOOKING_STATUSES.FINISHED &&
            onRequestFeedback && (
              <button
                onClick={onRequestFeedback}
                disabled={requestingFeedback}
                className="w-full flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-xs sm:text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                title="Demander un feedback sur la prestation"
              >
                <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">
                  {requestingFeedback ? 'Envoi...' : 'Demander Feedbacks'}
                </span>
                <span className="sm:hidden">{requestingFeedback ? 'Envoi...' : 'Feedbacks'}</span>
              </button>
            )}
        </div>
      )}
    </div>
  );
}

