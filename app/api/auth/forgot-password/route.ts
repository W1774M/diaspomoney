import { findUserByEmail } from "@/mocks";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email requis" }, { status: 400 });
    }

    // Vérifier si l'utilisateur existe dans les mocks
    const user = findUserByEmail(email.toLowerCase());
    if (!user) {
      // Pour des raisons de sécurité, on ne révèle pas si l'email existe ou non
      return NextResponse.json(
        {
          success: true,
          message: "Si cet email existe, vous recevrez un lien de récupération",
        },
        { status: 200 }
      );
    }

    // Pour le moment, on simule l'envoi d'email
    console.log(`Email de récupération envoyé à ${email}`);

    return NextResponse.json(
      {
        success: true,
        message: "Si cet email existe, vous recevrez un lien de récupération",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur récupération mot de passe:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
