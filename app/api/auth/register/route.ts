import { NextRequest, NextResponse } from "next/server";
import { mongoClient } from "@/lib/mongodb";
import { sendEmailVerification } from "@/lib/email";
import bcrypt from "bcryptjs";
import crypto from "crypto";

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

    // Connexion à la base de données
    const client = await mongoClient;
    const db = client.db();
    const usersCollection = db.collection("users");

    // Vérification si l'utilisateur existe déjà
    const existingUser = await usersCollection.findOne({ 
      email: email.toLowerCase() 
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Un compte avec cet email existe déjà" },
        { status: 409 }
      );
    }

    // Hachage du mot de passe
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Création du nouvel utilisateur
    const newUser = {
      firstName,
      lastName,
      email: email.toLowerCase(),
      password: hashedPassword,
      phone,
      dateOfBirth: new Date(dateOfBirth),
      countryOfResidence,
      targetCountry,
      targetCity,
      selectedServices,
      monthlyBudget: monthlyBudget || null,
      securityQuestion,
      securityAnswer: await bcrypt.hash(securityAnswer, saltRounds),
      marketingConsent: marketingConsent || false,
      kycConsent,
      roles: ["CUSTOMER"], // Rôle par défaut pour les nouveaux utilisateurs
      status: "PENDING", // Statut par défaut en attente de vérification
      isEmailVerified: false,
      createdAt: new Date(),
    };

    // Génération du token de vérification email
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 heures

    // Ajout du token à l'utilisateur
    const userWithToken = {
      ...newUser,
      emailVerificationToken,
      emailVerificationExpires,
    };

    // Sauvegarde en base de données
    const result = await usersCollection.insertOne(userWithToken);
    const savedUser = { ...userWithToken, _id: result.insertedId };

    // Envoi de l'email de vérification
    try {
      const verificationUrl = `${process.env['NEXTAUTH_URL'] || 'http://localhost:3000'}/verify-email?token=${emailVerificationToken}`;
      await sendEmailVerification(`${firstName} ${lastName}`, email, verificationUrl);
      console.log(`[REGISTER] Email de vérification envoyé à ${email}`);
    } catch (emailError) {
      console.error("[REGISTER] Erreur lors de l'envoi de l'email:", emailError);
      // On continue même si l'email échoue, l'utilisateur est créé
    }

    // Retourner les informations de l'utilisateur (sans le mot de passe)
    const userResponse = {
      id: savedUser._id.toString(),
      firstName: savedUser.firstName,
      lastName: savedUser.lastName,
      email: savedUser.email,
      phone: savedUser.phone,
      dateOfBirth: savedUser.dateOfBirth,
      countryOfResidence: savedUser.countryOfResidence,
      targetCountry: savedUser.targetCountry,
      targetCity: savedUser.targetCity,
      selectedServices: savedUser.selectedServices,
      monthlyBudget: savedUser.monthlyBudget,
      marketingConsent: savedUser.marketingConsent,
      kycConsent: savedUser.kycConsent,
      roles: savedUser.roles,
      status: savedUser.status,
      isEmailVerified: savedUser.isEmailVerified,
      createdAt: savedUser.createdAt,
    };

    return NextResponse.json(
      {
        success: true,
        user: userResponse,
        message:
          "Compte créé avec succès. Un email de vérification a été envoyé à votre adresse email. Veuillez cliquer sur le lien dans l'email pour activer votre compte.",
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
