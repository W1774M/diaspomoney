import { NextRequest, NextResponse } from "next/server";
import { findAppointmentById } from "@/mocks";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const appointment = findAppointmentById(params.id);

    if (!appointment) {
      return NextResponse.json(
        { error: "Rendez-vous non trouvé" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      appointment,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération du rendez-vous:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
