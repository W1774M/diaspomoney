// ============================================================================
// EMAIL SYSTEM (Version temporaire sans Resend)
// ============================================================================

import { AppointmentConfirmationTemplate, EmailVerificationTemplate, PasswordResetTemplate } from "@/template/EmailTemplate";
import { Resend } from "resend";

const resend = new Resend(process.env["RESEND_API_KEY"]);
const from = process.env["SMTP_USER"] ?? "no-reply@diaspomoney.fr";
if (!from) {
  throw new Error("SMTP_USER environment variable is not set");
}

export async function  sendEmailVerification(
  name: string,
  email: string,
  verificationUrl: string,
): Promise<boolean> {

  try {
  const { subject, html } = EmailVerificationTemplate({
    name,
    verificationUrl,
  });

  const { data, error } = await resend.emails.send({
    from,
    to: email,
    subject,
    html,
  });
  if (error) {
    console.error(`[EMAIL] Erreur lors de l'envoi de l'email:`, error);
    return false;
  }
  console.log(`[EMAIL] Vérification envoyée à ${email}: ${verificationUrl}`);
  console.log(`[EMAIL] Email envoyé avec succès: ${data}`);
  
  return true;
  } catch (error) {
    console.error(`[EMAIL] Erreur lors de l'envoi de l'email:`, error);
    return false;
  }
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

export async function sendPasswordResetEmail(email: string, resetToken: string) {
  const resetUrl = `${process.env["NEXTAUTH_URL"]}/reset-password?token=${resetToken}`;

  const { subject, html } = PasswordResetTemplate({ name: "user", resetUrl });
  // const subject = "Réinitialisation de votre mot de passe - DiaspoMoney";
  // const html = PasswordResetTemplate({ name: "user", resetUrl });
  /*const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">DiaspoMoney</h1>
        <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Réinitialisation de mot de passe</p>
      </div>
      
      <div style="padding: 40px 30px; background: #f8f9fa;">
        <h2 style="color: #333; margin: 0 0 20px 0;">Bonjour,</h2>
        
        <p style="color: #666; line-height: 1.6; margin: 0 0 20px 0;">
          Vous avez demandé la réinitialisation de votre mot de passe. Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" 
             style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                    color: white; 
                    padding: 15px 30px; 
                    text-decoration: none; 
                    border-radius: 8px; 
                    display: inline-block; 
                    font-weight: bold;
                    font-size: 16px;">
            Réinitialiser mon mot de passe
          </a>
        </div>
        
        <p style="color: #666; line-height: 1.6; margin: 20px 0 0 0; font-size: 14px;">
          Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :<br>
          <a href="${resetUrl}" style="color: #667eea; word-break: break-all;">${resetUrl}</a>
        </p>
        
        <div style="margin-top: 30px; padding: 20px; background: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px;">
          <p style="color: #856404; margin: 0; font-size: 14px;">
            <strong>Important :</strong> Ce lien expire dans 1 heure. Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.
          </p>
        </div>
      </div>
      
      <div style="background: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #dee2e6;">
        <p style="color: #6c757d; margin: 0; font-size: 14px;">
          © 2024 DiaspoMoney. Tous droits réservés.
        </p>
      </div>
    </div>
  `;*/

  // Utilisation de Resend pour envoyer l'email
  // Assurez-vous d'avoir initialisé l'instance resend ailleurs, par exemple :
  // import { Resend } from 'resend';
  // const resend = new Resend(process.env.RESEND_API_KEY);

  await resend.emails.send({
    from,
    to: email,
    subject,
    html,
  });
  console.log(`[EMAIL] Email de réinitialisation envoyé à ${email}`);
  return true;
}