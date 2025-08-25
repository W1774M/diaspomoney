import nodemailer from "nodemailer";

// Configuration du transporteur email
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false, // true pour 465, false pour les autres ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Email de récupération de mot de passe
export async function sendPasswordResetEmail(
  email: string,
  token: string,
  firstName: string
) {
  const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`;

  const mailOptions = {
    from: `"DiaspoMoney" <${process.env.SMTP_USER}>`,
    to: email,
    subject: "Récupération de mot de passe - DiaspoMoney",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #3B82F6, #1E40AF); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">DiaspoMoney</h1>
          <p style="color: #E0E7FF; margin: 10px 0 0 0;">Récupération de mot de passe</p>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <h2 style="color: #1F2937; margin-bottom: 20px;">Bonjour ${firstName},</h2>
          
          <p style="color: #4B5563; line-height: 1.6; margin-bottom: 20px;">
            Vous avez demandé la récupération de votre mot de passe pour votre compte DiaspoMoney.
          </p>
          
          <p style="color: #4B5563; line-height: 1.6; margin-bottom: 30px;">
            Cliquez sur le bouton ci-dessous pour définir un nouveau mot de passe :
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background: linear-gradient(135deg, #3B82F6, #1E40AF); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              Réinitialiser mon mot de passe
            </a>
          </div>
          
          <p style="color: #6B7280; font-size: 14px; margin-top: 30px;">
            Ce lien expirera dans 1 heure. Si vous n'avez pas demandé cette récupération, 
            vous pouvez ignorer cet email en toute sécurité.
          </p>
          
          <p style="color: #6B7280; font-size: 14px;">
            Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :<br>
            <a href="${resetUrl}" style="color: #3B82F6;">${resetUrl}</a>
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 20px; color: #6B7280; font-size: 12px;">
          <p>© 2024 DiaspoMoney. Tous droits réservés.</p>
        </div>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
}

// Email de vérification d'email
export async function sendEmailVerification(
  email: string,
  token: string,
  firstName: string
) {
  const verifyUrl = `${process.env.NEXTAUTH_URL}/verify-email?token=${token}`;

  const mailOptions = {
    from: `"DiaspoMoney" <${process.env.SMTP_USER}>`,
    to: email,
    subject: "Vérification de votre email - DiaspoMoney",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #10B981, #059669); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">DiaspoMoney</h1>
          <p style="color: #D1FAE5; margin: 10px 0 0 0;">Vérification de votre compte</p>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <h2 style="color: #1F2937; margin-bottom: 20px;">Bonjour ${firstName},</h2>
          
          <p style="color: #4B5563; line-height: 1.6; margin-bottom: 20px;">
            Merci de vous être inscrit sur DiaspoMoney ! Pour activer votre compte, 
            veuillez vérifier votre adresse email.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verifyUrl}" style="background: linear-gradient(135deg, #10B981, #059669); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              Vérifier mon email
            </a>
          </div>
          
          <p style="color: #6B7280; font-size: 14px; margin-top: 30px;">
            Ce lien expirera dans 24 heures. Si vous n'avez pas créé de compte, 
            vous pouvez ignorer cet email.
          </p>
          
          <p style="color: #6B7280; font-size: 14px;">
            Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :<br>
            <a href="${verifyUrl}" style="color: #10B981;">${verifyUrl}</a>
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 20px; color: #6B7280; font-size: 12px;">
          <p>© 2024 DiaspoMoney. Tous droits réservés.</p>
        </div>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
}
