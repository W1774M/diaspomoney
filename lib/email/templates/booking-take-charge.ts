/**
 * Template d'email de confirmation de prise en charge de commande
 * Utilisé pour confirmer qu'une commande a été prise en charge par l'équipe
 * Respecte la charte graphique DiaspoMoney : https://diaspomoney.fr/
 */

import type { EmailTemplate } from '@/lib/types';
import { emailFooter, emailFooterStyles } from './shared-footer';
import { cleanUrl } from '@/lib/utils';

export function bookingTakeChargeTemplate(
  name: string,
  reservationNumber: string,
  serviceName: string,
  amount?: string | number,
  currency?: string,
): EmailTemplate {
  const confirmationDate = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const formattedAmount = amount 
    ? (typeof amount === 'number' ? amount.toFixed(2) : amount)
    : null;
  const amountDisplay = formattedAmount 
    ? `${formattedAmount} ${currency || '€'}`
    : '';

  const baseUrl = cleanUrl(process.env['NEXT_PUBLIC_APP_URL'] || 'https://diaspomoney.fr');
  const bookingsUrl = `${baseUrl}/dashboard/bookings`;

  return {
    subject: `Votre commande ${reservationNumber} a été prise en charge - DiaspoMoney`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Commande prise en charge</title>
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
              background: linear-gradient(135deg, #059669 0%, #047857 100%); 
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
              color: #047857;
              margin-top: 0;
            }
            .highlight { 
              background: #d1fae5; 
              padding: 20px; 
              border-radius: 8px; 
              margin: 20px 0;
              border-left: 4px solid #059669;
            }
            .highlight h3 {
              color: #047857;
              margin-top: 0;
              font-size: 18px;
            }
            .section { 
              background: #f8fafc; 
              margin: 20px 0; 
              padding: 20px; 
              border-radius: 8px; 
              border-left: 4px solid #059669;
            }
            .section h3 {
              color: #047857;
              margin-top: 0;
              font-size: 16px;
            }
            .button { 
              display: inline-block; 
              padding: 14px 28px; 
              background: #059669; 
              color: white !important; 
              text-decoration: none; 
              border-radius: 8px; 
              margin: 20px 0; 
              font-weight: 600;
              font-size: 16px;
              transition: background-color 0.3s;
            }
            .button:hover {
              background: #047857;
            }
            .button-container {
              text-align: center;
              margin: 30px 0;
            }
            .status-badge {
              display: inline-block;
              background: #d1fae5;
              color: #047857;
              padding: 8px 16px;
              border-radius: 20px;
              font-weight: 600;
              font-size: 14px;
            }
            ${emailFooterStyles}
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Commande prise en charge</h1>
              <p>Votre commande a été confirmée par notre équipe</p>
            </div>
            <div class="content">
              <h2>Bonjour ${name},</h2>
              <p>Nous avons le plaisir de vous informer que votre commande a été prise en charge et confirmée par notre équipe.</p>
              
              <div class="highlight">
                <h3>Numéro de réservation : ${reservationNumber}</h3>
                <p><strong>Date de confirmation :</strong> ${confirmationDate}</p>
              </div>

              <div class="section">
                <h3>📋 Détails de votre commande</h3>
                <p><strong>Service :</strong> ${serviceName}</p>
                ${formattedAmount ? `<p><strong>Montant :</strong> ${amountDisplay}</p>` : ''}
                <p><strong>Statut :</strong> <span class="status-badge">✅ Confirmée</span></p>
              </div>

              <div class="section">
                <h3>ℹ️ Prochaines étapes</h3>
                <p>Votre commande est maintenant en cours de traitement. Notre équipe va procéder à l'exécution de votre demande.</p>
                <p>Vous serez informé(e) de l'avancement de votre commande par email.</p>
              </div>

              <div class="button-container">
                <a href="${bookingsUrl}" class="button" style="color: white !important; text-decoration: none;">Voir mes commandes</a>
              </div>
            </div>
            ${emailFooter}
          </div>
        </body>
      </html>
    `,
    text: `
Commande prise en charge - ${reservationNumber}

Bonjour ${name},

Nous avons le plaisir de vous informer que votre commande a été prise en charge et confirmée par notre équipe.

Numéro de réservation : ${reservationNumber}
Date de confirmation : ${confirmationDate}

Détails de votre commande :
- Service : ${serviceName}
${formattedAmount ? `- Montant : ${amountDisplay}` : ''}
- Statut : ✅ Confirmée

Prochaines étapes :
Votre commande est maintenant en cours de traitement. Notre équipe va procéder à l'exécution de votre demande.
Vous serez informé(e) de l'avancement de votre commande par email.

Pour voir vos commandes, connectez-vous à votre espace client :
${bookingsUrl}

Cordialement,
L'équipe DiaspoMoney

Pour toute question, contactez-nous à support@diaspomoney.fr

--
DiaspoMoney
Transférez des services, pas de l'argent, pour une économie durable.

📍 Seine Innopolis
72 Rue de la République
76140, Le Petit-Quevilly

© ${new Date().getFullYear()} DiaspoMoney. Tous droits réservés.
    `.trim(),
  };
}

