import { config } from "@/config/env";
import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

// Configuration du transporteur email
const transporter = nodemailer.createTransport({
  host: config.smtp.host,
  port: config.smtp.port,
  secure: false, // true pour 465, false pour les autres ports
  auth: {
    user: config.smtp.user,
    pass: config.smtp.pass,
  },
  tls: {
    rejectUnauthorized: false, // Ignorer les certificats auto-signés
  },
});

// Fonction pour envoyer un email
const sendEmail = async (to: string, subject: string, html: string) => {
  // En mode développement, simuler l'envoi d'email
  if (config.isDevelopment) {
    console.log("📧 [DEV] Email simulé :", { to, subject });
    console.log("📧 [DEV] Contenu HTML :", html.substring(0, 200) + "...");
    return { messageId: "dev-" + Date.now() };
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
    const { appointment, paymentData } = body;

    // Validation des données
    if (!appointment || !paymentData) {
      return NextResponse.json(
        { error: "Données manquantes" },
        { status: 400 }
      );
    }

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

    // Génération d'un numéro de réservation unique
    const reservationNumber = `RES-${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 11)
      .toUpperCase()}`;

    // Contenu de l'email
    const emailContent = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Confirmation de réservation - DiaspoMoney</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .section { background: white; margin: 20px 0; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; }
        .highlight { background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .price { font-size: 24px; font-weight: bold; color: #667eea; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 Confirmation de réservation</h1>
            <p>Votre réservation a été confirmée avec succès !</p>
        </div>
        
        <div class="content">
            <div class="highlight">
                <h2>Numéro de réservation : ${reservationNumber}</h2>
                <p><strong>Date de réservation :</strong> ${new Date().toLocaleDateString(
                  "fr-FR"
                )}</p>
            </div>

            <div class="section">
                <h3>📅 Détails du rendez-vous</h3>
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
                <p><strong>Montant payé :</strong> <span class="price">${
                  appointment.selectedService?.price
                } €</span></p>
                <p><strong>Statut :</strong> <span style="color: green; font-weight: bold;">✅ Paiement confirmé</span></p>
            </div>

            <div class="section">
                <h3>📍 Adresse du prestataire</h3>
                <p>${
                  appointment.provider.apiGeo[0]?.display_name ||
                  "Adresse non spécifiée"
                }</p>
            </div>

            <div class="section">
                <h3>ℹ️ Informations importantes</h3>
                <ul>
                    <li>Présentez-vous 10 minutes avant l'heure du rendez-vous</li>
                    <li>Apportez une pièce d'identité</li>
                    <li>Annulation gratuite possible jusqu'à 24h avant le rendez-vous</li>
                    <li>En cas de problème, contactez-nous au support</li>
                </ul>
            </div>

            <div style="text-align: center; margin: 30px 0;">
                <a href="https://diaspomoney.fr" class="button">Accéder à mon espace client</a>
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

    // Envoi de l'email
    const subject = `Confirmation de réservation - ${reservationNumber} - DiaspoMoney`;

    // Envoi à contact@diaspomoney.fr
    await sendEmail(
      process.env["EMAIL_CONTACT"] || "contact@diaspomoney.fr",
      subject,
      emailContent
    );

    // Envoi au client
    await sendEmail(appointment.requester.email, subject, emailContent);

    return NextResponse.json(
      {
        success: true,
        message: "Email de confirmation envoyé avec succès",
        reservationNumber,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'email:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'envoi de l'email" },
      { status: 500 }
    );
  }
}
