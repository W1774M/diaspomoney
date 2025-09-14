import { MOCK_USERS } from "@/mocks";
import { IUser } from "@/types";
import { NextRequest, NextResponse } from "next/server";

function findUserByEmail(email: string): IUser | undefined {
  return MOCK_USERS.find(
    user => user.email.toLowerCase() === email.toLowerCase()
  );
}

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

    // Recherche de l'utilisateur
    const user = findUserByEmail(email);

    if (!user) {
      return NextResponse.json(
        { error: "Email ou mot de passe incorrect" },
        { status: 401 }
      );
    }

    // Vérification du mot de passe (simulation)
    if (password !== user.password) {
      return NextResponse.json(
        { error: "Email ou mot de passe incorrect" },
        { status: 401 }
      );
    }

    // Vérification du statut du compte
    if (user.status === "INACTIVE") {
      return NextResponse.json(
        {
          error:
            "Compte inactif. Veuillez vérifier votre email pour activer votre compte.",
          status: "INACTIVE",
        },
        { status: 403 }
      );
    }

    if (user.status === "PENDING") {
      return NextResponse.json(
        {
          error:
            "Votre compte est en cours de vérification par notre équipe. Veuillez patienter.",
          status: "PENDING",
        },
        { status: 403 }
      );
    }

    if (user.status === "SUSPENDED") {
      return NextResponse.json(
        {
          error: "Votre compte a été suspendu. Accès refusé.",
          status: "SUSPENDED",
        },
        { status: 403 }
      );
    }

    // Connexion réussie
    const { password: _, ...userWithoutPassword } = user;

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
