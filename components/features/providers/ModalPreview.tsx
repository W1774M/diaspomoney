'use client';
import { ModalPreviewProps } from '@/types';
import { CheckCircle, Clock, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAppointment } from './AppointmentContext';

export interface ModalPreviewPropsExtended
  extends Omit<ModalPreviewProps, 'setModalOpen'> {
  onFinalValidation?: () => void;
  paymentData?: any;
  setSteps?: (step: string) => void;
}

export const ModalPreview = ({
  appointment,
  onFinalValidation,
  paymentData,
  setSteps,
}: ModalPreviewPropsExtended) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  // Formatage de la date optimisé avec useMemo
  const formattedDate = useMemo(() => {
    if (!appointment.timeslot) return '';
    return new Date(appointment.timeslot).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, [appointment.timeslot]);

  // Calcul du total optimisé
  const totalPrice = useMemo(() => {
    return appointment.selectedService?.price || 0;
  }, [appointment.selectedService]);

  // Validation globale avant paiement
  const isValid = useMemo(() => {
    return (
      appointment.selectedService &&
      appointment.provider &&
      appointment.provider.id &&
      appointment.timeslot &&
      appointment.requester?.firstName &&
      appointment.requester?.lastName &&
      appointment.requester?.email &&
      appointment.requester?.phone &&
      appointment.recipient?.firstName &&
      appointment.recipient?.lastName &&
      appointment.recipient?.phone &&
      paymentData.cardNumber &&
      paymentData.expiryDate &&
      paymentData.cvv &&
      paymentData.cardholderName
    );
  }, [appointment, paymentData]);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { setData } = useAppointment();
  const router = useRouter();

  useEffect(() => {
    // Animation d'entrée
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  // Gestionnaires optimisés avec useCallback
  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => onFinalValidation?.(), 300);
  }, [onFinalValidation]);

  const handleBack = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      if (setSteps) setSteps('1');
    }, 300);
  }, [setSteps]);

  const handleConfirmPayment = useCallback(async () => {
    if (!isValid) {
      setErrorMsg(
        'Veuillez remplir tous les champs obligatoires avant de confirmer le paiement.',
      );
      return;
    }
    setErrorMsg(null);
    try {
      // Simulation d'un problème de paiement (à remplacer par votre logique réelle)
      const paymentSuccess = Math.random() > 0.3; // 70% de succès pour tester

      if (!paymentSuccess) {
        // En cas d'erreur de paiement, envoyer l'email d'erreur
        const errorResponse = await fetch('/api/send-payment-error', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            appointment,
            paymentData,
            errorMessage:
              'Erreur lors du traitement du paiement - Problème technique temporaire',
          }),
        });

        if (errorResponse.ok) {
          // const errorResult = await errorResponse.json();
          alert(
            '❌ Erreur de paiement détectée. Un email a été envoyé à contact@diaspomoney.fr et à votre adresse email avec un lien pour réessayer le paiement. Le lien est valide 15 minutes.',
          );
        } else {
          alert('❌ Erreur de paiement. Veuillez réessayer plus tard.');
        }

        setIsClosing(true);
        setTimeout(() => onFinalValidation?.(), 300);
        return;
      }

      // Envoi de l'email de confirmation (paiement réussi)
      const response = await fetch('/api/send-confirmation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          appointment,
          paymentData,
        }),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de l'envoi de l'email");
      }

      const result = await response.json();

      console.log('Paiement confirmé', { appointment, paymentData });
      alert(
        `✅ Paiement effectué avec succès ! Un email de confirmation a été envoyé à contact@diaspomoney.fr et à votre adresse email. Numéro de réservation : ${result.reservationNumber}`,
      );
      setIsClosing(true);
      setTimeout(() => onFinalValidation?.(), 300);
      setData({ ...appointment, id: appointment._id as string });
      router.push('/login');
    } catch (err) {
      console.error('Erreur lors de la confirmation:', err);

      // En cas d'erreur, envoyer l'email d'erreur
      try {
        await fetch('/api/send-payment-error', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            appointment,
            paymentData,
            errorMessage: 'Erreur lors de la confirmation du paiement',
          }),
        });

        alert(
          "❌ Erreur lors de la confirmation du paiement. Un email d'erreur a été envoyé à contact@diaspomoney.fr et à votre adresse email avec un lien pour réessayer.",
        );
      } catch {
        alert(
          '❌ Erreur lors de la confirmation du paiement. Veuillez réessayer plus tard.',
        );
      }
    }
  }, [appointment, paymentData, onFinalValidation, router, setData, isValid]);

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center z-50 p-4 pt-16 transition-all duration-300 ease-in-out ${
        isVisible && !isClosing
          ? 'bg-black/50 backdrop-blur-sm'
          : 'bg-black/0 backdrop-blur-none'
      }`}
    >
      <div
        className={`bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col transform transition-all duration-300 ease-out ${
          isVisible && !isClosing
            ? 'translate-y-0 opacity-100 scale-100'
            : 'translate-y-4 opacity-0 scale-95'
        }`}
      >
        {/* Header */}
        <div className='flex items-center justify-between p-4 border-b border-gray-200'>
          <h2 className='text-xl font-bold text-gray-800 flex items-center gap-2'>
            <CheckCircle className='w-6 h-6 text-green-600' />
            Confirmation de réservation
          </h2>
          <button
            className='text-gray-400 hover:text-gray-700 text-2xl font-bold focus:outline-none transition-colors duration-200'
            onClick={handleClose}
            aria-label='Fermer'
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className='flex-1 overflow-y-auto p-6 space-y-6'>
          {/* Bannière de confirmation */}
          <div className='bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg border border-green-200'>
            <div className='flex items-center gap-3'>
              <CheckCircle className='w-8 h-8 text-green-600' />
              <div>
                <h3 className='text-lg font-bold text-green-800'>
                  Réservation en cours de finalisation
                </h3>
                <p className='text-green-700 text-sm'>
                  Vérifiez les détails ci-dessous avant de confirmer votre
                  paiement
                </p>
              </div>
            </div>
          </div>

          {/* Détails de la réservation */}
          <div className='space-y-4'>
            <h3 className='text-lg font-semibold text-gray-800 flex items-center gap-2'>
              <div className='w-2 h-2 bg-blue-500 rounded-full'></div>
              Détails de votre réservation
            </h3>

            <div className='bg-blue-50 p-4 rounded-lg border border-blue-200'>
              <div className='space-y-3'>
                <div className='flex justify-between items-center'>
                  <span className='text-gray-700'>Service :</span>
                  <span className='font-semibold text-blue-800'>
                    {appointment.selectedService?.name}
                  </span>
                </div>
                <div className='flex justify-between items-center'>
                  <span className='text-gray-700'>Prestataire :</span>
                  <span className='font-semibold text-blue-800'>
                    {appointment.provider?.name}
                  </span>
                </div>
                <div className='flex justify-between items-center'>
                  <span className='text-gray-700'>Prix :</span>
                  <span className='font-bold text-blue-800 text-lg'>
                    {totalPrice} €
                  </span>
                </div>
              </div>
            </div>

            <div className='bg-orange-50 p-4 rounded-lg border border-orange-200'>
              <div className='flex items-center gap-2 mb-2'>
                <Clock className='w-4 h-4 text-orange-600' />
                <span className='font-semibold text-orange-800'>
                  Créneau réservé
                </span>
              </div>
              <p className='text-orange-700'>{formattedDate}</p>
            </div>
          </div>

          {/* Informations des personnes */}
          <div className='space-y-4'>
            <h3 className='text-lg font-semibold text-gray-800 flex items-center gap-2'>
              <div className='w-2 h-2 bg-green-500 rounded-full'></div>
              Informations des personnes
            </h3>

            {/* Demandeur */}
            <div className='bg-green-50 p-4 rounded-lg border border-green-200'>
              <div className='flex items-center gap-2 mb-3'>
                <User className='w-4 h-4 text-green-600' />
                <span className='font-semibold text-green-800'>Demandeur</span>
              </div>
              <div className='space-y-2 text-sm text-green-700'>
                <div>
                  <span className='font-medium'>Nom :</span>{' '}
                  {appointment.requester?.firstName}{' '}
                  {appointment.requester?.lastName}
                </div>
                <div>
                  <span className='font-medium'>Téléphone :</span>{' '}
                  {appointment.requester?.phone}
                </div>
                <div>
                  <span className='font-medium'>Email :</span>{' '}
                  {appointment.requester?.email}
                </div>
              </div>
            </div>

            {/* Bénéficiaire */}
            <div className='bg-purple-50 p-4 rounded-lg border border-purple-200'>
              <div className='flex items-center gap-2 mb-3'>
                <User className='w-4 h-4 text-purple-600' />
                <span className='font-semibold text-purple-800'>
                  Bénéficiaire
                </span>
              </div>
              <div className='space-y-2 text-sm text-purple-700'>
                <div>
                  <span className='font-medium'>Nom :</span>{' '}
                  {appointment.recipient?.firstName}{' '}
                  {appointment.recipient?.lastName}
                </div>
                <div>
                  <span className='font-medium'>Téléphone :</span>{' '}
                  {appointment.recipient?.phone || 'Non renseigné'}
                </div>
              </div>
            </div>
          </div>

          {/* Conditions et informations */}
          <div className='space-y-4'>
            <h3 className='text-lg font-semibold text-gray-800 flex items-center gap-2'>
              <div className='w-2 h-2 bg-gray-500 rounded-full'></div>
              Conditions et informations importantes
            </h3>

            <div className='bg-gray-50 p-4 rounded-lg border border-gray-200'>
              <div className='space-y-2 text-sm text-gray-700'>
                <div className='flex items-start gap-2'>
                  <div className='w-1.5 h-1.5 bg-gray-500 rounded-full mt-2 flex-shrink-0'></div>
                  <span>
                    Annulation gratuite jusqu&apos;à 24h avant le rendez-vous
                  </span>
                </div>
                <div className='flex items-start gap-2'>
                  <div className='w-1.5 h-1.5 bg-gray-500 rounded-full mt-2 flex-shrink-0'></div>
                  <span>Paiement sécurisé par cryptage SSL</span>
                </div>
                <div className='flex items-start gap-2'>
                  <div className='w-1.5 h-1.5 bg-gray-500 rounded-full mt-2 flex-shrink-0'></div>
                  <span>Confirmation par email immédiate après paiement</span>
                </div>
                <div className='flex items-start gap-2'>
                  <div className='w-1.5 h-1.5 bg-gray-500 rounded-full mt-2 flex-shrink-0'></div>
                  <span>Support client disponible 7j/7</span>
                </div>
              </div>
            </div>
          </div>

          {/* Résumé final */}
          <div className='bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-lg'>
            <div className='flex justify-between items-center'>
              <div>
                <h4 className='font-bold text-lg'>Total à payer</h4>
                <p className='text-blue-100 text-sm'>
                  Paiement sécurisé par carte bancaire
                </p>
              </div>
              <div className='text-right'>
                <div className='text-2xl font-bold'>{totalPrice} €</div>
                <div className='text-blue-100 text-sm'>TTC</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className='flex justify-between gap-3 p-6 border-t border-gray-200 bg-gray-50'>
          <button
            className='px-6 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer'
            onClick={handleBack}
          >
            Retour
          </button>
          <button
            className='px-6 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 font-medium shadow-sm transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
            onClick={handleConfirmPayment}
            disabled={!isValid}
          >
            Confirmer le paiement
          </button>
        </div>
        {errorMsg && (
          <div className='text-red-600 text-sm mt-2'>{errorMsg}</div>
        )}
      </div>
    </div>
  );
};
