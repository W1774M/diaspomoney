import { auth } from '@/auth';
import { ROLES } from '@/lib/constants';
import { childLogger } from '@/lib/logger';
import { bookingService } from '@/services/booking/booking.service';
import mongoose from 'mongoose';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const SharedElementsSchema = z.object({
  clientInfo: z.boolean().optional(),
  beneficiaryInfo: z.boolean().optional(),
  serviceDetails: z.boolean().optional(),
  paymentInfo: z.boolean().optional(),
  appointmentInfo: z.boolean().optional(),
  additionalOptions: z.boolean().optional(),
}).optional();

const AssignProviderSchema = z.discriminatedUnion('mode', [
  z.object({
    mode: z.literal('registered'),
    providerId: z.string().min(1),
    sharedElements: SharedElementsSchema,
  }),
  z.object({
    mode: z.literal('external'),
    providerEmail: z.string().email(),
    providerName: z.string().min(1).optional(),
    sendEmail: z.boolean().optional().default(true),
    sharedElements: SharedElementsSchema,
  }),
]);

/**
 * POST /api/bookings/[id]/assign-provider
 * Permet à un admin d'attribuer une réservation à :
 * - un prestataire enregistré (providerId)
 * - un prestataire externe (email) + envoi des détails par mail
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } },
) {
  const reqId = request.headers.get('x-request-id') || undefined;
  const log = childLogger({
    requestId: reqId,
    route: 'api/bookings/[id]/assign-provider',
  });

  try {
    const session = await auth();
    if (!session?.user?.id) {
      log.warn({ msg: 'Unauthorized access attempt' });
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const userRoles = session.user.roles || [];
    const isAdmin = userRoles.includes(ROLES.ADMIN) || userRoles.includes(ROLES.SUPERADMIN);
    if (!isAdmin) {
      log.warn({ userId: session.user.id, roles: userRoles }, 'Access denied: not admin');
      return NextResponse.json(
        { error: "Accès refusé. Seuls les administrateurs peuvent attribuer un prestataire." },
        { status: 403 },
      );
    }

    const resolvedParams = await Promise.resolve(params);
    const bookingId = resolvedParams.id;

    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      log.warn({ bookingId }, 'Invalid booking ID format');
      return NextResponse.json({ error: 'ID de réservation invalide' }, { status: 400 });
    }

    const body = await request.json();
    const parsed = AssignProviderSchema.safeParse(body);
    if (!parsed.success) {
      log.warn({ errors: parsed.error.errors }, 'Invalid request body');
      return NextResponse.json(
        { error: 'Données invalides', details: parsed.error.errors },
        { status: 400 },
      );
    }

    const booking = await bookingService.getBookingById(bookingId);
    const prevMetadata = booking.metadata || {};

    // Préparer les champs communs d'audit
    const assignedAt = new Date().toISOString();
    const assignedBy = session.user.id;

    // Récupérer provider enregistré si besoin
    let nextProviderId = booking.providerId;
    let assignedProviderName: string | undefined;
    let assignedProviderEmail: string | undefined;
    let assignedProviderType: 'REGISTERED' | 'EXTERNAL';

    if (parsed.data.mode === 'registered') {
      assignedProviderType = 'REGISTERED';
      nextProviderId = parsed.data.providerId;
      let providerFound = true; // reste vrai si la recherche échoue techniquement

      try {
        const { getUserRepository } = await import('@/repositories');
        const userRepository = getUserRepository();
        const providerUser = await userRepository.findById(parsed.data.providerId);
        providerFound = Boolean(providerUser);
        if (providerUser) {
          assignedProviderName = providerUser.name || `${providerUser.firstName || ''} ${providerUser.lastName || ''}`.trim() || undefined;
          assignedProviderEmail = providerUser.email || undefined;
        }
      } catch (e) {
        log.warn({ error: e, providerId: parsed.data.providerId }, 'Unable to fetch provider user details');
      }
      // Avant : la réservation était attribuée à un identifiant qui ne correspond à aucun compte.
      if (!providerFound) {
        return NextResponse.json({ error: 'Prestataire non trouvé' }, { status: 404 });
      }
    } else {
      assignedProviderType = 'EXTERNAL';
      nextProviderId = ''; // désattribuer la liaison interne
      assignedProviderEmail = parsed.data.providerEmail;
      assignedProviderName = parsed.data.providerName;
    }

    // Récupérer les éléments partagés si fournis
    const sharedElements = parsed.data.sharedElements || {
      clientInfo: true,
      beneficiaryInfo: true,
      serviceDetails: true,
      paymentInfo: false,
      appointmentInfo: true,
      additionalOptions: true,
    };

    const updatedMetadata: Record<string, any> = {
      ...prevMetadata,
      assignedProviderType,
      assignedProviderId: assignedProviderType === 'REGISTERED' ? nextProviderId : undefined,
      assignedProviderName: assignedProviderName || undefined,
      assignedProviderEmail: assignedProviderEmail || undefined,
      assignedProviderAssignedAt: assignedAt,
      assignedProviderAssignedBy: assignedBy,
      sharedElements, // Stocker les éléments autorisés pour ce prestataire
    };

    // Nettoyer les champs si on change de mode
    if (assignedProviderType === 'REGISTERED') {
      delete updatedMetadata['assignedProviderExternalEmailSentAt'];
      delete updatedMetadata['assignedProviderExternalEmailStatus'];
    }

    const updatedBooking = await bookingService.updateBooking(bookingId, {
      providerId: nextProviderId,
      metadata: updatedMetadata,
    } as any);

    // Envoi d'email uniquement pour les prestataires externes
    if (parsed.data.mode === 'external' && parsed.data.sendEmail !== false) {
      try {
        const { sendExternalProviderAssignmentEmail } = await import('@/lib/email/resend');

        const serviceName =
          (updatedBooking.metadata?.['serviceLabel'] as string | undefined) ||
          updatedBooking.serviceId ||
          'Service';

        const appointmentDate =
          updatedBooking.appointmentDate instanceof Date
            ? updatedBooking.appointmentDate
            : updatedBooking.appointmentDate
              ? new Date(updatedBooking.appointmentDate as any)
              : undefined;

        const appointmentDateLabel = appointmentDate
          ? appointmentDate.toLocaleDateString('fr-FR', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: '2-digit',
            })
          : undefined;

        const appointmentTime = updatedBooking.timeslot || (appointmentDate ? appointmentDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : undefined);

        const clientFirstName = updatedBooking.metadata?.['clientFirstName'] as string | undefined;
        const clientLastName = updatedBooking.metadata?.['clientLastName'] as string | undefined;
        const clientName =
          (clientFirstName || clientLastName)
            ? `${clientFirstName || ''} ${clientLastName || ''}`.trim()
            : (updatedBooking.metadata?.['clientName'] as string | undefined);

        const clientEmail = updatedBooking.metadata?.['clientEmail'] as string | undefined;
        const clientPhone = updatedBooking.metadata?.['clientPhone'] as string | undefined;

        const beneficiaryFirstName =
          updatedBooking.recipient?.firstName ||
          (updatedBooking.metadata?.['beneficiaryFirstName'] as string | undefined);
        const beneficiaryLastName =
          updatedBooking.recipient?.lastName ||
          (updatedBooking.metadata?.['beneficiaryLastName'] as string | undefined);
        const beneficiaryName =
          (beneficiaryFirstName || beneficiaryLastName)
            ? `${beneficiaryFirstName || ''} ${beneficiaryLastName || ''}`.trim()
            : undefined;
        const beneficiaryPhone =
          updatedBooking.recipient?.phone ||
          (updatedBooking.metadata?.['beneficiaryPhone'] as string | undefined);

        const emailArgs: Parameters<typeof sendExternalProviderAssignmentEmail>[0] = {
          to: parsed.data.providerEmail,
          reservationNumber: updatedBooking.reservationNumber || bookingId,
          serviceName,
          ...(parsed.data.providerName ? { providerName: parsed.data.providerName } : {}),
          ...(appointmentDateLabel ? { appointmentDate: appointmentDateLabel } : {}),
          ...(appointmentTime ? { appointmentTime } : {}),
          ...(clientName ? { clientName } : {}),
          ...(clientEmail ? { clientEmail } : {}),
          ...(clientPhone ? { clientPhone } : {}),
          ...(beneficiaryName ? { beneficiaryName } : {}),
          ...(beneficiaryPhone ? { beneficiaryPhone } : {}),
        };

        const emailSent = await sendExternalProviderAssignmentEmail(emailArgs);

        updatedMetadata['assignedProviderExternalEmailSentAt'] = new Date().toISOString();
        updatedMetadata['assignedProviderExternalEmailStatus'] = emailSent ? 'sent' : 'failed';

        // Best-effort: persister le statut d'email
        await bookingService.updateBooking(bookingId, {
          metadata: updatedMetadata,
        } as any);
      } catch (e) {
        log.error({ error: e, bookingId }, 'Failed to send external provider assignment email');
      }
    }

    const { bookingMapper } = await import('@/lib/mappers');
    const bookingDoc: any = {
      _id: updatedBooking._id,
      id: updatedBooking.id,
      reservationNumber: updatedBooking.reservationNumber,
      requesterId: updatedBooking.requesterId,
      providerId: updatedBooking.providerId,
      serviceId: updatedBooking.serviceId,
      serviceType: updatedBooking.serviceType,
      status: updatedBooking.status,
      timeslot: updatedBooking.timeslot,
      consultationMode: updatedBooking.consultationMode,
      recipient: updatedBooking.recipient,
      metadata: updatedBooking.metadata,
      createdAt: updatedBooking.createdAt,
      updatedAt: updatedBooking.updatedAt,
      ...(updatedBooking.appointmentDate && { appointmentDate: updatedBooking.appointmentDate }),
    };

    const mappedBooking = bookingMapper.map(bookingDoc);

    return NextResponse.json({
      success: true,
      message: 'Prestataire attribué avec succès',
      booking: mappedBooking,
    });
  } catch (error) {
    let bookingId: string;
    try {
      const resolvedParams = await Promise.resolve(params);
      bookingId = resolvedParams.id;
    } catch {
      bookingId = 'unknown';
    }

    log.error({ error, bookingId, msg: 'Error assigning provider' }, 'Error assigning provider');

    if (error instanceof Error && error.message === 'Réservation non trouvée') {
      return NextResponse.json({ error: 'Réservation non trouvée' }, { status: 404 });
    }

    return NextResponse.json(
      { error: "Erreur lors de l'attribution du prestataire" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/bookings/[id]/assign-provider
 * Permet à un admin de retirer le prestataire assigné à une réservation
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } },
) {
  const reqId = request.headers.get('x-request-id') || undefined;
  const log = childLogger({
    requestId: reqId,
    route: 'api/bookings/[id]/assign-provider',
  });

  try {
    const session = await auth();
    if (!session?.user?.id) {
      log.warn({ msg: 'Unauthorized access attempt' });
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const userRoles = session.user.roles || [];
    const isAdmin = userRoles.includes(ROLES.ADMIN) || userRoles.includes(ROLES.SUPERADMIN);
    if (!isAdmin) {
      log.warn({ userId: session.user.id, roles: userRoles }, 'Access denied: not admin');
      return NextResponse.json(
        { error: 'Accès refusé. Seuls les administrateurs peuvent retirer un prestataire.' },
        { status: 403 },
      );
    }

    const resolvedParams = await Promise.resolve(params);
    const bookingId = resolvedParams.id;

    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      log.warn({ bookingId }, 'Invalid booking ID format');
      return NextResponse.json({ error: 'ID de réservation invalide' }, { status: 400 });
    }

    log.debug({ bookingId, userId: session.user.id }, 'Removing provider from booking');

    const booking = await bookingService.getBookingById(bookingId);
    if (!booking) {
      log.warn({ bookingId }, 'Booking not found');
      return NextResponse.json({ error: 'Réservation non trouvée' }, { status: 404 });
    }

    const prevMetadata = (booking as any).metadata || {};
    const updatedMetadata: Record<string, any> = {
      ...prevMetadata,
      assignedProviderType: undefined,
      assignedProviderId: undefined,
      assignedProviderName: undefined,
      assignedProviderEmail: undefined,
      assignedProviderAssignedAt: undefined,
      assignedProviderAssignedBy: undefined,
      assignedProviderExternalEmailSentAt: undefined,
      assignedProviderExternalEmailStatus: undefined,
    };

    const updatedBooking = await bookingService.updateBooking(bookingId, {
      providerId: '',
      metadata: updatedMetadata,
    } as any);

    const { bookingMapper } = await import('@/lib/mappers');
    const bookingDoc: any = {
      _id: updatedBooking._id,
      id: updatedBooking.id,
      reservationNumber: updatedBooking.reservationNumber,
      requesterId: updatedBooking.requesterId,
      providerId: updatedBooking.providerId,
      serviceId: updatedBooking.serviceId,
      serviceType: updatedBooking.serviceType,
      status: updatedBooking.status,
      timeslot: updatedBooking.timeslot,
      consultationMode: updatedBooking.consultationMode,
      recipient: updatedBooking.recipient,
      metadata: updatedBooking.metadata,
      createdAt: updatedBooking.createdAt,
      updatedAt: updatedBooking.updatedAt,
      ...(updatedBooking.appointmentDate && { appointmentDate: updatedBooking.appointmentDate }),
    };

    const mappedBooking = bookingMapper.map(bookingDoc);

    log.info({ bookingId, userId: session.user.id }, 'Provider removed from booking');

    return NextResponse.json({
      success: true,
      message: 'Prestataire retiré avec succès',
      booking: mappedBooking,
    });
  } catch (error) {
    let bookingId: string;
    try {
      const resolvedParams = await Promise.resolve(params);
      bookingId = resolvedParams.id;
    } catch {
      bookingId = 'unknown';
    }

    log.error({ error, bookingId, msg: 'Error removing provider from booking' }, 'Error removing provider');
    return NextResponse.json(
      { error: 'Erreur lors de la suppression du prestataire' },
      { status: 500 },
    );
  }
}

