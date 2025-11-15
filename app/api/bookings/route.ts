import { BookingData, bookingService, BookingServiceFilters } from "@/services/booking/booking.service";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const providerId = searchParams.get("providerId");
    const status = searchParams.get("status");
    const limit = searchParams.get("limit");
    const offset = searchParams.get("offset");

    // Construire les filtres
    const filters = {
      userId: userId || undefined,
      providerId: providerId || undefined,
      status: status || undefined,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
    };

    const result = await bookingService.getBookings(filters as BookingServiceFilters);

    return NextResponse.json({
      success: true,
      bookings: result.data,
      total: result.total,
      limit: result.limit,
      offset: result.offset,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des réservations:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const appointmentData = await request.json();

    // Validation des données
    if (
      !appointmentData.providerId ||
      !appointmentData.customerId ||
      !appointmentData.serviceType
    ) {
      return NextResponse.json(
        { error: "Données de rendez-vous incomplètes" },
        { status: 400 }
      );
    }

    // Création d'un nouveau rendez-vous via le service
    const newAppointment = await bookingService.createBooking(
      appointmentData as BookingData
    );

    return NextResponse.json(
      {
        success: true,
        appointment: newAppointment,
        message: "Rendez-vous créé avec succès",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erreur lors de la création du rendez-vous:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
