import { sendEmailVerification } from "@/lib/email";
import { mongoClient } from "@/lib/mongodb";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";

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
      oauth,
      isSimplifiedRegistration,
    } = await request.json();

    // Validation des données
    const requiredFields = [
      !firstName,
      !lastName,
      !email,
      !oauth && !password,
      !phone,
      !countryOfResidence,
      !oauth && (!securityQuestion || !securityAnswer),
      !termsAccepted,
    ];

    // Pour l'inscription simplifiée, les champs de destination et services ne sont pas obligatoires
    if (!isSimplifiedRegistration) {
      requiredFields.push(
        !dateOfBirth,
        !targetCountry,
        !targetCity,
        !selectedServices
      );
      // kycConsent n'est obligatoire que s'il est fourni dans la requête
      if (kycConsent !== undefined) {
        requiredFields.push(!kycConsent);
      }
    }

    if (requiredFields.some(field => field)) {
      return NextResponse.json(
        { error: "Tous les champs obligatoires doivent être remplis" },
        { status: 400 }
      );
    }

    // Vérification de la longueur du mot de passe
    if (!oauth && password.length < 8) {
      return NextResponse.json(
        { error: "Le mot de passe doit contenir au moins 8 caractères" },
        { status: 400 }
      );
    }

    // Vérification de l'âge (18 ans minimum) - seulement si dateOfBirth est fournie
    if (dateOfBirth) {
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
    }

    // Connexion à la base de données
    const client = await mongoClient;
    const db = client.db();
    const usersCollection = db.collection("users");

    // Vérification si l'utilisateur existe déjà
    const existingUser = await usersCollection.findOne({
      email: email.toLowerCase(),
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Un compte avec cet email existe déjà" },
        { status: 409 }
      );
    }

    // Hachage du mot de passe
    const saltRounds = 12;
    const hashedPassword = password
      ? await bcrypt.hash(password, saltRounds)
      : undefined;

    // Création du nouvel utilisateur
    const newUser: any = {
      firstName,
      lastName,
      email: email.toLowerCase(),
      ...(hashedPassword ? { password: hashedPassword } : {}),
      phone,
      ...(dateOfBirth ? { dateOfBirth: new Date(dateOfBirth) } : {}),
      countryOfResidence,
      ...(targetCountry ? { targetCountry } : {}),
      ...(targetCity ? { targetCity } : {}),
      ...(selectedServices ? { selectedServices } : {}),
      ...(monthlyBudget ? { monthlyBudget } : {}),
      securityQuestion,
      securityAnswer: await bcrypt.hash(securityAnswer, saltRounds),
      marketingConsent: marketingConsent || false,
      ...(kycConsent ? { kycConsent } : {}),
      roles: ["CUSTOMER"], // Rôle par défaut pour les nouveaux utilisateurs
      status: oauth ? "ACTIVE" : "PENDING", // Activer directement si OAuth
      isEmailVerified: !!oauth,
      createdAt: new Date(),
    };

    // Si inscription via OAuth, marquer le provider comme lié et email vérifié
    if (oauth && oauth.provider) {
      newUser.oauth = newUser.oauth || {};
      newUser.oauth[oauth.provider] = {
        linked: true,
        providerAccountId: oauth.providerAccountId,
      };
      newUser.emailVerified = true;
    }

    // Génération du token de vérification email (sauf OAuth)
    const userWithToken = (() => {
      if (oauth) return newUser;
      const emailVerificationToken = crypto.randomBytes(32).toString("hex");
      const emailVerificationExpires = new Date(
        Date.now() + 24 * 60 * 60 * 1000
      );
      return {
        ...newUser,
        emailVerificationToken,
        emailVerificationExpires,
      };
    })();

    // Sauvegarde en base de données
    const result = await usersCollection.insertOne(userWithToken);
    const savedUser = { ...userWithToken, _id: result.insertedId };

    // Envoi de l'email de vérification uniquement hors OAuth
    if (!oauth) {
      try {
        const verificationUrl = `${
          process.env["NEXTAUTH_URL"] || "http://localhost:3000"
        }/verify-email?token=${(userWithToken as any).emailVerificationToken}`;
        await sendEmailVerification(
          `${firstName} ${lastName}`,
          email,
          verificationUrl
        );
        console.log(`[REGISTER] Email de vérification envoyé à ${email}`);
      } catch (emailError) {
        console.error(
          "[REGISTER] Erreur lors de l'envoi de l'email:",
          emailError
        );
        // On continue même si l'email échoue, l'utilisateur est créé
      }
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
        message: isSimplifiedRegistration
          ? "Compte créé avec succès ! Votre réservation est confirmée."
          : oauth
          ? "Compte créé et activé via OAuth. Bienvenue !"
          : "Compte créé avec succès. Un email de vérification a été envoyé à votre adresse email.",
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
