/**
 * API Route pour créer une réservation de service
 * POST /api/services/book
 */

import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { handleApiRoute } from '@/lib/api/error-handler';
import { childLogger } from '@/lib/logger';
import { serviceBookingFacade } from '@/facades';
import type { ServiceBookingFacadeData } from '@/lib/types/service-booking.types';

export async function POST(req: NextRequest) {
  const reqId = req.headers.get('x-request-id') || undefined;
  const log = childLogger({
    requestId: reqId,
    route: 'api/services/book',
  });

  return handleApiRoute(req, async () => {
    const data: ServiceBookingFacadeData = await req.json();

    // Valider les données requises
    if (!data.serviceType || !data.clientInfo || !data.beneficiaryInfo || !data.selectedService || !data.paymentIntentId) {
      log.warn({ data: { serviceType: data.serviceType, hasClientInfo: !!data.clientInfo, hasBeneficiaryInfo: !!data.beneficiaryInfo, hasSelectedService: !!data.selectedService, hasPaymentIntentId: !!data.paymentIntentId } }, 'Données incomplètes');
      throw new Error('Données incomplètes');
    }

    // Récupérer l'utilisateur connecté si disponible
    const session = await auth();
    const userId = session?.user?.id;

    log.info(
      {
        userId,
        isAuthenticated: !!userId,
        serviceType: data.serviceType,
        clientEmail: data.clientInfo.email,
      },
      'Création de réservation de service',
    );

    // Si l'utilisateur est connecté, ajouter son ID dans les métadonnées
    // Cela permettra d'attribuer la commande à l'utilisateur au lieu de générer un guest ID
    if (userId) {
      data.metadata = {
        ...(data.metadata || {}),
        userId: userId,
      };
      
      log.debug(
        {
          userId,
          hasMetadata: !!data.metadata,
          metadataKeys: data.metadata ? Object.keys(data.metadata) : [],
        },
        'ID utilisateur ajouté aux métadonnées',
      );
    } else {
      log.info(
        {
          clientEmail: data.clientInfo.email,
        },
        'Utilisateur non connecté, génération d\'un guest ID',
      );
    }

    // Exécuter la facade
    const result = await serviceBookingFacade.execute(data);

    if (!result.success) {
      log.error(
        {
          error: result.error,
          serviceType: data.serviceType,
          userId,
        },
        'Échec de la création de réservation',
      );
      throw new Error(result.error || 'Erreur lors de la création de la réservation');
    }

    log.info(
      {
        bookingId: result.bookingId,
        reservationNumber: result.reservationNumber,
        userId,
        serviceType: data.serviceType,
      },
      'Réservation créée avec succès',
    );

    return result;
  }, 'api/services/book');
}

