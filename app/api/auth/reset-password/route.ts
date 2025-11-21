import { handleApiRoute, validateBody } from '@/lib/api/error-handler';
// Désactiver le prerendering pour cette route API
export const dynamic = 'force-dynamic';

// Désactiver le prerendering pour cette route API


import { ResetPasswordSchema, type ResetPasswordInput } from '@/lib/validations/auth.schema';
import { NextRequest, NextResponse } from "next/server";
import { mongoClient } from "@/lib/mongodb";
import bcrypt from "bcryptjs";
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  return handleApiRoute(request, async () => {
    // Validation avec Zod
    const body = await request.json();
    const data: ResetPasswordInput = validateBody(body, ResetPasswordSchema);
    
    const { token, password } = data;

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

    logger.info({ email: user['email'] }, 'Password reset successfully');

    return NextResponse.json(
      {
        success: true,
        message: "Mot de passe réinitialisé avec succès",
      },
      { status: 200 },
    );
  }, 'api/auth/reset-password');
}
