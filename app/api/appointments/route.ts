import { authOptions } from "@/config/auth";
import { connectDatabase } from "@/config/database";
import Appointment from "@/models/Appointment";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Connexion à la base de données
    await connectDatabase();

    // Récupérer tous les rendez-vous de l'utilisateur connecté
    const appointments = await Appointment.find({
      "requester.email": session.user.email,
    })
      .sort({ createdAt: -1 }) // Plus récents en premier
      .lean(); // Pour de meilleures performances

    // Formater les données pour le frontend
    const formattedAppointments = appointments.map((appointment) => ({
      id: appointment._id,
      reservationNumber: appointment.reservationNumber,
      provider: {
        name: appointment.provider.name,
        specialty: appointment.provider.specialty,
        location:
          appointment.provider.apiGeo[0]?.display_name ||
          "Localisation non disponible",
      },
      service: appointment.selectedService,
      timeslot: appointment.timeslot,
      status: appointment.status,
      paymentStatus: appointment.paymentStatus,
      totalAmount: appointment.totalAmount,
      createdAt: appointment.createdAt,
      updatedAt: appointment.updatedAt,
    }));

    return NextResponse.json({
      success: true,
      appointments: formattedAppointments,
      total: formattedAppointments.length,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des rendez-vous:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
