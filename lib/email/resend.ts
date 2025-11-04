import type { EmailOptions, EmailTemplate } from '@/types/email';
import { Resend } from 'resend';

// Configuration Resend (conditionnelle)
const resend = process.env['RESEND_API_KEY'] ? new Resend(process.env['RESEND_API_KEY']) : null;

// Types importés depuis types/email.ts

// Templates d'emails
export const emailTemplates = {
  // Email de bienvenue
  welcome: (name: string, verificationUrl: string): EmailTemplate => ({
    subject: `Bienvenue sur DiaspoMoney, ${name} !`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Bienvenue sur DiaspoMoney</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f8fafc; }
            .button { display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #64748b; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Bienvenue sur DiaspoMoney !</h1>
            </div>
            <div class="content">
              <h2>Bonjour ${name},</h2>
              <p>Merci de vous être inscrit sur DiaspoMoney, la plateforme qui connecte les résidents européens aux services africains.</p>
              <p>Pour activer votre compte, veuillez cliquer sur le bouton ci-dessous :</p>
              <a href="${verificationUrl}" class="button">Vérifier mon email</a>
              <p>Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :</p>
              <p><a href="${verificationUrl}">${verificationUrl}</a></p>
              <p>Ce lien expire dans 24 heures.</p>
            </div>
            <div class="footer">
              <p>DiaspoMoney - Connecter l'Europe à l'Afrique</p>
              <p>Si vous n'avez pas créé de compte, ignorez cet email.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
      Bienvenue sur DiaspoMoney, ${name} !
      
      Merci de vous être inscrit sur DiaspoMoney, la plateforme qui connecte les résidents européens aux services africains.
      
      Pour activer votre compte, veuillez cliquer sur ce lien :
      ${verificationUrl}
      
      Ce lien expire dans 24 heures.
      
      Si vous n'avez pas créé de compte, ignorez cet email.
      
      --
      DiaspoMoney - Connecter l'Europe à l'Afrique
    `,
  }),

  // Email de réinitialisation de mot de passe
  passwordReset: (name: string, resetUrl: string): EmailTemplate => ({
    subject: 'Réinitialisation de votre mot de passe DiaspoMoney',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Réinitialisation de mot de passe</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #dc2626; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f8fafc; }
            .button { display: inline-block; padding: 12px 24px; background: #dc2626; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #64748b; font-size: 14px; }
            .warning { background: #fef2f2; border: 1px solid #fecaca; padding: 15px; border-radius: 6px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔒 Réinitialisation de mot de passe</h1>
            </div>
            <div class="content">
              <h2>Bonjour ${name},</h2>
              <p>Vous avez demandé la réinitialisation de votre mot de passe DiaspoMoney.</p>
              <p>Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :</p>
              <a href="${resetUrl}" class="button">Réinitialiser mon mot de passe</a>
              <p>Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :</p>
              <p><a href="${resetUrl}">${resetUrl}</a></p>
              <div class="warning">
                <strong>⚠️ Important :</strong> Ce lien expire dans 1 heure. Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.
              </div>
            </div>
            <div class="footer">
              <p>DiaspoMoney - Connecter l'Europe à l'Afrique</p>
              <p>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
      Réinitialisation de votre mot de passe DiaspoMoney
      
      Bonjour ${name},
      
      Vous avez demandé la réinitialisation de votre mot de passe DiaspoMoney.
      
      Cliquez sur ce lien pour créer un nouveau mot de passe :
      ${resetUrl}
      
      ⚠️ Important : Ce lien expire dans 1 heure.
      
      Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.
      
      --
      DiaspoMoney - Connecter l'Europe à l'Afrique
    `,
  }),

  // Email de confirmation de paiement
  paymentConfirmation: (
    name: string,
    amount: number,
    currency: string,
    service: string
  ): EmailTemplate => ({
    subject: `Confirmation de paiement - ${service}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Confirmation de paiement</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #059669; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f8fafc; }
            .receipt { background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0; }
            .amount { font-size: 24px; font-weight: bold; color: #059669; }
            .footer { text-align: center; padding: 20px; color: #64748b; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Paiement confirmé</h1>
            </div>
            <div class="content">
              <h2>Bonjour ${name},</h2>
              <p>Votre paiement a été traité avec succès !</p>
              <div class="receipt">
                <h3>Détails du paiement</h3>
                <p><strong>Service :</strong> ${service}</p>
                <p><strong>Montant :</strong> <span class="amount">${amount} ${currency}</span></p>
                <p><strong>Date :</strong> ${new Date().toLocaleDateString(
                  'fr-FR'
                )}</p>
                <p><strong>Statut :</strong> ✅ Confirmé</p>
              </div>
              <p>Vous pouvez maintenant accéder à votre service. Merci de votre confiance !</p>
            </div>
            <div class="footer">
              <p>DiaspoMoney - Connecter l'Europe à l'Afrique</p>
              <p>Pour toute question, contactez notre support.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
      Confirmation de paiement - ${service}
      
      Bonjour ${name},
      
      Votre paiement a été traité avec succès !
      
      Détails du paiement :
      - Service : ${service}
      - Montant : ${amount} ${currency}
      - Date : ${new Date().toLocaleDateString('fr-FR')}
      - Statut : ✅ Confirmé
      
      Vous pouvez maintenant accéder à votre service. Merci de votre confiance !
      
      --
      DiaspoMoney - Connecter l'Europe à l'Afrique
    `,
  }),

  // Email de notification de rendez-vous
  appointmentNotification: (
    name: string,
    provider: string,
    date: string,
    time: string,
    type: 'confirmation' | 'reminder'
  ): EmailTemplate => ({
    subject:
      type === 'confirmation'
        ? 'Rendez-vous confirmé'
        : 'Rappel de rendez-vous',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${
            type === 'confirmation'
              ? 'Rendez-vous confirmé'
              : 'Rappel de rendez-vous'
          }</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #7c3aed; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f8fafc; }
            .appointment { background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #64748b; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${
                type === 'confirmation'
                  ? '✅ Rendez-vous confirmé'
                  : '⏰ Rappel de rendez-vous'
              }</h1>
            </div>
            <div class="content">
              <h2>Bonjour ${name},</h2>
              <p>${
                type === 'confirmation'
                  ? 'Votre rendez-vous a été confirmé avec succès !'
                  : 'Rappel : vous avez un rendez-vous demain.'
              }</p>
              <div class="appointment">
                <h3>Détails du rendez-vous</h3>
                <p><strong>Prestataire :</strong> ${provider}</p>
                <p><strong>Date :</strong> ${date}</p>
                <p><strong>Heure :</strong> ${time}</p>
                <p><strong>Statut :</strong> ${
                  type === 'confirmation' ? '✅ Confirmé' : '⏰ À venir'
                }</p>
              </div>
              <p>Merci de votre confiance !</p>
            </div>
            <div class="footer">
              <p>DiaspoMoney - Connecter l'Europe à l'Afrique</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
      ${
        type === 'confirmation'
          ? 'Rendez-vous confirmé'
          : 'Rappel de rendez-vous'
      }
      
      Bonjour ${name},
      
      ${
        type === 'confirmation'
          ? 'Votre rendez-vous a été confirmé avec succès !'
          : 'Rappel : vous avez un rendez-vous demain.'
      }
      
      Détails du rendez-vous :
      - Prestataire : ${provider}
      - Date : ${date}
      - Heure : ${time}
      - Statut : ${type === 'confirmation' ? '✅ Confirmé' : '⏰ À venir'}
      
      Merci de votre confiance !
      
      --
      DiaspoMoney - Connecter l'Europe à l'Afrique
    `,
  }),
};

// Fonction pour nettoyer les valeurs des tags (ASCII uniquement)
function sanitizeTagValue(value: string): string {
  return value
    .replace(/[^a-zA-Z0-9_-]/g, '_') // Remplacer TOUS les caractères non-ASCII par des underscores
    .replace(/_+/g, '_') // Remplacer les underscores multiples par un seul
    .replace(/^_|_$/g, '') // Supprimer les underscores en début/fin
    .substring(0, 50); // Limiter la longueur
}

// Fonction principale d'envoi d'email
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    console.log('📧 sendEmail appelée avec options:', {
      to: options.to,
      subject: options.subject,
      from: options.from || 'DiaspoMoney <onboarding@resend.dev>',
    });

    // Nettoyer les tags pour s'assurer qu'ils sont compatibles avec Resend
    const sanitizedTags = (
      options.tags || [
        { name: 'service', value: 'diaspomoney' },
        { name: 'environment', value: process.env.NODE_ENV || 'development' },
      ]
    ).map(tag => ({
      name: sanitizeTagValue(tag.name),
      value: sanitizeTagValue(tag.value),
    }));

    console.log('🏷️ Tags nettoyés:', sanitizedTags);

    // Validation finale des tags
    const isValidTags = sanitizedTags.every(
      tag =>
        /^[a-zA-Z0-9_-]+$/.test(tag.name) && /^[a-zA-Z0-9_-]+$/.test(tag.value)
    );

    if (!isValidTags) {
      console.error('❌ Tags invalides détectés:', sanitizedTags);
      return false;
    }

    if (!resend) {
      console.warn('⚠️ Resend not configured - email not sent');
      return false;
    }

    const { data, error } = await resend.emails.send({
      from:
        options.from ||
        (process.env.NODE_ENV === 'production'
          ? 'DiaspoMoney <noreply@diaspomoney.fr>'
          : 'DiaspoMoney <onboarding@resend.dev>'),
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject,
      html: options.html,
      text: options.text ?? '', // Ensure text is always a string (Resend type requires string)
      reply_to: options.replyTo || [],
      tags: sanitizedTags,
    });

    if (error) {
      console.error('❌ Erreur Resend:', error);
      return false;
    }

    console.log('✅ Email envoyé avec succès:', data);
    return true;
  } catch (error) {
    console.error("❌ Erreur lors de l'envoi d'email:", error);
    return false;
  }
}

// Fonctions spécialisées
export async function sendWelcomeEmail(
  email: string,
  name: string,
  verificationUrl: string
): Promise<boolean> {
  // En développement, utiliser l'email autorisé par Resend
  // En production, utiliser l'email original
  const targetEmail =
    process.env.NODE_ENV === 'development'
      ? 'malarbillaudrey@gmail.com'
      : email;

  console.log('📧 Envoi email de bienvenue à:', targetEmail);
  console.log('📧 Email original:', email);

  // Test avec un template simple
  const simpleTemplate = {
    subject: `Bienvenue sur DiaspoMoney, ${name} !`,
    html: `<p>Bonjour ${name},</p><p>Bienvenue sur DiaspoMoney !</p><p><a href="${verificationUrl}">Vérifier mon email</a></p>`,
    text: `Bonjour ${name},\n\nBienvenue sur DiaspoMoney !\n\nVérifiez votre email : ${verificationUrl}`,
  };

  return await sendEmail({
    to: targetEmail,
    subject: simpleTemplate.subject,
    html: simpleTemplate.html,
    text: simpleTemplate.text,
    tags: [
      { name: 'type', value: 'welcome' },
      { name: 'user_email', value: sanitizeTagValue(email) },
    ],
  });
}

export async function sendPasswordResetEmail(
  email: string,
  name: string,
  resetUrl: string
): Promise<boolean> {
  const template = emailTemplates.passwordReset(name, resetUrl);

  return await sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
    text: template.text,
    tags: [
      { name: 'type', value: 'password_reset' },
      { name: 'user', value: sanitizeTagValue(email) },
    ],
  });
}

export async function sendPaymentConfirmationEmail(
  email: string,
  name: string,
  amount: number,
  currency: string,
  service: string
): Promise<boolean> {
  const template = emailTemplates.paymentConfirmation(
    name,
    amount,
    currency,
    service
  );

  return await sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
    text: template.text,
    tags: [
      { name: 'type', value: 'payment_confirmation' },
      { name: 'user', value: sanitizeTagValue(email) },
      { name: 'amount', value: sanitizeTagValue(amount.toString()) },
    ],
  });
}

export async function sendAppointmentNotificationEmail(
  email: string,
  name: string,
  provider: string,
  date: string,
  time: string,
  type: 'confirmation' | 'reminder'
): Promise<boolean> {
  const template = emailTemplates.appointmentNotification(
    name,
    provider,
    date,
    time,
    type
  );

  return await sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
    text: template.text,
    tags: [
      { name: 'type', value: sanitizeTagValue(`appointment_${type}`) },
      { name: 'user', value: sanitizeTagValue(email) },
      { name: 'provider', value: sanitizeTagValue(provider) },
    ],
  });
}

// Fonction de test d'envoi
export async function testEmailConnection(): Promise<boolean> {
  try {
    if (!resend) {
      console.warn('⚠️ Resend not configured - email not sent');
      return false;
    }

    const { data, error } = await resend.emails.send({
      from: 'DiaspoMoney <noreply@diaspomoney.fr>',
      to: 'test@diaspomoney.fr',
      subject: 'Test de connexion Resend',
      html: '<p>Test de connexion Resend réussi !</p>',
      text: 'Test de connexion Resend réussi !',
    });

    if (error) {
      console.error('❌ Test Resend échoué:', error);
      return false;
    }

    console.log('✅ Test Resend réussi:', data);
    return true;
  } catch (error) {
    console.error('❌ Erreur test Resend:', error);
    return false;
  }
}
