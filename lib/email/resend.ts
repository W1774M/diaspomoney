/**
 * Implémente les design patterns :
 * - Service Layer Pattern
 * - Logger Pattern (structured logging avec childLogger)
 * - Error Handling Pattern (Sentry)
 * - Retry Pattern (via @Retry decorator)
 */

import { Retry, RetryHelpers } from '@/lib/decorators/retry.decorator';
import { childLogger } from '@/lib/logger';
import type { EmailOptions, EmailTemplate } from '@/lib/types';
import * as Sentry from '@sentry/nextjs';
import { Resend } from 'resend';
import { welcomeTemplate, passwordResetTemplate, accountActivationTemplate, loginSuccessTemplate, paymentConfirmationTemplate, bookingTakeChargeTemplate, paymentLinkTemplate, providerAssignmentTemplate } from './templates';

const log = childLogger({ component: 'EmailService' });

// Configuration Resend (conditionnelle)
const resend = process.env['RESEND_API_KEY']
  ? new Resend(process.env['RESEND_API_KEY'])
  : null;

// Templates d'emails (utilisant les templates séparés)
export const emailTemplates = {
  // Email de bienvenue
  welcome: (name: string, verificationUrl: string, loginUrl?: string): EmailTemplate => 
    welcomeTemplate(name, verificationUrl, loginUrl),
  
  // Email de réinitialisation de mot de passe
  passwordReset: (name: string, resetUrl: string): EmailTemplate => 
    passwordResetTemplate(name, resetUrl),
  
  // Email d'activation de compte
  accountActivation: (name: string, activationUrl: string): EmailTemplate => 
    accountActivationTemplate(name, activationUrl),
  
  // Templates existants (à migrer progressivement vers des fichiers séparés)
  // Email de confirmation de paiement
  paymentConfirmation: (
    name: string,
    amount: number,
    currency: string,
    service: string,
  ): EmailTemplate =>
    paymentConfirmationTemplate(name, amount, currency, service),

  // Email de notification de rendez-vous
  appointmentNotification: (
    name: string,
    provider: string,
    date: string,
    time: string,
    type: 'confirmation' | 'reminder',
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

  // Email de confirmation de prise en charge
  bookingTakeCharge: (
    name: string,
    reservationNumber: string,
    serviceName: string,
    amount?: string | number,
    currency?: string,
  ): EmailTemplate =>
    bookingTakeChargeTemplate(name, reservationNumber, serviceName, amount, currency),

  // Email de lien de paiement
  paymentLink: (
    name: string,
    reservationNumber: string,
    serviceName: string,
    amount: string | number,
    currency: string,
    paymentUrl: string,
  ): EmailTemplate =>
    paymentLinkTemplate(name, reservationNumber, serviceName, amount, currency, paymentUrl),

  // Email d'attribution de réservation à un prestataire externe (non enregistré)
  providerAssignment: (params: Parameters<typeof providerAssignmentTemplate>[0]): EmailTemplate =>
    providerAssignmentTemplate(params),
};

// Fonction pour nettoyer les valeurs des tags (ASCII uniquement)
function sanitizeTagValue(value: string): string {
  return value
    .replace(/[^a-zA-Z0-9_-]/g, '_') // Remplacer TOUS les caractères non-ASCII par des underscores
    .replace(/_+/g, '_') // Remplacer les underscores multiples par un seul
    .replace(/^_|_$/g, '') // Supprimer les underscores en début/fin
    .substring(0, 50); // Limiter la longueur
}

// Classe wrapper pour utiliser le decorator
class EmailSender {
  @Retry({
    maxAttempts: 3,
    delay: 2000,
    backoff: 'exponential',
    shouldRetry: RetryHelpers.retryOnNetworkOrServerError,
  })
  async send(options: EmailOptions): Promise<boolean> {
    return await sendEmailInternal(options);
  }
}

const emailSender = new EmailSender();

// Fonction principale d'envoi d'email avec retry
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  return await emailSender.send(options);
}

