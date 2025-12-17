/**
 * Template d'email de confirmation de paiement
 * Utilisé pour confirmer qu'un paiement a été traité avec succès
 * Respecte la charte graphique DiaspoMoney : https://diaspomoney.fr/
 */

import type { EmailTemplate } from '@/lib/types';
import { emailFooter, emailFooterStyles } from './shared-footer';

export function paymentConfirmationTemplate(
  name: string,
  amount: string | number,
  currency: string,
  service: string,
): EmailTemplate {
  const formattedAmount = typeof amount === 'number' ? amount.toFixed(2) : amount;
  const paymentDate = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return {
    subject: `Confirmation de paiement - ${service}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Confirmation de paiement</title>
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
            .header-icon {
              font-size: 48px;
              margin-bottom: 10px;
            }
            .content { 
              padding: 30px 20px; 
              background: #ffffff;
            }
            .content h2 {
              color: #047857;
              margin-top: 0;
            }
            .receipt { 
              background: #f8fafc; 
              border: 2px solid #d1fae5; 
              border-radius: 12px; 
              padding: 25px; 
              margin: 25px 0;
            }
            .receipt h3 {
              color: #047857;
              margin-top: 0;
              font-size: 18px;
              border-bottom: 2px solid #d1fae5;
              padding-bottom: 10px;
            }
            .receipt-item {
              display: flex;
              justify-content: space-between;
              padding: 12px 0;
              border-bottom: 1px solid #e5e7eb;
            }
            .receipt-item:last-child {
              border-bottom: none;
            }
            .receipt-label {
              color: #64748b;
              font-weight: 500;
            }
            .receipt-value {
              color: #1f2937;
              font-weight: 600;
            }
            .amount-highlight {
              background: linear-gradient(135deg, #059669 0%, #047857 100%);
              color: white;
              padding: 20px;
              border-radius: 8px;
              text-align: center;
              margin: 20px 0;
            }
            .amount-highlight .amount-label {
              font-size: 14px;
              opacity: 0.9;
              margin-bottom: 5px;
            }
            .amount-highlight .amount-value {
              font-size: 32px;
              font-weight: 700;
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
              margin: 25px 0;
            }
            .info-box {
              background: #eff6ff;
              border-left: 4px solid #2563eb;
              padding: 15px;
              border-radius: 6px;
              margin: 20px 0;
            }
            .info-box p {
              margin: 5px 0;
              color: #1e40af;
            }
            ${emailFooterStyles}
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="header-icon">✅</div>
              <h1>Paiement confirmé</h1>
            </div>
            <div class="content">
              <h2>Bonjour ${name},</h2>
              <p>Votre paiement a été traité avec succès ! Nous vous remercions pour votre confiance.</p>
              
              <div class="amount-highlight">
                <div class="amount-label">Montant payé</div>
                <div class="amount-value">${formattedAmount} ${currency}</div>
              </div>

              <div class="receipt">
                <h3>Détails du paiement</h3>
                <div class="receipt-item">
                  <span class="receipt-label">Service :</span>
                  <span class="receipt-value">${service}</span>
                </div>
                <div class="receipt-item">
                  <span class="receipt-label">Montant :</span>
                  <span class="receipt-value">${formattedAmount} ${currency}</span>
                </div>
                <div class="receipt-item">
                  <span class="receipt-label">Date :</span>
                  <span class="receipt-value">${paymentDate}</span>
                </div>
                <div class="receipt-item">
                  <span class="receipt-label">Statut :</span>
                  <span class="receipt-value">
                    <span class="status-badge">✅ Confirmé</span>
                  </span>
                </div>
              </div>

              <div class="button-container">
                <a href="${process.env['NEXT_PUBLIC_APP_URL'] || 'https://diaspomoney.fr'}/dashboard/bookings" class="button" style="color: white !important; text-decoration: none;">Voir mes commandes</a>
              </div>

              <div class="info-box">
                <p><strong>ℹ️ Informations importantes :</strong></p>
                <p>• Votre paiement a été traité avec succès</p>
                <p>• Vous pouvez maintenant accéder à votre service</p>
                <p>• Un reçu détaillé est disponible dans votre espace client</p>
              </div>

              <p style="margin-top: 20px; color: #64748b; font-size: 14px;">Si vous avez des questions concernant ce paiement, n'hésitez pas à <a href="mailto:support@diaspomoney.fr" style="color: #2563eb;">contacter notre support</a>.</p>
            </div>
            ${emailFooter}
          </div>
        </body>
      </html>
    `,
    text: `
Confirmation de paiement - ${service}

Bonjour ${name},

Votre paiement a été traité avec succès ! Nous vous remercions pour votre confiance.

Détails du paiement :
- Service : ${service}
- Montant : ${formattedAmount} ${currency}
- Date : ${paymentDate}
- Statut : ✅ Confirmé

Vous pouvez maintenant accéder à votre service. Un reçu détaillé est disponible dans votre espace client.

Pour voir vos commandes, connectez-vous à votre dashboard :
${process.env['NEXT_PUBLIC_APP_URL'] || 'https://diaspomoney.fr'}/dashboard/bookings

Si vous avez des questions concernant ce paiement, n'hésitez pas à contacter notre support à support@diaspomoney.fr.

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

