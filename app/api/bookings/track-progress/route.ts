/**
 * API Route - Track Booking Progress
 * Endpoint pour enregistrer la progression d'une réservation à chaque étape
 * Permet à l'admin de suivre où chaque client est bloqué
 */

import { handleApiRoute, validateBody } from '@/lib/api/error-handler';
import { childLogger } from '@/lib/logger';
import { bookingService } from '@/services/booking/booking.service';
import { NextRequest } from 'next/server';
import { z } from 'zod';

const TrackProgressSchema = z.object({
  step: z.number().min(1).max(4),
  stepName: z.string(),
  serviceType: z.enum(['HEALTH', 'EDUCATION', 'BTP']),
  clientInfo: z.object({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
  }).optional(),
  beneficiaryInfo: z.object({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email().optional(),
  }).optional(),
  selectedService: z.object({
    serviceId: z.string(),
    label: z.string(),
    price: z.number(),
  }).optional(),
  paymentIntentId: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  bookingId: z.string().optional(), // ID du booking draft si déjà créé
});

export async function POST(request: NextRequest) {
  const reqId = request.headers.get('x-request-id') || undefined;
  const log = childLogger({
    requestId: reqId,
    route: 'api/bookings/track-progress',
  });

  return handleApiRoute(
    request,
    async () => {
      const body = await request.json();
      const data = validateBody(body, TrackProgressSchema);

      const {
        step,
        stepName,
        serviceType,
        clientInfo,
        beneficiaryInfo,
        selectedService,
        paymentIntentId,
        metadata = {},
        bookingId,
      } = data;

      // Générer un ID unique pour le client (basé sur l'email si disponible)
      const generateClientId = (email?: string): string => {
        if (email) {
          const timestamp = Date.now().toString(36);
          const emailHash = email.split('@')[0]?.substring(0, 6) || '';
          return `guest-${emailHash}-${timestamp}`;
        }
        return `guest-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
      };

      const requesterId = generateClientId(clientInfo?.email);
      const draftProviderId = 'admin-draft'; // ID spécial pour les drafts

      // Préparer les métadonnées de progression
      const existingProgressHistory = metadata['progressHistory'] || [];
      const progressMetadata = {
        ...metadata,
        isDraft: true,
        currentStep: step,
        stepName,
        progressHistory: [
          ...(Array.isArray(existingProgressHistory) ? existingProgressHistory : []),
          {
            step,
            stepName,
            timestamp: new Date().toISOString(),
            completed: true,
            data: {
              serviceType,
              hasClientInfo: !!clientInfo,
              hasBeneficiaryInfo: !!beneficiaryInfo,
              hasSelectedService: !!selectedService,
              hasPaymentIntent: !!paymentIntentId,
            },
          },
        ],
        lastUpdatedAt: new Date().toISOString(),
        clientEmail: clientInfo?.email,
        clientFirstName: clientInfo?.firstName,
        clientLastName: clientInfo?.lastName,
        clientPhone: clientInfo?.phone,
        clientName: clientInfo?.firstName && clientInfo?.lastName
          ? `${clientInfo.firstName} ${clientInfo.lastName}`
          : undefined,
        beneficiaryFirstName: beneficiaryInfo?.firstName,
        beneficiaryLastName: beneficiaryInfo?.lastName,
        beneficiaryPhone: beneficiaryInfo?.phone,
        beneficiaryEmail: beneficiaryInfo?.email,
        beneficiaryName: beneficiaryInfo?.firstName && beneficiaryInfo?.lastName
          ? `${beneficiaryInfo.firstName} ${beneficiaryInfo.lastName}`
          : undefined,
        serviceLabel: selectedService?.label,
        servicePrice: selectedService?.price,
      };

      let booking;

      if (bookingId) {
        // Mettre à jour le booking existant
        try {
          booking = await bookingService.updateBooking(bookingId, {
            metadata: progressMetadata,
          } as any);
          log.info(
            {
              bookingId,
              step,
              stepName,
            },
            'Booking progress updated',
          );
        } catch (error) {
          log.warn(
            { error, bookingId, step },
            'Failed to update booking, creating new one',
          );
          // Si la mise à jour échoue, créer un nouveau booking
          const recipientData = beneficiaryInfo
            ? {
                firstName: beneficiaryInfo.firstName || '',
                lastName: beneficiaryInfo.lastName || '',
                phone: beneficiaryInfo.phone || '',
              }
            : {
                firstName: clientInfo?.firstName || '',
                lastName: clientInfo?.lastName || '',
                phone: clientInfo?.phone || '',
              };

          booking = await bookingService.createBooking({
            requesterId,
            providerId: draftProviderId,
            serviceId: selectedService?.serviceId || 'draft',
            serviceType,
            appointmentDate: new Date(),
            recipient: recipientData,
            metadata: progressMetadata,
          });
        }
      } else {
        // Créer un nouveau booking draft
        const recipientData = beneficiaryInfo
          ? {
              firstName: beneficiaryInfo.firstName || '',
              lastName: beneficiaryInfo.lastName || '',
              phone: beneficiaryInfo.phone || '',
            }
          : {
              firstName: clientInfo?.firstName || '',
              lastName: clientInfo?.lastName || '',
              phone: clientInfo?.phone || '',
            };

        booking = await bookingService.createBooking({
          requesterId,
          providerId: draftProviderId,
          serviceId: selectedService?.serviceId || 'draft',
          serviceType,
          appointmentDate: new Date(),
          recipient: recipientData,
          metadata: progressMetadata,
        });
      }

      log.info(
        {
          bookingId: booking.id,
          step,
          stepName,
          serviceType,
        },
        'Booking progress tracked',
      );

      return {
        success: true,
        bookingId: booking.id || (booking as any)._id?.toString(),
        step,
        message: `Progression de l'étape ${step} enregistrée`,
      };
    },
    'api/bookings/track-progress',
  );
}

