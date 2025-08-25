import { connectDatabase } from "@/config/database";
import EmailVerificationToken from "@/models/EmailVerificationToken";
import User from "@/models/User";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    await connectDatabase();

    const { token } = await request.json();

    if (!token) {
      return NextResponse.json({ error: "Token requis" }, { status: 400 });
    }

    // Vérifier le token
    const verificationToken = await EmailVerificationToken.findOne({
      token,
      used: false,
      expiresAt: { $gt: new Date() },
    });

    if (!verificationToken) {
      return NextResponse.json(
        { error: "Token invalide ou expiré" },
        { status: 400 }
      );
    }

    // Trouver l'utilisateur
    const user = await User.findOne({ email: verificationToken.email });
    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }

    // Marquer l'email comme vérifié
    user.isEmailVerified = true;
    await user.save();

    // Marquer le token comme utilisé
    verificationToken.used = true;
    await verificationToken.save();

    return NextResponse.json(
      {
        success: true,
        message: "Email vérifié avec succès",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur vérification email:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
