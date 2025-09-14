import { MOCK_APPOINTMENTS } from "@/mocks";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      appointments: MOCK_APPOINTMENTS,
      total: MOCK_APPOINTMENTS.length,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des rendez-vous:", error);
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
    if (!appointmentData.providerId || !appointmentData.customerId || !appointmentData.serviceType) {
      return NextResponse.json(
        { error: "Données de rendez-vous incomplètes" },
        { status: 400 }
      );
    }

    // Création d'un nouveau rendez-vous
    const newAppointment = {
      id: `appointment_${Date.now()}`,
      ...appointmentData,
      status: "PENDING",
      createdAt: new Date(),
    };

    // Simulation de l'ajout à la base de données
    console.log("Nouveau rendez-vous créé:", newAppointment);

    return NextResponse.json({
      success: true,
      appointment: newAppointment,
      message: "Rendez-vous créé avec succès"
    }, { status: 201 });

  } catch (error) {
    console.error("Erreur lors de la création du rendez-vous:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
