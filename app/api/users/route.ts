import { NextRequest, NextResponse } from "next/server";
import { MOCK_USERS, getUsersByRole } from "@/mocks";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role");

    let users = MOCK_USERS;

    // Filtrer par rôle si spécifié
    if (role) {
      users = getUsersByRole(role);
    }

    return NextResponse.json({
      data: users,
      total: users.length,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des utilisateurs:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
