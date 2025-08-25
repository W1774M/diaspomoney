import { connectDatabase } from "@/config/database";
import { sendPasswordResetEmail } from "@/lib/email";
import PasswordResetToken from "@/models/PasswordResetToken";
import User from "@/models/User";
import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    await connectDatabase();

    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email requis" }, { status: 400 });
    }

    // Vérifier si l'utilisateur existe
    const user = await User.findOne({ email: email.toLowerCase() });
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

    // Supprimer les anciens tokens pour cet email
    await PasswordResetToken.deleteMany({ email: email.toLowerCase() });

    // Générer un nouveau token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 heure

    // Sauvegarder le token
    const resetToken = new PasswordResetToken({
      email: email.toLowerCase(),
      token,
      expiresAt,
    });
    await resetToken.save();

    // Envoyer l'email
    try {
      await sendPasswordResetEmail(email, token, user.firstName);
    } catch (emailError) {
      console.error("Erreur envoi email:", emailError);
      // Supprimer le token si l'email n'a pas pu être envoyé
      await resetToken.deleteOne();
      return NextResponse.json(
        { error: "Erreur lors de l'envoi de l'email" },
        { status: 500 }
      );
    }

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
