// ============================================================================
// EMAIL SYSTEM (Version temporaire sans Resend)
// ============================================================================

import { Resend } from "resend";

const resend = new Resend(process.env["RESEND_API_KEY"]);
const from = process.env["SMTP_USER"] ?? "no-reply@diaspomoney.fr";
if (!from) {
  throw new Error("SMTP_USER environment variable is not set");
}

export async function sendEmailVerification(
  email: string,
  verificationUrl: string
): Promise<boolean> {
  const { subject, html } = EmailVerificationTemplate({
    name: "user",
    verificationUrl,
  });

  await resend.emails.send({
    from,
    to: email,
    subject,
    html,
  });
  console.log(`[EMAIL] Vérification envoyée à ${email}: ${verificationUrl}`);
  return true;
}

export async function sendPasswordReset(
  email: string,
  resetUrl: string
): Promise<boolean> {
  const { subject, html } = PasswordResetTemplate({ name: "user", resetUrl });

  await resend.emails.send({
    from,
    to: email,
    subject,
    html,
  });
  console.log(`[EMAIL] Reset envoyé à ${email}: ${resetUrl}`);
  return true;
}

export async function sendAppointmentConfirmation(
  email: string,
  appointmentDate: string,
  providerName: string,
  serviceName: string,
  appointmentUrl: string
): Promise<boolean> {
  const { subject, html } = AppointmentConfirmationTemplate({
    name: "user",
    appointmentDate,
    providerName,
    serviceName,
    appointmentUrl,
  });

  await resend.emails.send({
    from,
    to: email,
    subject,
    html,
  });
  console.log(`[EMAIL] Confirmation de RDV envoyée à ${email}`);
  return true;
}

// ============================================================================
// TEMPLATES (Version temporaire)
// ============================================================================

export function EmailVerificationTemplate({
  name,
  verificationUrl,
}: {
  name: string;
  verificationUrl: string;
}) {
  return {
    subject: "Vérifiez votre adresse email - Diaspomoney",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1>Vérifiez votre adresse email</h1>
        <p>Bonjour ${name},</p>
        <p>Merci de vous être inscrit sur Diaspomoney. Pour activer votre compte, 
        veuillez cliquer sur le lien ci-dessous :</p>
        <a href="${verificationUrl}" style="background: #000; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
          Vérifier mon email
        </a>
        <p>Ce lien expirera dans 24 heures.</p>
      </div>
    `,
  };
}

export function PasswordResetTemplate({
  name,
  resetUrl,
}: {
  name: string;
  resetUrl: string;
}) {
  return {
    subject: "Réinitialisation de mot de passe - Diaspomoney",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1>Réinitialisation de mot de passe</h1>
        <p>Bonjour ${name},</p>
        <p>Vous avez demandé la réinitialisation de votre mot de passe. 
        Cliquez sur le lien ci-dessous pour créer un nouveau mot de passe :</p>
        <a href="${resetUrl}" style="background: #000; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
          Réinitialiser mon mot de passe
        </a>
        <p>Ce lien expirera dans 1 heure.</p>
      </div>
    `,
  };
}

export function AppointmentConfirmationTemplate({
  name,
  appointmentDate,
  providerName,
  serviceName,
  appointmentUrl,
}: {
  name: string;
  appointmentDate: string;
  providerName: string;
  serviceName: string;
  appointmentUrl: string;
}) {
  return {
    subject: "Confirmation de rendez-vous - Diaspomoney",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1>Confirmation de rendez-vous</h1>
        <p>Bonjour ${name},</p>
        <p>Votre rendez-vous a été confirmé avec succès !</p>
        <div style="background: #f6f9fc; padding: 20px; border-radius: 4px; margin: 20px 0;">
          <p><strong>Date :</strong> ${appointmentDate}</p>
          <p><strong>Prestataire :</strong> ${providerName}</p>
          <p><strong>Service :</strong> ${serviceName}</p>
        </div>
        <a href="${appointmentUrl}" style="background: #000; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
          Voir les détails
        </a>
      </div>
    `,
  };
}
