import { NextRequest, NextResponse } from "next/server";
import { mongoClient } from "@/lib/mongodb";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json(
        { error: "Token et nouveau mot de passe requis" },
        { status: 400 },
      );
    }

    // Validation du mot de passe
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Le mot de passe doit contenir au moins 8 caractères" },
        { status: 400 },
      );
    }

    // Connexion à la base de données
    const client = await mongoClient;
    const db = client.db();
    const usersCollection = db.collection("users");

    // Recherche de l'utilisateur avec le token de réinitialisation
    const user = await usersCollection.findOne({
      passwordResetToken: token,
    });

    if (!user) {
      return NextResponse.json(
        { 
          error: "Token de réinitialisation invalide",
          reason: "invalid_token",
        },
        { status: 400 },
      );
    }

    // Vérification de l'expiration du token
    if (user['passwordResetExpires'] && new Date() > user['passwordResetExpires']) {
      return NextResponse.json(
        { 
          error: "Le lien de réinitialisation a expiré",
          reason: "expired_token",
        },
        { status: 400 },
      );
    }

    // Hachage du nouveau mot de passe
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Mise à jour de l'utilisateur
    const updateResult = await usersCollection.updateOne(
      { _id: user._id },
      {
        $set: {
          password: hashedPassword,
          updatedAt: new Date(),
        },
        $unset: {
          passwordResetToken: "",
          passwordResetExpires: "",
        },
      },
    );

    if (updateResult.modifiedCount === 0) {
      return NextResponse.json(
        { error: "Erreur lors de la mise à jour du mot de passe" },
        { status: 500 },
      );
    }

    console.log(`[RESET-PASSWORD] Mot de passe réinitialisé pour l'utilisateur: ${user['email']}`);

    return NextResponse.json(
      {
        success: true,
        message: "Mot de passe réinitialisé avec succès",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Erreur lors de la réinitialisation du mot de passe:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 },
    );
  }
}
