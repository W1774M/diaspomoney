/**
 * API Route - Confirm Booking Payment
 * Délègue au use case ConfirmBookingPayment (preuve Stripe + emails).
 */

import { auth } from '@/auth';
import { handleApiRoute, ApiErrors, validateBody } from '@/lib/api/error-handler';
import {
  ConfirmPaymentSchema,
  type ConfirmPaymentInput,
} from '@/lib/validations/booking-payment.schema';
import { confirmBookingPaymentService } from '@/services/booking/confirm-booking-payment.service';
import { NextRequest } from 'next/server';

/**
 * POST /api/bookings/confirm-payment - Confirmer le paiement d'une réservation
 */
export async function POST(request: NextRequest) {
  return handleApiRoute(
    request,
    async () => {
      const session = await auth();
      if (!session?.user?.email) {
        throw ApiErrors.UNAUTHORIZED;
      }

      const body = await request.json();
      const validatedData: ConfirmPaymentInput = validateBody(
        body,
        ConfirmPaymentSchema,
      );

      const { appointment, paymentData } = validatedData;
      const proofId =
        paymentData.paymentIntentId || paymentData.checkoutSessionId || '';

      const formattedDate = appointment.timeslot
        ? new Date(appointment.timeslot).toLocaleDateString('fr-FR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })
        : 'Non spécifié';

      const requesterName = appointment.requester
        ? `${appointment.requester.firstName} ${appointment.requester.lastName}`
        : 'Client';

      const result = await confirmBookingPaymentService.execute({
        proofId,
        expectedAmount: paymentData.amount,
        expectedCurrency: paymentData.currency,
        acceptProcessing: false,
        bookingId: appointment.id || appointment._id,
        emailContext: {
          ...(appointment.requester?.email
            ? { requesterEmail: appointment.requester.email }
            : {}),
          requesterName,
          ...(appointment.selectedService?.name
            ? { serviceName: appointment.selectedService.name }
            : {}),
          ...(appointment.provider?.name
            ? { providerName: appointment.provider.name }
            : {}),
          amount: paymentData.amount,
          currency: paymentData.currency,
          formattedDate,
          contactEmail:
            process.env['EMAIL_CONTACT'] || 'contact@diaspomoney.fr',
        },
      });

      if (!result.success) {
        throw ApiErrors.PAYMENT_REQUIRED(
          result.error || 'Paiement non confirmé auprès de Stripe',
        );
      }

      return {
        success: true,
        message: 'Paiement confirmé et emails envoyés avec succès',
        reservationNumber: result.reservationNumber,
        paymentIntentId: result.paymentIntentId,
      };
    },
    'api/bookings/confirm-payment',
  );
}
