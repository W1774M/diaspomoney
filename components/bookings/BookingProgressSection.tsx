'use client';

import { CheckCircle, Circle, AlertCircle, Clock } from 'lucide-react';
import type { BookingResponse } from '@/lib/mappers/booking.mapper';
import type { BookingProgress } from '@/hooks/bookings/useBookingProgress';

interface BookingProgressSectionProps {
  booking: BookingResponse;
  progress: BookingProgress;
}

const stepLabels: Record<number, { name: string; description: string }> = {
  1: { name: 'Étape 1 : Informations client', description: 'Informations du client et bénéficiaire enregistrées' },
  2: { name: 'Étape 2 : Sélection du service', description: 'Service sélectionné' },
  3: { name: 'Étape 3 : Paiement', description: 'Paiement effectué' },
  4: { name: 'Étape 4 : Confirmation', description: 'Commande confirmée' },
};

export default function BookingProgressSection({
  booking,
  progress,
}: BookingProgressSectionProps) {
  const metadata = booking.metadata || {};
  const isDraft = metadata['isDraft'] === true;
  const stepName = metadata['stepName'] as string | undefined;
  const lastUpdatedAt = metadata['lastUpdatedAt'] as string | undefined;
  const paymentStatus = metadata['paymentStatus'] as string | undefined;
  
  // Afficher la section si :
  // - C'est un draft
  // - OU si currentStep est défini
  // - OU si le paiement est complété (car cela signifie qu'il y a eu une progression)
  const isPaymentCompleted = paymentStatus === 'confirmed' || paymentStatus === 'completed' || paymentStatus === 'succeeded';
  const shouldShow = isDraft || progress.currentStep || isPaymentCompleted;

  if (!shouldShow) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 p-4 sm:p-6">
      <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2 flex-wrap">
        {progress.isCompleted ? (
          <CheckCircle className="w-5 h-5 text-green-600" />
        ) : (
          <Clock className="w-5 h-5 text-brand-700" />
        )}
        Progression de la commande
      </h2>

      {isDraft && !progress.isCompleted && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-yellow-800 break-words leading-relaxed">
                Commande en brouillon - L'utilisateur s'est arrêté à l'étape {progress.currentStep || '?'}
              </p>
              {stepName && (
                <p className="text-xs sm:text-sm text-yellow-700 mt-1">{stepName}</p>
              )}
              {lastUpdatedAt && (
                <p className="text-xs text-yellow-600 mt-1">
                  Dernière mise à jour : {new Date(lastUpdatedAt).toLocaleString('fr-FR')}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Barre de progression */}
      <div className="mb-4 sm:mb-6">
        <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
          <span className="text-xs sm:text-sm font-medium text-gray-700">
            Progression : {Object.values(progress.stepStatuses).filter((s) => s.isCompleted).length} / {progress.totalSteps} étapes
          </span>
          <span className="text-xs sm:text-sm text-gray-500">{progress.completionPercentage}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-brand-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress.completionPercentage}%` }}
          />
        </div>
      </div>

      {/* Étapes détaillées */}
      <div className="space-y-3">
        {[1, 2, 3, 4].map((step) => {
          const stepInfo = stepLabels[step];
          if (!stepInfo) return null;

          const stepStatus = progress.stepStatuses[step];
          if (!stepStatus) return null;

          const { isCompleted, isCurrent, isPaymentWaiting, stepHistory } = stepStatus;

          return (
            <div
              key={step}
              className={`flex flex-col sm:flex-row items-start gap-2 sm:gap-3 p-3 rounded-lg border ${
                isCurrent
                  ? 'bg-blue-50 border-blue-200'
                  : isPaymentWaiting
                  ? 'bg-yellow-50 border-yellow-300'
                  : isCompleted
                  ? 'bg-green-50 border-green-200'
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex items-start gap-2 sm:gap-3 w-full sm:w-auto">
                <div className="flex-shrink-0 mt-0.5">
                  {isCompleted ? (
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                  ) : isPaymentWaiting ? (
                    <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600" />
                  ) : isCurrent ? (
                    <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-brand-700" />
                  ) : (
                    <Circle className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-xs sm:text-sm font-medium break-words ${
                      isCurrent
                        ? 'text-brand-900'
                        : isPaymentWaiting
                        ? 'text-yellow-900'
                        : isCompleted
                        ? 'text-green-900'
                        : 'text-gray-500'
                    }`}
                  >
                    {stepInfo.name}
                    {isPaymentWaiting && (
                      <span className="ml-2 text-xs font-normal text-yellow-700">⏳ En attente de paiement</span>
                    )}
                  </p>
                  <p
                    className={`text-xs mt-1 ${
                      isCurrent
                        ? 'text-brand-800'
                        : isPaymentWaiting
                        ? 'text-yellow-700'
                        : isCompleted
                        ? 'text-green-700'
                        : 'text-gray-500'
                    }`}
                  >
                    {isPaymentWaiting
                      ? 'Lien de paiement envoyé au client. En attente de confirmation du paiement.'
                      : stepInfo.description}
                  </p>
                  {stepHistory?.timestamp && (
                    <p className="text-xs text-gray-500 mt-1">
                      Complétée le {new Date(stepHistory.timestamp).toLocaleString('fr-FR')}
                    </p>
                  )}
                  {isCurrent && stepHistory?.data && (
                    <div className="mt-2 p-2 bg-white rounded border border-blue-200">
                      <p className="text-xs font-medium text-brand-900 mb-1">Informations enregistrées :</p>
                      <ul className="text-xs text-brand-800 space-y-1">
                        {stepHistory.data.hasClientInfo && <li>✓ Informations client</li>}
                        {stepHistory.data.hasBeneficiaryInfo && <li>✓ Informations bénéficiaire</li>}
                        {stepHistory.data.hasSelectedService && <li>✓ Service sélectionné</li>}
                        {stepHistory.data.hasPaymentIntent && <li>✓ Paiement initié</li>}
                      </ul>
                    </div>
                  )}
                  {stepHistory?.validatedByAdmin && (
                    <p className="text-xs text-purple-600 mt-1 font-medium">✓ Validée par l'administrateur</p>
                  )}
                  {isPaymentWaiting && stepHistory?.data?.paymentUrl && (
                    <div className="mt-2 p-2 bg-yellow-100 rounded border border-yellow-300">
                      <p className="text-xs font-medium text-yellow-900 mb-1">Lien de paiement envoyé</p>
                      <p className="text-xs text-yellow-700">
                        {stepHistory.data.paymentLinkSentAt
                          ? `Envoyé le ${new Date(stepHistory.data.paymentLinkSentAt).toLocaleString('fr-FR')}`
                          : 'Lien de paiement généré'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Informations client enregistrées */}
      {metadata['clientName'] && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-xs font-medium text-gray-700 mb-1">Client :</p>
          <p className="text-sm text-gray-900">{metadata['clientName']}</p>
          {metadata['clientEmail'] && (
            <p className="text-xs text-gray-600 mt-1">{metadata['clientEmail']}</p>
          )}
        </div>
      )}

      {/* Informations bénéficiaire enregistrées */}
      {metadata['beneficiaryName'] && (
        <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-xs font-medium text-gray-700 mb-1">Bénéficiaire :</p>
          <p className="text-sm text-gray-900">{metadata['beneficiaryName']}</p>
        </div>
      )}

      {/* Service sélectionné */}
      {metadata['serviceLabel'] && (
        <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-xs font-medium text-gray-700 mb-1">Service :</p>
          <p className="text-sm text-gray-900">{metadata['serviceLabel']}</p>
          {metadata['servicePrice'] && (
            <p className="text-xs text-gray-600 mt-1">
              Prix :{' '}
              {typeof metadata['servicePrice'] === 'number'
                ? `${metadata['servicePrice'].toFixed(2)}€`
                : `${metadata['servicePrice']}€`}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

