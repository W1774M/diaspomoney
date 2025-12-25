/**
 * Template d'email d'attribution de réservation à un prestataire externe (non enregistré)
 * Respecte la charte graphique DiaspoMoney : https://diaspomoney.fr/
 */

import type { EmailTemplate } from '@/lib/types';
import { emailFooter, emailFooterStyles } from './shared-footer';

export function providerAssignmentTemplate(params: {
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
}): EmailTemplate {
  const providerName = params.providerName?.trim() || 'Prestataire';
  const appointmentLine =
    params.appointmentDate || params.appointmentTime
      ? `${params.appointmentDate || ''}${params.appointmentDate && params.appointmentTime ? ' à ' : ''}${params.appointmentTime || ''}`.trim()
      : 'À planifier';

  return {
    subject: `Nouvelle réservation à prendre en charge : ${params.reservationNumber} - DiaspoMoney`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Attribution de réservation</title>
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
              background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
              color: white;
              padding: 30px 20px;
              text-align: center;
              border-radius: 10px 10px 0 0;
            }
            .header h1 {
              margin: 0;
              font-size: 24px;
              font-weight: 700;
            }
            .content {
              padding: 30px 20px;
              background: #ffffff;
            }
            .content h2 {
              color: #ea580c;
              margin-top: 0;
            }
            .highlight {
              background: #fff7ed;
              padding: 18px;
              border-radius: 8px;
              margin: 18px 0;
              border-left: 4px solid #f97316;
            }
            .section {
              background: #f8fafc;
              margin: 16px 0;
              padding: 16px;
              border-radius: 8px;
              border-left: 4px solid #f97316;
            }
            .section h3 {
              color: #ea580c;
              margin-top: 0;
              font-size: 16px;
            }
            .muted {
              color: #64748b;
              font-size: 13px;
              margin-top: 16px;
            }
            ${emailFooterStyles}
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📩 Nouvelle réservation attribuée</h1>
            </div>
            <div class="content">
              <h2>Bonjour ${providerName},</h2>
              <p>Une réservation vous a été attribuée par l'équipe DiaspoMoney. Voici les informations nécessaires pour la prendre en charge.</p>

              <div class="highlight">
                <p><strong>Réservation :</strong> ${params.reservationNumber}</p>
                <p><strong>Service :</strong> ${params.serviceName}</p>
                <p><strong>Rendez-vous :</strong> ${appointmentLine}</p>
              </div>

              <div class="section">
                <h3>👤 Client</h3>
                <p><strong>Nom :</strong> ${params.clientName || '—'}</p>
                <p><strong>Email :</strong> ${params.clientEmail || '—'}</p>
                <p><strong>Téléphone :</strong> ${params.clientPhone || '—'}</p>
              </div>

              <div class="section">
                <h3>🧾 Bénéficiaire</h3>
                <p><strong>Nom :</strong> ${params.beneficiaryName || '—'}</p>
                <p><strong>Téléphone :</strong> ${params.beneficiaryPhone || '—'}</p>
              </div>

              ${
                params.notes
                  ? `<div class="section"><h3>📝 Notes</h3><p>${params.notes}</p></div>`
                  : ''
              }

              <p class="muted">
                Si vous avez besoin d'informations complémentaires, répondez à cet email ou contactez-nous à <strong>support@diaspomoney.fr</strong>.
              </p>
            </div>
            ${emailFooter}
          </div>
        </body>
      </html>
    `,
    text: `
Nouvelle réservation attribuée - DiaspoMoney

Bonjour ${providerName},

Une réservation vous a été attribuée par l'équipe DiaspoMoney.

Réservation : ${params.reservationNumber}
Service : ${params.serviceName}
Rendez-vous : ${appointmentLine}

Client :
- Nom : ${params.clientName || '—'}
- Email : ${params.clientEmail || '—'}
- Téléphone : ${params.clientPhone || '—'}

Bénéficiaire :
- Nom : ${params.beneficiaryName || '—'}
- Téléphone : ${params.beneficiaryPhone || '—'}

${params.notes ? `Notes : ${params.notes}\n` : ''}

Support : support@diaspomoney.fr
    `.trim(),
  };
}


