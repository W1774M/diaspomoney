import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { token, newPassword } = await request.json();

    if (!token || !newPassword) {
      return NextResponse.json(
        { error: "Token et nouveau mot de passe requis" },
        { status: 400 }
      );
    }

    // Validation du mot de passe
    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "Le mot de passe doit contenir au moins 8 caractères" },
        { status: 400 }
      );
    }

    // Pour le moment, on simule la réinitialisation du mot de passe
    console.log(`Mot de passe réinitialisé pour le token: ${token}`);

    return NextResponse.json(
      {
        success: true,
        message: "Mot de passe réinitialisé avec succès",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur lors de la réinitialisation du mot de passe:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
