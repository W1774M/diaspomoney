/**
 * Template d'email de bienvenue
 * Utilisé pour l'inscription et l'activation de compte
 * Respecte la charte graphique DiaspoMoney : https://diaspomoney.fr/
 */

import type { EmailTemplate } from '@/lib/types';
import { emailFooter, emailFooterStyles } from './shared-footer';

export function welcomeTemplate(
  name: string,
  verificationUrl: string,
  loginUrl?: string,
): EmailTemplate {
  // Nettoyer l'URL pour s'assurer qu'elle ne contient pas de guillemets
  const cleanVerificationUrl = verificationUrl.replace(/^["']|["']$/g, '').trim();
  const cleanLoginUrl = loginUrl ? loginUrl.replace(/^["']|["']$/g, '').trim() : undefined;

  return {
    subject: `Bienvenue sur DiaspoMoney, ${name} !`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Bienvenue sur DiaspoMoney</title>
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
            .content { 
              padding: 30px 20px; 
              background: #ffffff;
            }
            .content h2 {
              color: #1e40af;
              margin-top: 0;
            }
            .button { 
              display: inline-block; 
              padding: 14px 28px; 
              background: #2563eb; 
              color: white !important; 
              text-decoration: none; 
              border-radius: 8px; 
              margin: 10px 5px; 
              font-weight: 600;
              font-size: 16px;
              transition: background-color 0.3s;
            }
            .button:hover {
              background: #1e40af;
            }
            .button-secondary { 
              display: inline-block; 
              padding: 14px 28px; 
              background: #ff730f; 
              color: white !important; 
              text-decoration: none; 
              border-radius: 8px; 
              margin: 10px 5px; 
              font-weight: 600;
              font-size: 16px;
              transition: background-color 0.3s;
            }
            .button-secondary:hover {
              background: #e6660d;
            }
            .button-container { 
              text-align: center; 
              margin: 30px 0; 
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
              <h1>🎉 Bienvenue sur DiaspoMoney !</h1>
            </div>
            <div class="content">
              <h2>Bonjour ${name},</h2>
              <p>Merci de vous être inscrit sur DiaspoMoney, la plateforme qui connecte les résidents européens aux services africains.</p>
              <p>Pour activer votre compte et définir votre mot de passe, veuillez cliquer sur le bouton ci-dessous :</p>
              <div class="button-container">
                <a href="${cleanVerificationUrl}" class="button" style="color: white !important; text-decoration: none;">Activer mon compte</a>
                ${cleanLoginUrl ? `<a href="${cleanLoginUrl}" class="button-secondary" style="color: white !important; text-decoration: none;">Accéder à mon Dashboard</a>` : ''}
              </div>
              <div class="link-fallback">
                <p><strong>Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :</strong></p>
                <p><a href="${cleanVerificationUrl}" style="color: #2563eb; word-break: break-all;">${cleanVerificationUrl}</a></p>
              </div>
              <p style="margin-top: 20px; color: #64748b; font-size: 14px;"><strong>⏰ Important :</strong> Ce lien expire dans 7 jours.</p>
              <p style="margin-top: 20px; color: #64748b; font-size: 13px; font-style: italic;">Si vous n'avez pas créé de compte, ignorez cet email.</p>
            </div>
            ${emailFooter}
          </div>
        </body>
      </html>
    `,
    text: `
Bienvenue sur DiaspoMoney, ${name} !

Merci de vous être inscrit sur DiaspoMoney, la plateforme qui connecte les résidents européens aux services africains.

Pour activer votre compte et définir votre mot de passe, veuillez cliquer sur ce lien :
${cleanVerificationUrl}

${cleanLoginUrl ? `\nAccéder à votre Dashboard : ${cleanLoginUrl}` : ''}

⏰ Important : Ce lien expire dans 7 jours.

Si le lien ci-dessus ne fonctionne pas, copiez et collez-le dans votre navigateur.

Si vous n'avez pas créé de compte, ignorez cet email.

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