// Fonction interne sans decorator pour éviter la récursion
async function sendEmailInternal(options: EmailOptions): Promise<boolean> {
  try {
    log.debug(
      {
        to: options.to,
        subject: options.subject,
        from: options.from || 'DiaspoMoney <onboarding@resend.dev>',
      },
      '📧 sendEmail appelée avec options',
    );

    // Nettoyer les tags pour s'assurer qu'ils sont compatibles avec Resend
    const sanitizedTags = (
      options.tags || [
        { name: 'service', value: 'diaspomoney' },
        { name: 'environment', value: process.env['NODE_ENV'] || 'development' },
      ]
    ).map(tag => ({
      name: sanitizeTagValue(tag.name),
      value: sanitizeTagValue(tag.value),
    }));

    log.debug({ tags: sanitizedTags }, 'Tags sanitized');

    // Validation finale des tags
    const isValidTags = sanitizedTags.every(
      tag =>
        /^[a-zA-Z0-9_-]+$/.test(tag.name) && /^[a-zA-Z0-9_-]+$/.test(tag.value),
    );

    if (!isValidTags) {
      log.error({ tags: sanitizedTags }, 'Invalid tags detected');
      Sentry.captureMessage('Invalid email tags detected', {
        level: 'error',
        extra: { tags: sanitizedTags },
      });
      return false;
    }

    if (!resend) {
      log.warn('Resend not configured - email not sent');
      return false;
    }

    const { data, error } = await resend.emails.send({
      from:
        options.from ||
        (process.env['NODE_ENV'] === 'production'
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
      log.error(
        { error, to: options.to, subject: options.subject },
        'Resend error',
      );
      Sentry.captureException(error, {
        tags: { component: 'EmailService', action: 'sendEmail' },
        extra: { to: options.to, subject: options.subject },
      });
      return false;
    }

    log.info(
      { emailId: data?.id, to: options.to, subject: options.subject },
      'Email sent successfully',
    );
    return true;
  } catch (error) {
    log.error(
      { error, to: options.to, subject: options.subject },
      'Error sending email',
    );
    Sentry.captureException(error, {
      tags: { component: 'EmailService', action: 'sendEmail' },
      extra: { to: options.to, subject: options.subject },
    });
    return false;
  }
}

// Fonctions spécialisées
export async function sendWelcomeEmail(
  email: string,
  name: string,
  activationUrl: string,
): Promise<boolean> {
  // En développement, utiliser l'email autorisé par Resend
  // En production, utiliser l'email original
  const targetEmail =
    process.env['NODE_ENV'] === 'development'
      ? 'malarbillaudrey@gmail.com'
      : email;

  log.debug({ targetEmail, originalEmail: email }, 'Sending welcome email');

  const { cleanUrl } = await import('@/lib/utils');
  // Construire l'URL de dashboard
  const baseUrl = cleanUrl(process.env['NEXT_PUBLIC_APP_URL']);
  const dashboardUrl = `${baseUrl}/dashboard`;

  // Utiliser le template complet avec le bouton vers Connexion/Dashboard
  const template = emailTemplates.welcome(name, activationUrl, dashboardUrl);

  return await sendEmail({
    to: targetEmail,
    subject: template.subject,
    html: template.html,
    text: template.text,
    tags: [
      { name: 'type', value: 'welcome' },
      { name: 'user_email', value: sanitizeTagValue(email) },
    ],
  });
}

export async function sendPasswordResetEmail(
  email: string,
  name: string,
  resetUrl: string,
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

/**
 * Envoyer un email d'activation de compte
 * Utilisé pour les comptes créés par un admin
 */
export async function sendAccountActivationEmail(
  email: string,
  name: string,
  activationUrl: string,
): Promise<boolean> {
  // En développement, utiliser l'email autorisé par Resend
  // En production, utiliser l'email original
  const targetEmail =
    process.env['NODE_ENV'] === 'development'
      ? 'malarbillaudrey@gmail.com'
      : email;

  log.debug({ targetEmail, originalEmail: email }, 'Sending account activation email');

  // Nettoyer l'URL pour éviter les guillemets
  const { cleanUrl } = await import('@/lib/utils');
  const cleanedActivationUrl = cleanUrl(activationUrl);

  const template = emailTemplates.accountActivation(name, cleanedActivationUrl);

  return await sendEmail({
    to: targetEmail,
    subject: template.subject,
    html: template.html,
    text: template.text,
    tags: [
      { name: 'type', value: 'account_activation' },
      { name: 'user_email', value: sanitizeTagValue(email) },
    ],
  });
}

/**
 * Envoyer un email de notification de connexion réussie
 */
export async function sendLoginSuccessEmail(
  email: string,
  name: string,
): Promise<boolean> {
  // En développement, utiliser l'email autorisé par Resend
  // En production, utiliser l'email original
  const targetEmail =
    process.env['NODE_ENV'] === 'development'
      ? 'malarbillaudrey@gmail.com'
      : email;

  log.debug({ targetEmail, originalEmail: email }, 'Sending login success email');

  // Construire l'URL de dashboard
  const { cleanUrl } = await import('@/lib/utils');
  const baseUrl = cleanUrl(process.env['NEXT_PUBLIC_APP_URL']);
  const dashboardUrl = `${baseUrl}/dashboard`;

  // Formater la date et l'heure
  const loginTime = new Date().toLocaleString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Paris',
  });

  const template = loginSuccessTemplate(name, loginTime, dashboardUrl);

  return await sendEmail({
    to: targetEmail,
    subject: template.subject,
    html: template.html,
    text: template.text,
    tags: [
      { name: 'type', value: 'login_success' },
      { name: 'user_email', value: sanitizeTagValue(email) },
    ],
  });
}

export async function sendPaymentConfirmationEmail(
  email: string,
  name: string,
  amount: number,
  currency: string,
  service: string,
): Promise<boolean> {
  const template = emailTemplates.paymentConfirmation(
    name,
    amount,
    currency,
    service,
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
  type: 'confirmation' | 'reminder',
): Promise<boolean> {
  const template = emailTemplates.appointmentNotification(
    name,
    provider,
    date,
    time,
    type,
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

export async function sendBookingTakeChargeEmail(
  email: string,
  name: string,
  reservationNumber: string,
  serviceName: string,
  amount?: string | number,
  currency?: string,
): Promise<boolean> {
  const template = emailTemplates.bookingTakeCharge(
    name,
    reservationNumber,
    serviceName,
    amount,
    currency,
  );

  return await sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
    text: template.text,
    tags: [
      { name: 'type', value: 'booking_take_charge' },
      { name: 'user', value: sanitizeTagValue(email) },
      { name: 'reservation', value: sanitizeTagValue(reservationNumber) },
    ],
  });
}

export async function sendPaymentLinkEmail(
  email: string,
  name: string,
  reservationNumber: string,
  serviceName: string,
  amount: string | number,
  currency: string,
  paymentUrl: string,
): Promise<boolean> {
  const template = emailTemplates.paymentLink(
    name,
    reservationNumber,
    serviceName,
    amount,
    currency,
    paymentUrl,
  );

  return await sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
    text: template.text,
    tags: [
      { name: 'type', value: 'payment_link' },
      { name: 'user', value: sanitizeTagValue(email) },
      { name: 'reservation', value: sanitizeTagValue(reservationNumber) },
    ],
  });
}

