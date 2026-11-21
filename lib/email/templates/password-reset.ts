/**
 * Template d'email de réinitialisation de mot de passe
 * Respecte la charte graphique DiaspoMoney : https://diaspomoney.fr/
 */

import type { EmailTemplate } from '@/lib/types';
import { emailFooter, emailFooterStyles } from './shared-footer';

export function passwordResetTemplate(
  name: string,
  resetUrl: string,
): EmailTemplate {
  return {
    subject: 'Réinitialisation de votre mot de passe DiaspoMoney',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Réinitialisation de mot de passe</title>
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
              background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); 
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
              color: #b91c1c;
              margin-top: 0;
            }
            .button { 
              display: inline-block; 
              padding: 14px 28px; 
              background: #dc2626; 
              color: white !important; 
              text-decoration: none; 
              border-radius: 8px; 
              margin: 20px 0; 
              font-weight: 600;
              font-size: 16px;
              transition: background-color 0.3s;
            }
            .button:hover {
              background: #b91c1c;
            }
            .button-container {
              text-align: center;
            }
            .link-fallback {
              margin-top: 20px;
              padding: 15px;
              background: #f8fafc;
              border-left: 4px solid #dc2626;
              border-radius: 4px;
            }
            .link-fallback p {
              margin: 5px 0;
              font-size: 14px;
              color: #64748b;
            }
            .link-fallback a {
              color: #dc2626;
              word-break: break-all;
              text-decoration: underline;
            }
            ${emailFooterStyles}
            .warning { 
              background: #fef2f2; 
              border: 1px solid #fecaca; 
              padding: 15px; 
              border-radius: 6px; 
              margin: 20px 0;
              border-left: 4px solid #dc2626;
            }
            .warning strong {
              color: #b91c1c;
            }
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
              <div class="button-container">
                <a href="${resetUrl}" class="button" style="color: white !important; text-decoration: none;">Réinitialiser mon mot de passe</a>
              </div>
              <div class="link-fallback">
                <p><strong>Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :</strong></p>
                <p><a href="${resetUrl}" style="color: #dc2626; word-break: break-all;">${resetUrl}</a></p>
              </div>
              <div class="warning">
                <strong>⚠️ Important :</strong> Ce lien expire dans 1 heure. Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.
              </div>
              <p style="margin-top: 20px; color: #64748b; font-size: 13px; font-style: italic;">Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p>
            </div>
            ${emailFooter}
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

Si le lien ci-dessus ne fonctionne pas, copiez et collez-le dans votre navigateur.

⚠️ Important : Ce lien expire dans 1 heure.

Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.

--
DiaspoMoney
Transférez des services, pas de l'argent, pour une économie durable.

📍 Seine Innopolis
72 Rue de la République
76140, Le Petit-Quevilly

© 2025 DiaspoMoney. Tous droits réservés.
    `.trim(),
  };
}

