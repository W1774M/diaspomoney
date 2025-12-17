/**
 * Template d'email de connexion réussie
 * Respecte la charte graphique DiaspoMoney : https://diaspomoney.fr/
 */

import type { EmailTemplate } from '@/lib/types';
import { emailFooter, emailFooterStyles } from './shared-footer';

export function loginSuccessTemplate(
  name: string,
  loginTime: string,
  dashboardUrl: string,
): EmailTemplate {
  return {
    subject: 'Connexion réussie - DiaspoMoney',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Connexion réussie</title>
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
            .content { 
              padding: 30px 20px; 
              background: #ffffff;
            }
            .content h2 {
              color: #047857;
              margin-top: 0;
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
            .info-box {
              background: #f0fdf4;
              border-left: 4px solid #059669;
              padding: 15px;
              margin: 20px 0;
              border-radius: 4px;
            }
            .warning { 
              background: #fef2f2; 
              border: 1px solid #fecaca; 
              padding: 15px; 
              border-radius: 6px; 
              margin: 20px 0;
              border-left: 4px solid #dc2626;
            }
            .warning strong {
              color: #dc2626;
            }
            ${emailFooterStyles}
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Connexion réussie</h1>
            </div>
            <div class="content">
              <h2>Bonjour ${name},</h2>
              <p>Vous vous êtes connecté avec succès à votre compte DiaspoMoney.</p>
              
              <div class="info-box">
                <p><strong>Date et heure de connexion :</strong> ${loginTime}</p>
              </div>

              <div class="button-container">
                <a href="${dashboardUrl}" class="button" style="color: white !important; text-decoration: none;">Accéder à mon Dashboard</a>
              </div>

              <div class="warning">
                <strong>⚠️ Sécurité :</strong> Si vous n'êtes pas à l'origine de cette connexion, veuillez changer votre mot de passe immédiatement et nous contacter à <a href="mailto:support@diaspomoney.fr" style="color: #dc2626;">support@diaspomoney.fr</a>.
              </div>

              <p style="margin-top: 20px; color: #64748b; font-size: 13px; font-style: italic;">Cet email vous est envoyé à chaque connexion pour votre sécurité.</p>
            </div>
            ${emailFooter}
          </div>
        </body>
      </html>
    `,
    text: `
Connexion réussie - DiaspoMoney

Bonjour ${name},

Vous vous êtes connecté avec succès à votre compte DiaspoMoney.

Date et heure de connexion : ${loginTime}

Accéder à votre Dashboard : ${dashboardUrl}

⚠️ Sécurité : Si vous n'êtes pas à l'origine de cette connexion, veuillez changer votre mot de passe immédiatement et nous contacter à support@diaspomoney.fr.

Cet email vous est envoyé à chaque connexion pour votre sécurité.

Cordialement,
L'équipe DiaspoMoney
    `,
  };
}

