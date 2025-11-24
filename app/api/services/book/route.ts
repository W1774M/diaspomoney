/**
 * API Route pour créer une réservation de service
 * POST /api/services/book
 */

import { NextRequest, NextResponse } from 'next/server';
import { serviceBookingFacade } from '@/facades';
import type { ServiceBookingFacadeData } from '@/lib/types/service-booking.types';

export async function POST(req: NextRequest) {
  try {
    const data: ServiceBookingFacadeData = await req.json();

    // Valider les données requises
    if (!data.serviceType || !data.clientInfo || !data.beneficiaryInfo || !data.selectedService || !data.paymentIntentId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Données incomplètes',
        },
        { status: 400 },
      );
    }

    // Exécuter la facade
    const result = await serviceBookingFacade.execute(data);

    if (result.success) {
      return NextResponse.json(result, { status: 201 });
    } else {
      return NextResponse.json(result, { status: 400 });
    }
  } catch (error: any) {
    console.error('Error creating service booking:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Une erreur est survenue',
      },
      { status: 500 },
    );
  }
}

