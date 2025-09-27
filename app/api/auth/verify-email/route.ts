import { NextRequest, NextResponse } from "next/server";
import { mongoClient } from "@/lib/mongodb";

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json({ error: "Token requis" }, { status: 400 });
    }

    // Connexion à la base de données
    const client = await mongoClient;
    const db = client.db();
    const usersCollection = db.collection("users");

    // Recherche de l'utilisateur avec le token de vérification
    const user = await usersCollection.findOne({
      emailVerificationToken: token,
    });

    if (!user) {
      return NextResponse.json(
        { 
          error: "Token de vérification invalide",
          reason: "invalid",
        },
        { status: 400 }
      );
    }

    // Vérification de l'expiration du token
    if (user['emailVerificationExpires'] && new Date() > user['emailVerificationExpires']) {
      return NextResponse.json(
        { 
          error: "Le lien de vérification a expiré",
          reason: "expired",
        },
        { status: 400 }
      );
    }

    // Vérification si l'email est déjà vérifié
    if (user['isEmailVerified']) {
      return NextResponse.json(
        { 
          error: "Cet email a déjà été vérifié",
          reason: "already_verified",
        },
        { status: 400 }
      );
    }

    // Mise à jour de l'utilisateur
    const updateResult = await usersCollection.updateOne(
      { _id: user._id },
      {
        $set: {
          isEmailVerified: true,
          status: "ACTIVE", // Changement du statut de PENDING à ACTIVE
          emailVerifiedAt: new Date(),
        },
        $unset: {
          emailVerificationToken: "",
          emailVerificationExpires: "",
        },
      }
    );

    if (updateResult.modifiedCount === 0) {
      return NextResponse.json(
        { error: "Erreur lors de la mise à jour du compte" },
        { status: 500 }
      );
    }

    console.log(`[VERIFY-EMAIL] Email vérifié avec succès pour ${user['email']}`);

    return NextResponse.json(
      {
        success: true,
        message: "Email vérifié avec succès",
        email: user['email'],
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Erreur lors de la vérification d'email:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 },
    );
  }
}
