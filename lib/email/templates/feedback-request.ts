/**
 * Template d'email de demande de feedback
 * Utilisé pour demander un feedback aux clients sur une prestation terminée
 * Respecte la charte graphique DiaspoMoney : https://diaspomoney.fr/
 */

import type { EmailTemplate } from '@/lib/types';
import { emailFooter, emailFooterStyles } from './shared-footer';
import { cleanUrl } from '@/lib/utils';

export function feedbackRequestTemplate(
  name: string,
  reservationNumber: string,
  serviceName: string,
  feedbackUrl: string,
): EmailTemplate {
  const requestDate = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Nettoyer l'URL de feedback
  const cleanedFeedbackUrl = cleanUrl(feedbackUrl);

  return {
    subject: `Votre avis sur la prestation ${reservationNumber} - DiaspoMoney`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Demande de feedback</title>
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; 
              line-height: 1.6; 
              color: #333; 
              margin: 0; 
              padding: 0; 
              background-color: #f5f5f5;
            }
            .container { 
              max-width: 600px; 
              margin: 0 auto; 
              padding: 20px; 
              background-color: #ffffff;
            }
            .header { 
              background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); 
              color: white; 
              padding: 30px 20px; 
              text-align: center; 
              border-radius: 10px 10px 0 0;
            }
            .header h1 { 
              margin: 0; 
              font-size: 28px; 
              font-weight: 600;
            }
            .header p {
              margin: 10px 0 0 0;
              opacity: 0.95;
            }
            .content { 
              padding: 30px 20px; 
              background: #ffffff;
            }
            .content h2 {
              color: #d97706;
              margin-top: 0;
            }
            .highlight { 
              background-color: #fef3c7; 
              border-left: 4px solid #f59e0b; 
              padding: 15px; 
              margin: 20px 0; 
              border-radius: 4px;
            }
            .booking-info {
              background-color: #f9fafb;
              border: 1px solid #e5e7eb;
              border-radius: 8px;
              padding: 20px;
              margin: 20px 0;
            }
            .booking-info-item {
              display: flex;
              justify-content: space-between;
              padding: 8px 0;
              border-bottom: 1px solid #e5e7eb;
            }
            .booking-info-item:last-child {
              border-bottom: none;
            }
            .booking-info-label {
              font-weight: 600;
              color: #6b7280;
            }
            .booking-info-value {
              color: #111827;
            }
            .button { 
              display: inline-block; 
              padding: 14px 28px; 
              background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); 
              color: white; 
              text-decoration: none; 
              border-radius: 8px; 
              font-weight: 600;
              text-align: center;
              margin: 20px 0;
            }
            .button:hover {
              background: linear-gradient(135deg, #d97706 0%, #b45309 100%);
            }
            .footer-note {
              color: #6b7280;
              font-size: 14px;
              margin-top: 20px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
            }
            ${emailFooterStyles}
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>💬 Votre avis nous intéresse</h1>
              <p>DiaspoMoney</p>
            </div>
            <div class="content">
              <h2>Bonjour ${name},</h2>
              <p>Nous espérons que vous avez été satisfait(e) de la prestation que vous avez reçue.</p>
              
              <div class="highlight">
                <p style="margin: 0;"><strong>Votre avis est précieux pour nous !</strong></p>
                <p style="margin: 10px 0 0 0;">Prenez quelques instants pour partager votre expérience et nous aider à améliorer nos services.</p>
              </div>

              <div class="booking-info">
                <div class="booking-info-item">
                  <span class="booking-info-label">Numéro de réservation :</span>
                  <span class="booking-info-value"><strong>${reservationNumber}</strong></span>
                </div>
                <div class="booking-info-item">
                  <span class="booking-info-label">Service :</span>
                  <span class="booking-info-value">${serviceName}</span>
                </div>
                <div class="booking-info-item">
                  <span class="booking-info-label">Date de la demande :</span>
                  <span class="booking-info-value">${requestDate}</span>
                </div>
              </div>

              <p style="text-align: center; margin: 30px 0;">
                <a href="${cleanedFeedbackUrl}" class="button" style="display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; text-align: center; margin: 20px 0;">
                  Donner mon avis
                </a>
              </p>
              
              <p style="text-align: center; margin-top: 10px;">
                <a href="${cleanedFeedbackUrl}" style="color: #d97706; text-decoration: underline;">Ou cliquez ici pour accéder au formulaire</a>
              </p>

              <p>En cliquant sur le bouton ci-dessus, vous accéderez à un formulaire simple où vous pourrez :</p>
              <ul>
                <li>Noter la prestation de 0 à 5 étoiles</li>
                <li>Laisser un commentaire sur votre expérience</li>
              </ul>

              <div class="footer-note">
                <p><strong>Note importante :</strong> Vous n'avez pas besoin d'être connecté pour donner votre avis. Ce lien est personnel et sécurisé.</p>
                <p style="margin-top: 10px;">Si vous avez des questions, n'hésitez pas à nous contacter.</p>
              </div>
            </div>
            ${emailFooter}
          </div>
        </body>
      </html>
    `,
    text: `
Bonjour ${name},

Nous espérons que vous avez été satisfait(e) de la prestation que vous avez reçue.

Votre avis est précieux pour nous ! Prenez quelques instants pour partager votre expérience et nous aider à améliorer nos services.

Détails de la prestation :
- Numéro de réservation : ${reservationNumber}
- Service : ${serviceName}
- Date de la demande : ${requestDate}

Pour donner votre avis, cliquez sur le lien suivant :
${cleanedFeedbackUrl}

En accédant à ce lien, vous pourrez :
- Noter la prestation de 0 à 5 étoiles
- Laisser un commentaire sur votre expérience

Note importante : Vous n'avez pas besoin d'être connecté pour donner votre avis. Ce lien est personnel et sécurisé.

Si vous avez des questions, n'hésitez pas à nous contacter.

Cordialement,
L'équipe DiaspoMoney
    `,
  };
}
