import { BookingService } from '@/services/bookingService';
import mongoose from 'mongoose';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('API Booking [id] - ID:', params.id); // Debug

    // Vérifier que l'ID est un ObjectId valide
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      console.log('ID invalide:', params.id); // Debug
      return NextResponse.json(
        { error: 'ID de réservation invalide' },
        { status: 400 }
      );
    }

    const booking = await BookingService.getBookingById(params.id);

    return NextResponse.json({
      success: true,
      booking,
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de la réservation:', error);

    // Gérer le cas où la réservation n'est pas trouvée
    if (error instanceof Error && error.message === 'Réservation non trouvée') {
      return NextResponse.json(
        { error: 'Réservation non trouvée' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
