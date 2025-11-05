import nodemailer from 'nodemailer';

export const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env['SMTP_HOST'] || 'localhost',
    port: parseInt(process.env['SMTP_PORT'] || '587'),
    secure: false,
    auth: {
      user: process.env['SMTP_USER'],
      pass: process.env['SMTP_PASS'],
    },
  });
};

export const sendEmail = async (to: string, subject: string, html: string) => {
  const transporter = createTransporter();
  return await transporter.sendMail({
    from: process.env['SMTP_FROM'],
    to,
    subject,
    html,
  });
};

export const sendEmailVerification = async (email: string, token: string) => {
  const verificationUrl = `${process.env['NEXT_PUBLIC_URL']}/verify-email?token=${token}`;
  const html = `
    <h1>Vérification de votre email</h1>
    <p>Cliquez sur le lien ci-dessous pour vérifier votre email :</p>
    <a href="${verificationUrl}">Vérifier mon email</a>
  `;
  return await sendEmail(email, 'Vérification de votre email', html);
};
