import { NextRequest, NextResponse } from "next/server";
import { UserService } from "@/services/userService";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Récupérer l'utilisateur par ID
    const provider = await UserService.getUserById(params.id);

    // Vérifier que l'utilisateur a le rôle PROVIDER
    if (!provider['roles'].includes("PROVIDER")) {
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
