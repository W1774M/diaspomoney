import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json({ error: "Token requis" }, { status: 400 });
    }

    // Pour le moment, on simule la vérification d'email
    console.log(`Email vérifié pour le token: ${token}`);

    return NextResponse.json(
      {
        success: true,
        message: "Email vérifié avec succès",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur lors de la vérification d'email:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
