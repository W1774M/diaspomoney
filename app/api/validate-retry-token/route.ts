import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");
    const expires = searchParams.get("expires");

    if (!token || !expires) {
      return NextResponse.json(
        { error: "Token ou date d'expiration manquant" },
        { status: 400 }
      );
    }

    // Vérifier si le token n'a pas expiré
    const expiresAt = new Date(parseInt(expires));
    const now = new Date();

    if (now > expiresAt) {
      return NextResponse.json(
        {
          error: "Token expiré",
          message:
            "Le lien de retry a expiré. Veuillez refaire votre réservation.",
          expired: true,
        },
        { status: 410 }
      );
    }

    // Ici vous pourriez ajouter une validation supplémentaire du token
    // Par exemple, vérifier dans une base de données si le token existe et n'a pas été utilisé

    return NextResponse.json(
      {
        success: true,
        message: "Token valide",
        token,
        expiresAt: expiresAt.toISOString(),
        valid: true,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur lors de la validation du token:", error);
    return NextResponse.json(
      { error: "Erreur lors de la validation du token" },
      { status: 500 }
    );
  }
}
