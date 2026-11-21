/**
 * Template d'email de lien de paiement
 * Utilisé pour envoyer un lien de paiement aux clients
 * Respecte la charte graphique DiaspoMoney : https://diaspomoney.fr/
 */

import type { EmailTemplate } from '@/lib/types';
import { emailFooter, emailFooterStyles } from './shared-footer';
import { cleanUrl } from '@/lib/utils';

export function paymentLinkTemplate(
  name: string,
  reservationNumber: string,
  serviceName: string,
  amount: string | number,
  currency: string,
  paymentUrl: string,
): EmailTemplate {
  const formattedAmount = typeof amount === 'number' ? amount.toFixed(2) : amount;
  const requestDate = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  // Nettoyer l'URL de paiement pour éviter les guillemets
  const cleanedPaymentUrl = cleanUrl(paymentUrl);

  return {
    subject: `Paiement de votre commande ${reservationNumber} - DiaspoMoney`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Lien de paiement</title>
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
              background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); 
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
              color: #1e40af;
              margin-top: 0;
            }
            .highlight { 
              background: #dbeafe; 
              padding: 20px; 
              border-radius: 8px; 
              margin: 20px 0;
              border-left: 4px solid #2563eb;
            }
            .highlight h3 {
              color: #1e40af;
              margin-top: 0;
              font-size: 18px;
            }
            .section { 
              background: #f8fafc; 
              margin: 20px 0; 
              padding: 20px; 
              border-radius: 8px; 
              border-left: 4px solid #2563eb;
            }
            .section h3 {
              color: #1e40af;
              margin-top: 0;
              font-size: 16px;
            }
            .amount-highlight {
              font-size: 1.2em;
              font-weight: bold;
              color: #2563eb;
            }
            .status-badge {
              display: inline-block;
              background: #fef3c7;
              color: #92400e;
              padding: 8px 16px;
              border-radius: 20px;
              font-weight: 600;
              font-size: 14px;
            }
            .button { 
              display: inline-block; 
              padding: 15px 30px; 
              background: #2563eb; 
              color: white !important; 
              text-decoration: none; 
              border-radius: 8px; 
              margin: 20px 0; 
              font-weight: 600;
              font-size: 16px;
              transition: background-color 0.3s;
            }
            .button:hover {
              background: #1e40af;
            }
            .button-container {
              text-align: center;
              margin: 30px 0;
            }
            .warning { 
              background: #fef3c7; 
              border-left: 4px solid #f59e0b; 
              padding: 15px; 
              margin: 20px 0; 
              border-radius: 6px;
            }
            .warning p {
              margin: 5px 0;
              color: #92400e;
            }
            .link-fallback {
              margin-top: 20px;
              padding: 15px;
              background: #f8fafc;
              border-left: 4px solid #2563eb;
              border-radius: 4px;
            }
            .link-fallback p {
              margin: 5px 0;
              font-size: 14px;
              color: #64748b;
            }
            .link-fallback a {
              color: #2563eb;
              word-break: break-all;
              text-decoration: underline;
            }
            ${emailFooterStyles}
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>💳 Paiement de votre commande</h1>
              <p>Finalisez votre réservation en effectuant le paiement</p>
            </div>
            <div class="content">
              <h2>Bonjour ${name},</h2>
              <p>Votre commande a été validée par notre équipe. Pour finaliser votre réservation, veuillez effectuer le paiement en cliquant sur le bouton ci-dessous.</p>
              
              <div class="highlight">
                <h3>Numéro de réservation : ${reservationNumber}</h3>
                <p><strong>Date de la demande :</strong> ${requestDate}</p>
              </div>

              <div class="section">
                <h3>📋 Récapitulatif de votre commande</h3>
                <p><strong>Service :</strong> ${serviceName}</p>
                <p><strong>Montant à payer :</strong> <span class="amount-highlight">${formattedAmount} ${currency}</span></p>
                <p><strong>Statut :</strong> <span class="status-badge">⏳ En attente de paiement</span></p>
              </div>

              <div class="warning">
                <p><strong>⏰ Important :</strong> Ce lien de paiement est valable pendant 7 jours. Après cette date, il expirera et vous devrez demander un nouveau lien.</p>
              </div>

              <div class="button-container">
                <a href="${cleanedPaymentUrl}" class="button" style="color: white !important; text-decoration: none;">💳 Payer maintenant</a>
              </div>

              <div class="link-fallback">
                <p><strong>Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :</strong></p>
                <p><a href="${cleanedPaymentUrl}" style="color: #2563eb; word-break: break-all;">${cleanedPaymentUrl}</a></p>
              </div>
            </div>
            ${emailFooter}
          </div>
        </body>
      </html>
    `,
    text: `
Paiement de votre commande ${reservationNumber}

Bonjour ${name},

Votre commande a été validée par notre équipe. Pour finaliser votre réservation, veuillez effectuer le paiement.

Numéro de réservation : ${reservationNumber}
Date de la demande : ${requestDate}

Récapitulatif de votre commande :
- Service : ${serviceName}
- Montant à payer : ${formattedAmount} ${currency}
- Statut : ⏳ En attente de paiement

⏰ Important : Ce lien de paiement est valable pendant 7 jours. Après cette date, il expirera et vous devrez demander un nouveau lien.

Lien de paiement : ${cleanedPaymentUrl}

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

