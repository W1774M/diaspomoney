/**
 * Hook personnalisé pour gérer les actions sur une réservation
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { logger } from '@/lib/logger';
import { useNotificationManager } from '@/components/ui/Notification';
import { BOOKING_STATUSES } from '@/lib/constants';
import { sendBookingTakeChargeEmail } from '@/lib/email/resend';
import { generateInvoicePDF, getStripePaymentDetails, type InvoiceData } from '@/lib/invoice-pdf-generator';
import { formatReservationNumber } from '@/lib/utils/booking.utils';
import type { BookingResponse } from '@/lib/mappers/booking.mapper';

interface UseBookingActionsProps {
  booking: BookingResponse | null | undefined;
  bookingId: string;
  updateStatus: (status: string) => Promise<boolean>;
  refetch: () => Promise<void>;
  deleteBooking: (id: string) => Promise<{ success: boolean }>;
  isProgressComplete: boolean;
  bookingsPageUrl: string;
}

export function useBookingActions({
  booking,
  bookingId,
  updateStatus,
  refetch,
  deleteBooking,
  isProgressComplete,
  bookingsPageUrl,
}: UseBookingActionsProps) {
  const router = useRouter();
  const notificationManager = useNotificationManager();

  const [isUpdating, setIsUpdating] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [generatingInvoice, setGeneratingInvoice] = useState(false);
  const [showTakeChargeDialog, setShowTakeChargeDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleTakeChargeClick = () => {
    if (!booking || !isProgressComplete) return;
    setShowTakeChargeDialog(true);
  };

  const handleTakeCharge = async () => {
    if (!booking) return;

    logger.info({ bookingId, currentStatus: booking.status }, 'Admin taking charge of booking');
    setIsUpdating(true);

    try {
      const success = await updateStatus(BOOKING_STATUSES.CONFIRMED);
      if (success) {
        setShowTakeChargeDialog(false);

        try {
          await refetch();
        } catch (refetchError) {
          logger.warn({ error: refetchError, bookingId }, 'Error refetching booking after take charge');
        }

        // Envoyer l'email de confirmation
        try {
          const clientEmail = booking.metadata?.['clientEmail'] as string | undefined;
          const clientName =
            booking.metadata?.['clientFirstName'] && booking.metadata?.['clientLastName']
              ? `${booking.metadata['clientFirstName']} ${booking.metadata['clientLastName']}`
              : (booking.metadata?.['clientName'] as string | undefined) || 'Client';

          const createdAt = booking.createdAt ? new Date(booking.createdAt) : new Date();
          const reservationNumber = formatReservationNumber(
            booking.reservationNumber,
            createdAt,
            booking.id,
          );
          const serviceName =
            (booking.metadata?.['serviceLabel'] as string | undefined) ||
            booking.serviceId ||
            'Service';
          const amount = booking.metadata?.['totalAmount'] as string | number | undefined;
          const currency = (booking.metadata?.['currency'] as string | undefined) || '€';

          if (clientEmail) {
            const emailSent = await sendBookingTakeChargeEmail(
              clientEmail,
              clientName,
              reservationNumber,
              serviceName,
              amount,
              currency,
            );

            if (emailSent) {
              logger.info({ bookingId, clientEmail }, 'Take charge confirmation email sent successfully');
            } else {
              logger.warn({ bookingId, clientEmail }, 'Failed to send take charge confirmation email');
            }
          } else {
            logger.warn({ bookingId }, 'No client email found, skipping email notification');
          }
        } catch (emailError) {
          logger.error({ error: emailError, bookingId }, 'Error sending take charge confirmation email');
        }

        notificationManager.addSuccess('Commande prise en charge avec succès');
        logger.info({ bookingId }, 'Booking successfully taken charge by admin');
      } else {
        logger.error({ bookingId }, 'Failed to take charge of booking');
        notificationManager.addError('Erreur lors de la prise en charge de la commande');
      }
    } catch (error) {
      logger.error({ error, bookingId }, 'Error taking charge of booking');
      notificationManager.addError('Erreur lors de la prise en charge de la commande');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteBookingClick = () => {
    if (!booking) return;
    setShowDeleteDialog(true);
  };

  const handleDeleteBooking = async () => {
    if (!booking) return;

    logger.warn({ bookingId, reservationNumber: booking.reservationNumber }, 'Admin deleting booking');
    setDeleteLoading(true);

    try {
      const result = await deleteBooking(bookingId);
      if (result.success) {
        logger.info({ bookingId }, 'Booking deleted successfully');
        notificationManager.addSuccess('Réservation supprimée complètement avec tous ses éléments associés');
        setShowDeleteDialog(false);
        router.push(bookingsPageUrl);
      } else {
        logger.error({ bookingId }, 'Failed to delete booking');
        notificationManager.addError('Erreur lors de la suppression de la réservation');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      logger.error({ error: err, bookingId }, 'Error deleting booking');
      notificationManager.addError(`Erreur lors de la suppression : ${errorMessage}`);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleGenerateInvoice = async () => {
    if (!booking) return;

    logger.info({ bookingId }, 'Generating invoice PDF');
    setGeneratingInvoice(true);

    try {
      let stripeDetails = null;
      const paymentIntentId = booking.metadata?.['paymentIntentId'] as string | undefined;
      if (paymentIntentId) {
        stripeDetails = await getStripePaymentDetails(paymentIntentId);
        if (!stripeDetails) {
          logger.warn({ paymentIntentId }, 'Could not fetch Stripe payment details');
        }
      }

      const companyInfo = {
        name: 'DiaspoMoney',
        address: '123 Rue de l\'Innovation',
        city: 'Paris',
        postalCode: '75001',
        country: 'France',
        email: 'contact@diaspomoney.fr',
        phone: '+33 1 23 45 67 89',
        siret: '123 456 789 00012',
        vatNumber: 'FR12 345678901',
      };

      const invoiceData: InvoiceData = {
        booking,
        ...(stripeDetails && { stripeDetails }),
        companyInfo,
      };

      const pdfDoc = await generateInvoicePDF(invoiceData);

      const reservationNumber = booking.reservationNumber || booking.id.slice(-8).toUpperCase();
      const invoiceNumber = `FAC-${new Date(booking.createdAt).getFullYear()}-${reservationNumber}`;
      const fileName = `facture-${invoiceNumber}.pdf`;

      pdfDoc.save(fileName);

      logger.info({ bookingId, fileName }, 'Invoice PDF generated and downloaded successfully');
      notificationManager.addSuccess('Facture générée et téléchargée avec succès');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      logger.error({ error: err, bookingId }, 'Error generating invoice PDF');
      notificationManager.addError(`Erreur lors de la génération de la facture : ${errorMessage}`);
    } finally {
      setGeneratingInvoice(false);
    }
  };

  return {
    isUpdating,
    deleteLoading,
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
  };
}

