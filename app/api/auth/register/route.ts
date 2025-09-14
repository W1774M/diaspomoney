import { NextRequest, NextResponse } from "next/server";
import { MOCK_USERS } from "@/mocks";
import { IUser } from "@/types";

function findUserByEmail(email: string): IUser | undefined {
  return MOCK_USERS.find(
    user => user.email.toLowerCase() === email.toLowerCase()
  );
}

export async function POST(request: NextRequest) {
  try {
    // Récupération des données du body
    const {
      firstName,
      lastName,
      email,
      password,
      phone,
      dateOfBirth,
      countryOfResidence,
      targetCountry,
      targetCity,
      selectedServices,
      monthlyBudget,
      securityQuestion,
      securityAnswer,
      termsAccepted,
      marketingConsent,
      kycConsent,
    } = await request.json();

    // Validation des données
    if (
      !firstName ||
      !lastName ||
      !email ||
      !password ||
      !phone ||
      !dateOfBirth ||
      !countryOfResidence ||
      !targetCountry ||
      !targetCity ||
      !selectedServices ||
      !securityQuestion ||
      !securityAnswer ||
      !termsAccepted ||
      !kycConsent
    ) {
      return NextResponse.json(
        { error: "Tous les champs obligatoires doivent être remplis" },
        { status: 400 }
      );
    }

    // Vérification de la longueur du mot de passe
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Le mot de passe doit contenir au moins 8 caractères" },
        { status: 400 }
      );
    }

    // Vérification de l'âge (18 ans minimum)
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    if (age < 18) {
      return NextResponse.json(
        { error: "Vous devez avoir au moins 18 ans pour créer un compte" },
        { status: 400 }
      );
    }

    // Vérification si l'utilisateur existe déjà dans les mocks
    const existingUser = findUserByEmail(email.toLowerCase());

    if (existingUser) {
      return NextResponse.json(
        { error: "Un compte avec cet email existe déjà" },
        { status: 409 }
      );
    }

    // Pour le moment, on simule la création d'utilisateur
    console.log(`Nouvel utilisateur créé: ${email}`);

    // Retourner les informations de l'utilisateur simulé avec les valeurs par défaut
    const userResponse = {
      id: `user_${Date.now()}`,
      firstName,
      lastName,
      email: email.toLowerCase(),
      phone,
      dateOfBirth,
      countryOfResidence,
      targetCountry,
      targetCity,
      selectedServices,
      monthlyBudget,
      marketingConsent: marketingConsent || false,
      kycConsent,
      roles: ["CUSTOMER"], // Rôle par défaut pour les nouveaux utilisateurs
      status: "PENDING", // Statut par défaut en attente de vérification
      isEmailVerified: false,
      createdAt: new Date(),
    };

    return NextResponse.json(
      {
        success: true,
        user: userResponse,
        message:
          "Compte créé avec succès. Vérifiez votre email pour activer votre compte.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erreur lors de l'inscription:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
