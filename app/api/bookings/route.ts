import { commandHandler, CreateBookingCommand } from "@/commands";
import { BookingFacadeData } from "@/facades/booking.facade";
import { initializeDI } from "@/lib/di/initialize";
import { logger } from "@/lib/logger";
import { BookingData, bookingService, BookingServiceFilters } from "@/services/booking/booking.service";
import { NextRequest, NextResponse } from "next/server";

// Initialiser le système DI au chargement du module
if (typeof window === 'undefined') {
  initializeDI();
}

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
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const appointmentData = await request.json();

    // Validation des données
    if (
      !appointmentData.providerId ||
      !appointmentData.requesterId ||
      !appointmentData.serviceType
    ) {
      return NextResponse.json(
        { error: "Données de rendez-vous incomplètes" },
        { status: 400 },
      );
    }

    // Si un paiement est inclus, utiliser la facade avec Command Pattern pour orchestrer tout le processus
    if (appointmentData.payment) {
      const bookingData: BookingFacadeData = {
        requesterId: appointmentData.requesterId,
        providerId: appointmentData.providerId,
        serviceId: appointmentData.serviceId || 'default',
        serviceType: appointmentData.serviceType,
        appointmentDate: appointmentData.appointmentDate 
          ? new Date(appointmentData.appointmentDate) 
          : new Date(),
        timeslot: appointmentData.timeslot,
        consultationMode: appointmentData.consultationMode,
        recipient: appointmentData.recipient,
        payment: {
          amount: appointmentData.payment.amount,
          currency: appointmentData.payment.currency || 'EUR',
          paymentMethodId: appointmentData.payment.paymentMethodId,
          createInvoice: appointmentData.payment.createInvoice !== false,
        },
        metadata: appointmentData.metadata,
      };

      // Utiliser le Command Pattern pour exécuter la commande avec historique et undo
      const command = new CreateBookingCommand(bookingData);
      const commandResult = await commandHandler.execute(command);

      if (!commandResult.success) {
        return NextResponse.json(
          {
            success: false,
            error: commandResult.error || 'Erreur lors de la création de la réservation',
          },
          { status: 400 },
        );
      }

      const result = commandResult.data!;

      logger.info({
        bookingId: result.booking?.id || (result.booking as any)?._id?.toString(),
        paymentSuccess: result.paymentResult?.success,
      }, 'Booking created with payment via Command Pattern');

      return NextResponse.json(
        {
          success: true,
          booking: result.booking,
          paymentResult: result.paymentResult,
          message: "Rendez-vous créé avec paiement traité avec succès",
        },
        { status: 201 },
      );
    }

    // Sinon, créer simplement la réservation sans paiement
    const newAppointment = await bookingService.createBooking(
      appointmentData as BookingData,
    );

    return NextResponse.json(
      {
        success: true,
        appointment: newAppointment,
        message: "Rendez-vous créé avec succès",
      },
      { status: 201 },
    );
  } catch (error: any) {
    logger.error({ error }, "Erreur lors de la création du rendez-vous");
    return NextResponse.json(
      { error: error?.message || "Erreur interne du serveur" },
      { status: 500 },
    );
  }
}
