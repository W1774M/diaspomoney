import { MOCK_USERS } from "@/mocks";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Trouver l'utilisateur avec le rôle PROVIDER
    const provider = MOCK_USERS.find(
      user => user._id === params.id && user.roles.includes("PROVIDER")
    );

    if (!provider) {
      return NextResponse.json(
        { error: "Prestataire non trouvé" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: provider,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération du prestataire:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
