import { NextRequest, NextResponse } from "next/server";
import { AppointmentService } from "@/services/appointmentService";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const appointment = await AppointmentService.getAppointmentById(params.id);

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
