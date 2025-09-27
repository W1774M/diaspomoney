import { NextRequest, NextResponse } from "next/server";
import { mongoClient } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Validation des données
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email et mot de passe requis" },
        { status: 400 }
      );
    }

    // Connexion à la base de données
    const client = await mongoClient;
    const db = client.db();
    const usersCollection = db.collection("users");

    // Recherche de l'utilisateur par email (insensible à la casse)
    const user = await usersCollection.findOne({
      email: email.toLowerCase(),
    });

    console.log(`[LOGIN] Tentative de connexion pour: ${email}`);
    console.log(`[LOGIN] Utilisateur trouvé:`, user ? "Oui" : "Non");
    
    if (!user) {
      console.log(`[LOGIN] Utilisateur non trouvé pour: ${email}`);
      return NextResponse.json(
        { error: "Email ou mot de passe incorrect" },
        { status: 401 }
      );
    }

    console.log(`[LOGIN] Statut utilisateur: ${user['status']}`);
    console.log(`[LOGIN] Email vérifié: ${user['isEmailVerified']}`);

    // Vérification du mot de passe avec bcrypt
    const isPasswordValid = await bcrypt.compare(password, user['password']);
    console.log(`[LOGIN] Mot de passe valide: ${isPasswordValid}`);
    
    if (!isPasswordValid) {
      console.log(`[LOGIN] Mot de passe incorrect pour: ${email}`);
      return NextResponse.json(
        { error: "Email ou mot de passe incorrect" },
        { status: 401 }
      );
    }

    // Vérification du statut du compte
    if (user['status'] === "INACTIVE") {
      return NextResponse.json(
        {
          error:
            "Compte inactif. Veuillez vérifier votre email pour activer votre compte.",
          status: "INACTIVE",
        },
        { status: 403 }
      );
    }

    if (user['status'] === "PENDING") {
      return NextResponse.json(
        {
          error:
            "Votre compte est en cours de vérification par notre équipe. Veuillez patienter.",
          status: "PENDING",
        },
        { status: 403 }
      );
    }

    if (user['status'] === "SUSPENDED") {
      return NextResponse.json(
        {
          error: "Votre compte a été suspendu. Accès refusé.",
          status: "SUSPENDED",
        },
        { status: 403 }
      );
    }

    // Connexion réussie
    // On retire le mot de passe du retour
    // (et potentiellement d'autres champs sensibles)
    // On convertit _id en string pour le front
    const { password: _, ...userWithoutPassword } = user;
    if (userWithoutPassword._id && typeof userWithoutPassword._id !== "string") {
      userWithoutPassword._id = userWithoutPassword._id.toString() as unknown as ObjectId;
    }

    console.log(`[LOGIN] Connexion réussie pour: ${email}`);
    
    return NextResponse.json({
      success: true,
      user: userWithoutPassword,
      message: "Connexion réussie",
    });
  } catch (error) {
    console.error("Erreur lors de la connexion:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
