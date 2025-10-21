import { NextRequest, NextResponse } from "next/server";
import { userService } from "@/services/user/user.service";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Récupérer l'utilisateur par ID
    const provider = await userService.getUserProfile(params.id);

    // Vérifier que l'utilisateur a le rôle PROVIDER
    if (!provider.role.includes("PROVIDER")) {
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
