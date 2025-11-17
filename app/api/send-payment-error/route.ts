import { config } from "@/config/env";
import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

// Configuration du transporteur email
const transporter = nodemailer.createTransport({
  host: config.smtp.host,
  port: config.smtp.port,
  secure: false,
  auth: {
    user: config.smtp.user,
    pass: config.smtp.pass,
  },
  tls: {
    rejectUnauthorized: false, // Ignorer les certificats auto-signés
  },
});

// Fonction pour générer un token de retry valide 15 minutes
const generateRetryToken = () => {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
  return { token, expiresAt };
};

// Fonction pour envoyer un email
const sendEmail = async (to: string, subject: string, html: string) => {
  // En mode développement, simuler l'envoi d'email
  if (config.isDevelopment) {
    console.log("📧 [DEV] Email simulé :", { to, subject });
    console.log("📧 [DEV] Contenu HTML :", `${html.substring(0, 200)  }...`);
    return { messageId: `dev-${  Date.now()}` };
  }

  return await transporter.sendMail({
    from: config.smtp.user,
    to,
    subject,
    html,
  });
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      appointment,
      paymentData,
      errorMessage = "Erreur lors du traitement du paiement",
    } = body;

    // Validation des données
    if (!appointment || !paymentData) {
      return NextResponse.json(
        { error: "Données manquantes" },
        { status: 400 },
      );
    }

    // Génération du token de retry
    const { token, expiresAt } = generateRetryToken();

    // URL de retry (à adapter selon votre structure)
    const retryUrl = `${
      process.env["NEXT_PUBLIC_APP_URL"] || "http://localhost:3000"
    }/providers/${
      appointment.provider.id
    }?retry=${token}&expires=${expiresAt.getTime()}`;

    // Formatage de la date
    const formattedDate = appointment.timeslot
      ? new Date(appointment.timeslot).toLocaleDateString("fr-FR", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "Non spécifié";

    // Email pour contact@diaspomoney.fr
    const adminEmailContent = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Erreur de paiement - DiaspoMoney</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .section { background: white; margin: 20px 0; padding: 20px; border-radius: 8px; border-left: 4px solid #dc2626; }
        .highlight { background: #fef2f2; padding: 15px; border-radius: 5px; margin: 15px 0; border: 1px solid #fecaca; }
        .price { font-size: 24px; font-weight: bold; color: #dc2626; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        .error-details { background: #fee2e2; padding: 15px; border-radius: 5px; margin: 15px 0; border: 1px solid #fca5a5; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>⚠️ Erreur de paiement détectée</h1>
            <p>Une erreur s'est produite lors du traitement d'un paiement</p>
        </div>
        
        <div class="content">
            <div class="highlight">
                <h2>🚨 Action requise</h2>
                <p><strong>Date de l'erreur :</strong> ${new Date().toLocaleDateString(
                  "fr-FR",
                )} à ${new Date().toLocaleTimeString("fr-FR")}</p>
                <p><strong>Erreur :</strong> ${errorMessage}</p>
            </div>

            <div class="section">
                <h3>📅 Détails de la réservation</h3>
                <p><strong>Service :</strong> ${
                  appointment.selectedService?.name
                }</p>
                <p><strong>Prestataire :</strong> ${
                  appointment.provider.name
                }</p>
                <p><strong>Date et heure :</strong> ${formattedDate}</p>
                <p><strong>Prix :</strong> <span class="price">${
                  appointment.selectedService?.price
                } €</span></p>
            </div>

            <div class="section">
                <h3>👤 Informations du demandeur</h3>
                <p><strong>Nom :</strong> ${appointment.requester.firstName} ${
                  appointment.requester.lastName
                }</p>
                <p><strong>Téléphone :</strong> ${
                  appointment.requester.phone
                }</p>
                <p><strong>Email :</strong> ${appointment.requester.email}</p>
            </div>

            <div class="section">
                <h3>👥 Informations du bénéficiaire</h3>
                <p><strong>Nom :</strong> ${appointment.recipient.firstName} ${
                  appointment.recipient.lastName
                }</p>
                <p><strong>Téléphone :</strong> ${
                  appointment.recipient.phone
                }</p>
            </div>

            <div class="section">
                <h3>💳 Informations de paiement</h3>
                <p><strong>Méthode :</strong> Carte bancaire</p>
                <p><strong>Titulaire :</strong> ${
                  paymentData.cardholderName
                }</p>
                <p><strong>Montant :</strong> <span class="price">${
                  appointment.selectedService?.price
                } €</span></p>
                <p><strong>Statut :</strong> <span style="color: #dc2626; font-weight: bold;">❌ Échec du paiement</span></p>
            </div>

            <div class="error-details">
                <h3>🔍 Détails techniques de l'erreur</h3>
                <p><strong>Message d'erreur :</strong> ${errorMessage}</p>
                <p><strong>Timestamp :</strong> ${new Date().toISOString()}</p>
                <p><strong>Provider ID :</strong> ${appointment.provider.id}</p>
                <p><strong>Service ID :</strong> ${
                  appointment.selectedService?.id
                }</p>
            </div>

            <div class="section">
                <h3>📍 Adresse du prestataire</h3>
                <p>${
                  appointment.provider.apiGeo[0]?.display_name ||
                  "Adresse non spécifiée"
                }</p>
            </div>
        </div>

        <div class="footer">
            <p>Ce message a été envoyé automatiquement par DiaspoMoney</p>
            <p>Pour toute question, contactez l'équipe technique</p>
            <p>© 2024 DiaspoMoney - Tous droits réservés</p>
        </div>
    </div>
</body>
</html>
    `;

    // Email pour le client
    const clientEmailContent = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Problème de paiement - DiaspoMoney</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .section { background: white; margin: 20px 0; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b; }
        .highlight { background: #fffbeb; padding: 15px; border-radius: 5px; margin: 15px 0; border: 1px solid #fed7aa; }
        .price { font-size: 24px; font-weight: bold; color: #f59e0b; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        .button { display: inline-block; background: #f59e0b; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: bold; font-size: 16px; }
        .warning { background: #fef3c7; padding: 15px; border-radius: 5px; margin: 15px 0; border: 1px solid #fde68a; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>⚠️ Problème de paiement</h1>
            <p>Nous avons rencontré un problème lors du traitement de votre paiement</p>
        </div>
        
        <div class="content">
            <div class="highlight">
                <h2>🔄 Réessayer le paiement</h2>
                <p>Votre réservation n'a pas été confirmée en raison d'un problème technique. Vous pouvez réessayer le paiement en cliquant sur le bouton ci-dessous.</p>
                <p><strong>⚠️ Important :</strong> Ce lien est valide pendant 15 minutes seulement.</p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
                <a href="${retryUrl}" class="button">🔄 Réessayer le paiement</a>
            </div>

            <div class="warning">
                <h3>⏰ Lien valide 15 minutes</h3>
                <p>Ce lien expirera le <strong>${expiresAt.toLocaleString(
                  "fr-FR",
                )}</strong></p>
                <p>Si le lien expire, vous devrez refaire votre réservation.</p>
            </div>

            <div class="section">
                <h3>📅 Détails de votre réservation</h3>
                <p><strong>Service :</strong> ${
                  appointment.selectedService?.name
                }</p>
                <p><strong>Prestataire :</strong> ${
                  appointment.provider.name
                }</p>
                <p><strong>Date et heure :</strong> ${formattedDate}</p>
                <p><strong>Prix :</strong> <span class="price">${
                  appointment.selectedService?.price
                } €</span></p>
            </div>

            <div class="section">
                <h3>📍 Adresse du prestataire</h3>
                <p>${
                  appointment.provider.apiGeo[0]?.display_name ||
                  "Adresse non spécifiée"
                }</p>
            </div>

            <div class="section">
                <h3>ℹ️ Que s'est-il passé ?</h3>
                <p>Un problème technique temporaire a empêché le traitement de votre paiement. Cela peut être dû à :</p>
                <ul>
                    <li>Une interruption temporaire de notre service de paiement</li>
                    <li>Un problème de connexion</li>
                    <li>Une validation bancaire en cours</li>
                </ul>
                <p><strong>Rassurez-vous, votre carte n'a pas été débitée.</strong></p>
            </div>

            <div class="section">
                <h3>📞 Besoin d'aide ?</h3>
                <p>Si vous rencontrez des difficultés ou si le problème persiste :</p>
                <ul>
                    <li>Contactez notre support : contact@diaspomoney.fr</li>
                    <li>Appelez-nous au support client</li>
                    <li>Consultez notre FAQ en ligne</li>
                </ul>
            </div>
        </div>

        <div class="footer">
            <p>Ce message a été envoyé automatiquement par DiaspoMoney</p>
            <p>Pour toute question, contactez-nous à contact@diaspomoney.fr</p>
            <p>© 2024 DiaspoMoney - Tous droits réservés</p>
        </div>
    </div>
</body>
</html>
    `;

    // Envoi des emails
    const adminSubject = `🚨 Erreur de paiement - ${appointment.provider.name} - DiaspoMoney`;
    const clientSubject = `⚠️ Problème de paiement - Réessayez votre réservation - DiaspoMoney`;

    // Envoi à l'équipe DiaspoMoney
    await sendEmail(
      process.env["EMAIL_CONTACT"] || "contact@diaspomoney.fr",
      adminSubject,
      adminEmailContent,
    );

    // Envoi au client
    await sendEmail(
      appointment.requester.email,
      clientSubject,
      clientEmailContent,
    );

    return NextResponse.json(
      {
        success: true,
        message: "Emails d'erreur de paiement envoyés avec succès",
        retryToken: token,
        expiresAt: expiresAt.toISOString(),
        retryUrl: retryUrl,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Erreur lors de l'envoi des emails d'erreur:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'envoi des emails d'erreur" },
      { status: 500 },
    );
  }
}