/**
 * Envoyer un email à un prestataire externe (non enregistré) avec les détails de la réservation.
 * En développement, l'email est redirigé vers une adresse autorisée par Resend.
 */
export async function sendExternalProviderAssignmentEmail(params: {
  to: string;
  providerName?: string;
  reservationNumber: string;
  serviceName: string;
  appointmentDate?: string;
  appointmentTime?: string;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  beneficiaryName?: string;
  beneficiaryPhone?: string;
  notes?: string;
}): Promise<boolean> {
  const targetEmail =
    process.env['NODE_ENV'] === 'development'
      ? 'malarbillaudrey@gmail.com'
      : params.to;

  const templatePayload: Parameters<typeof providerAssignmentTemplate>[0] = {
    reservationNumber: params.reservationNumber,
    serviceName: params.serviceName,
    ...(params.providerName ? { providerName: params.providerName } : {}),
    ...(params.appointmentDate ? { appointmentDate: params.appointmentDate } : {}),
    ...(params.appointmentTime ? { appointmentTime: params.appointmentTime } : {}),
    ...(params.clientName ? { clientName: params.clientName } : {}),
    ...(params.clientEmail ? { clientEmail: params.clientEmail } : {}),
    ...(params.clientPhone ? { clientPhone: params.clientPhone } : {}),
    ...(params.beneficiaryName ? { beneficiaryName: params.beneficiaryName } : {}),
    ...(params.beneficiaryPhone ? { beneficiaryPhone: params.beneficiaryPhone } : {}),
    ...(params.notes ? { notes: params.notes } : {}),
  };

  const template = emailTemplates.providerAssignment(templatePayload);

  return await sendEmail({
    to: targetEmail,
    subject: template.subject,
    html: template.html,
    text: template.text,
    tags: [
      { name: 'type', value: 'provider_assignment' },
      { name: 'provider_email', value: sanitizeTagValue(params.to) },
      { name: 'reservation', value: sanitizeTagValue(params.reservationNumber) },
    ],
  });
}

// Fonction de test d'envoi
export async function testEmailConnection(): Promise<boolean> {
  try {
    if (!resend) {
      log.warn('Resend not configured - email not sent');
      return false;
    }

    log.debug('Testing Resend connection');
    const { data, error } = await resend.emails.send({
      from: 'DiaspoMoney <noreply@diaspomoney.fr>',
      to: 'test@diaspomoney.fr',
      subject: 'Test de connexion Resend',
      html: '<p>Test de connexion Resend réussi !</p>',
      text: 'Test de connexion Resend réussi !',
    });

    if (error) {
      log.error({ error }, 'Resend connection test failed');
      Sentry.captureException(error, {
        tags: { component: 'EmailService', action: 'testConnection' },
      });
      return false;
    }

    log.info({ emailId: data?.id }, 'Resend connection test successful');
    return true;
  } catch (error) {
    log.error({ error }, 'Resend connection test error');
    Sentry.captureException(error, {
      tags: { component: 'EmailService', action: 'testConnection' },
    });
    return false;
  }
}
