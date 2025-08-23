import { connectDatabase } from "@/config/database";
import { sendEmailVerification } from "@/lib/email";
import EmailVerificationToken from "@/models/EmailVerificationToken";
import User from "@/models/User";
import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    // Connexion à la base de données
    await connectDatabase();

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
    const age = today.getFullYear() - birthDate.getFullYear();
    if (age < 18) {
      return NextResponse.json(
        { error: "Vous devez avoir au moins 18 ans pour créer un compte" },
        { status: 400 }
      );
    }

    // Vérification si l'utilisateur existe déjà
    const existingUser = await User.findOne({ email: email.toLowerCase() });

    if (existingUser) {
      return NextResponse.json(
        { error: "Un compte avec cet email existe déjà" },
        { status: 409 }
      );
    }

    // Création du nouvel utilisateur avec tous les nouveaux champs
    const newUser = new User({
      firstName,
      lastName,
      email: email.toLowerCase(),
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
      marketingConsent: marketingConsent || false,
      kycConsent,
      role: "user",
      isEmailVerified: false,
    });

    // Sauvegarde de l'utilisateur
    await newUser.save();

    // Générer un token de vérification d'email
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 heures

    // Sauvegarder le token
    const emailToken = new EmailVerificationToken({
      email: email.toLowerCase(),
      token: verificationToken,
      expiresAt,
    });
    await emailToken.save();

    // Envoyer l'email de vérification
    try {
      await sendEmailVerification(email, verificationToken, firstName);
    } catch (emailError) {
      console.error("Erreur envoi email de vérification:", emailError);
      // Ne pas bloquer l'inscription si l'email échoue
    }

    // Retourner les informations de l'utilisateur (sans le mot de passe)
    const userResponse = {
      id: newUser._id,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      email: newUser.email,
      phone: newUser.phone,
      dateOfBirth: newUser.dateOfBirth,
      countryOfResidence: newUser.countryOfResidence,
      targetCountry: newUser.targetCountry,
      targetCity: newUser.targetCity,
      selectedServices: newUser.selectedServices,
      monthlyBudget: newUser.monthlyBudget,
      marketingConsent: newUser.marketingConsent,
      kycConsent: newUser.kycConsent,
      role: newUser.role,
      isEmailVerified: newUser.isEmailVerified,
      createdAt: newUser.createdAt,
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
