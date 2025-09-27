// ============================================================================
// EMAIL TEMPLATES - DESIGN FINTECH MODERNE
// ============================================================================

export function EmailVerificationTemplate({
  name,
  verificationUrl,
}: {
  name: string;
  verificationUrl: string;
}) {
  return {
    subject: "🔐 Activez votre compte Diaspomoney",
    html: `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Activation de compte - Diaspomoney</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          
          <!-- Header avec gradient fintech -->
          <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 32px 24px; text-align: center;">
            <div style="background-color: rgba(255, 255, 255, 0.1); border-radius: 50%; width: 64px; height: 64px; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M2 17L12 22L22 17" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M2 12L12 17L22 12" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <h1 style="color: white; font-size: 28px; font-weight: 700; margin: 0; letter-spacing: -0.025em;">Diaspomoney</h1>
            <p style="color: rgba(255, 255, 255, 0.9); font-size: 16px; margin: 8px 0 0; font-weight: 500;">Votre plateforme de confiance</p>
          </div>

          <!-- Contenu principal -->
          <div style="padding: 40px 32px;">
            <div style="text-align: center; margin-bottom: 32px;">
              <div style="background-color: #f0f9ff; border: 2px solid #e0f2fe; border-radius: 50%; width: 80px; height: 80px; margin: 0 auto 24px; display: flex; align-items: center; justify-content: center;">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="#0ea5e9" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <h2 style="color: #1e293b; font-size: 24px; font-weight: 700; margin: 0 0 12px; letter-spacing: -0.025em;">Activez votre compte</h2>
              <p style="color: #64748b; font-size: 16px; margin: 0; line-height: 1.5;">Bonjour <strong style="color: #1e293b;">${name}</strong>,</p>
            </div>

            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px; margin-bottom: 32px;">
              <p style="color: #475569; font-size: 16px; margin: 0 0 16px; line-height: 1.6;">
                Bienvenue sur <strong style="color: #1e293b;">Diaspomoney</strong> ! Votre compte a été créé avec succès. 
                Pour finaliser votre inscription et accéder à tous nos services, 
                veuillez vérifier votre adresse email.
              </p>
              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 4px;">
                <p style="color: #92400e; font-size: 14px; margin: 0; font-weight: 500;">
                  ⏰ Ce lien d'activation expirera dans 24 heures
                </p>
              </div>
            </div>

            <!-- Bouton d'activation -->
            <div style="text-align: center; margin-bottom: 32px;">
              <a href="${verificationUrl}" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 14px 0 rgba(59, 130, 246, 0.4); transition: all 0.2s;">
                🔐 Activer mon compte
              </a>
            </div>

            <!-- Informations de sécurité -->
            <div style="background-color: #f1f5f9; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
              <h3 style="color: #1e293b; font-size: 16px; font-weight: 600; margin: 0 0 12px; display: flex; align-items: center;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-right: 8px;">
                  <path d="M12 22S8 18 8 12V5L12 3L16 5V12C16 18 12 22 12 22Z" stroke="#3b82f6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                Sécurité & Confidentialité
              </h3>
              <ul style="color: #64748b; font-size: 14px; margin: 0; padding-left: 20px; line-height: 1.5;">
                <li>Vos données sont chiffrées et protégées</li>
                <li>Conformité RGPD et standards bancaires</li>
                <li>Authentification à deux facteurs disponible</li>
              </ul>
            </div>

            <!-- Lien de secours -->
            <div style="text-align: center; padding: 20px; background-color: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
              <p style="color: #64748b; font-size: 14px; margin: 0 0 12px;">Le bouton ne fonctionne pas ?</p>
              <p style="color: #64748b; font-size: 12px; margin: 0; word-break: break-all;">Copiez et collez ce lien dans votre navigateur :</p>
              <p style="color: #3b82f6; font-size: 12px; margin: 8px 0 0; word-break: break-all;">${verificationUrl}</p>
            </div>
          </div>

          <!-- Footer -->
          <div style="background-color: #f8fafc; padding: 24px 32px; border-top: 1px solid #e2e8f0;">
            <div style="text-align: center; margin-bottom: 16px;">
              <p style="color: #64748b; font-size: 14px; margin: 0;">
                Besoin d'aide ? Contactez notre équipe support
              </p>
              <a href="mailto:support@diaspomoney.fr" style="color: #3b82f6; text-decoration: none; font-weight: 500;">support@diaspomoney.fr</a>
            </div>
            <div style="text-align: center; border-top: 1px solid #e2e8f0; padding-top: 16px;">
              <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                © 2024 Diaspomoney. Tous droits réservés.<br>
                Cet email a été envoyé automatiquement, merci de ne pas y répondre.
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
  };
}

export function PasswordResetTemplate({
  name,
  resetUrl,
}: {
  name: string;
  resetUrl: string;
}) {
  return {
    subject: "🔒 Réinitialisation de votre mot de passe",
    html: `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Réinitialisation de mot de passe - Diaspomoney</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          
          <!-- Header avec gradient fintech -->
          <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 32px 24px; text-align: center;">
            <div style="background-color: rgba(255, 255, 255, 0.1); border-radius: 50%; width: 64px; height: 64px; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M2 17L12 22L22 17" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M2 12L12 17L22 12" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <h1 style="color: white; font-size: 28px; font-weight: 700; margin: 0; letter-spacing: -0.025em;">Diaspomoney</h1>
            <p style="color: rgba(255, 255, 255, 0.9); font-size: 16px; margin: 8px 0 0; font-weight: 500;">Sécurité de votre compte</p>
          </div>

          <!-- Contenu principal -->
          <div style="padding: 40px 32px;">
            <div style="text-align: center; margin-bottom: 32px;">
              <div style="background-color: #fef2f2; border: 2px solid #fecaca; border-radius: 50%; width: 80px; height: 80px; margin: 0 auto 24px; display: flex; align-items: center; justify-content: center;">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 22S8 18 8 12V5L12 3L16 5V12C16 18 12 22 12 22Z" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <h2 style="color: #1e293b; font-size: 24px; font-weight: 700; margin: 0 0 12px; letter-spacing: -0.025em;">Réinitialisation de mot de passe</h2>
              <p style="color: #64748b; font-size: 16px; margin: 0; line-height: 1.5;">Bonjour <strong style="color: #1e293b;">${name}</strong>,</p>
            </div>

            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px; margin-bottom: 32px;">
              <p style="color: #475569; font-size: 16px; margin: 0 0 16px; line-height: 1.6;">
                Nous avons reçu une demande de réinitialisation de mot de passe pour votre compte <strong style="color: #1e293b;">Diaspomoney</strong>. 
                Si vous n'avez pas fait cette demande, vous pouvez ignorer cet email en toute sécurité.
              </p>
              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 4px;">
                <p style="color: #92400e; font-size: 14px; margin: 0; font-weight: 500;">
                  ⏰ Ce lien de réinitialisation expirera dans 1 heure
                </p>
              </div>
            </div>

            <!-- Bouton de réinitialisation -->
            <div style="text-align: center; margin-bottom: 32px;">
              <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 14px 0 rgba(239, 68, 68, 0.4); transition: all 0.2s;">
                🔒 Réinitialiser mon mot de passe
              </a>
            </div>

            <!-- Informations de sécurité -->
            <div style="background-color: #f1f5f9; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
              <h3 style="color: #1e293b; font-size: 16px; font-weight: 600; margin: 0 0 12px; display: flex; align-items: center;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-right: 8px;">
                  <path d="M12 22S8 18 8 12V5L12 3L16 5V12C16 18 12 22 12 22Z" stroke="#3b82f6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                Conseils de sécurité
              </h3>
              <ul style="color: #64748b; font-size: 14px; margin: 0; padding-left: 20px; line-height: 1.5;">
                <li>Choisissez un mot de passe fort et unique</li>
                <li>N'utilisez jamais le même mot de passe sur plusieurs sites</li>
                <li>Activez l'authentification à deux facteurs</li>
              </ul>
            </div>

            <!-- Lien de secours -->
            <div style="text-align: center; padding: 20px; background-color: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
              <p style="color: #64748b; font-size: 14px; margin: 0 0 12px;">Le bouton ne fonctionne pas ?</p>
              <p style="color: #64748b; font-size: 12px; margin: 0; word-break: break-all;">Copiez et collez ce lien dans votre navigateur :</p>
              <p style="color: #3b82f6; font-size: 12px; margin: 8px 0 0; word-break: break-all;">${resetUrl}</p>
            </div>
          </div>

          <!-- Footer -->
          <div style="background-color: #f8fafc; padding: 24px 32px; border-top: 1px solid #e2e8f0;">
            <div style="text-align: center; margin-bottom: 16px;">
              <p style="color: #64748b; font-size: 14px; margin: 0;">
                Besoin d'aide ? Contactez notre équipe support
              </p>
              <a href="mailto:support@diaspomoney.fr" style="color: #3b82f6; text-decoration: none; font-weight: 500;">support@diaspomoney.fr</a>
            </div>
            <div style="text-align: center; border-top: 1px solid #e2e8f0; padding-top: 16px;">
              <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                © 2024 Diaspomoney. Tous droits réservés.<br>
                Cet email a été envoyé automatiquement, merci de ne pas y répondre.
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
  };
}

export function AppointmentConfirmationTemplate({
  name,
  appointmentDate,
  providerName,
  serviceName,
  appointmentUrl,
}: {
  name: string;
  appointmentDate: string;
  providerName: string;
  serviceName: string;
  appointmentUrl: string;
}) {
  return {
    subject: "Confirmation de rendez-vous - Diaspomoney",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1>Confirmation de rendez-vous</h1>
        <p>Bonjour ${name},</p>
        <p>Votre rendez-vous a été confirmé avec succès !</p>
        <div style="background: #f6f9fc; padding: 20px; border-radius: 4px; margin: 20px 0;">
          <p><strong>Date :</strong> ${appointmentDate}</p>
          <p><strong>Prestataire :</strong> ${providerName}</p>
          <p><strong>Service :</strong> ${serviceName}</p>
        </div>
        <a href="${appointmentUrl}" style="background: #000; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
          Voir les détails
        </a>
      </div>
    `,
  };
}