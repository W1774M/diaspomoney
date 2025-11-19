/**
 * API Route - Booking Payment Error
 * Endpoint pour envoyer un email d'erreur de paiement
 * Utilise EmailService (Service Layer Pattern)
 */

import { auth } from '@/auth';
import { handleApiRoute, ApiErrors, validateBody } from '@/lib/api/error-handler';
import { emailService } from '@/services/email/email.service';
import { logger } from '@/lib/logger';
import { NextRequest } from 'next/server';
import { z } from 'zod';

/**
 * Schéma de validation pour l'erreur de paiement
 */
const PaymentErrorSchema = z.object({
  appointment: z.object({
    _id: z.string().optional(),
    id: z.string().optional(),
    selectedService: z.object({
      name: z.string(),
      price: z.number(),
    }).optional(),
    provider: z.object({
      id: z.string(),
      name: z.string(),
    }).optional(),
    requester: z.object({
      firstName: z.string(),
      lastName: z.string(),
      email: z.string().email(),
      phone: z.string().optional(),
    }).optional(),
    recipient: z.object({
      firstName: z.string(),
      lastName: z.string(),
      phone: z.string().optional(),
    }).optional(),
    timeslot: z.string().optional(),
  }),
  paymentData: z.object({
    amount: z.number().positive(),
    currency: z.string().length(3),
    cardNumber: z.string().optional(),
    expiryDate: z.string().optional(),
    cvv: z.string().optional(),
    cardholderName: z.string().optional(),
  }),
  errorMessage: z.string().min(1),
});

/**
 * POST /api/bookings/payment-error - Envoyer un email d'erreur de paiement
 */
export async function POST(request: NextRequest) {
  return handleApiRoute(
    request,
    async () => {
      const session = await auth();
      if (!session?.user?.email) {
        throw ApiErrors.UNAUTHORIZED;
      }

      // Valider le body avec Zod
      const body = await request.json();
      const validatedData = validateBody(body, PaymentErrorSchema);

      const { appointment, paymentData, errorMessage } = validatedData;

      // Générer un lien de retry (valide 15 minutes)
      const retryToken = Buffer.from(
        JSON.stringify({
          appointmentId: appointment._id || appointment.id,
          timestamp: Date.now(),
        }),
      ).toString('base64');

      const retryUrl = `${process.env['NEXTAUTH_URL'] || 'http://localhost:3000'}/retry-payment?token=${retryToken}`;

      // Formatage de la date
      const formattedDate = appointment.timeslot
        ? new Date(appointment.timeslot).toLocaleDateString('fr-FR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })
        : 'Non spécifié';

      const requesterName = appointment.requester
        ? `${appointment.requester.firstName} ${appointment.requester.lastName}`
        : 'Client';

      const emailSubject = 'Erreur de paiement - Action requise - DiaspoMoney';

      const emailHTML = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Erreur de paiement - DiaspoMoney</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .section { background: white; margin: 20px 0; padding: 20px; border-radius: 8px; border-left: 4px solid #f5576c; }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>⚠️ Erreur de paiement</h1>
            <p>Une erreur s'est produite lors du traitement de votre paiement</p>
        </div>
        
        <div class="content">
            <div class="section">
                <h3>📋 Détails de la réservation</h3>
                <p><strong>Service :</strong> ${appointment.selectedService?.name || 'N/A'}</p>
                <p><strong>Prestataire :</strong> ${appointment.provider?.name || 'N/A'}</p>
                <p><strong>Date :</strong> ${formattedDate}</p>
                <p><strong>Montant :</strong> ${paymentData.amount} ${paymentData.currency}</p>
            </div>

            <div class="section">
                <h3>❌ Erreur détectée</h3>
                <p>${errorMessage}</p>
            </div>

            <div class="section">
                <h3>🔄 Réessayer le paiement</h3>
                <p>Vous pouvez réessayer le paiement en cliquant sur le lien ci-dessous. Ce lien est valide pendant 15 minutes.</p>
                <div style="text-align: center; margin: 20px 0;">
                    <a href="${retryUrl}" class="button">Réessayer le paiement</a>
                </div>
                <p style="font-size: 12px; color: #666; margin-top: 10px;">
                    Si le bouton ne fonctionne pas, copiez ce lien : ${retryUrl}
                </p>
            </div>

            <div class="section">
                <h3>ℹ️ Besoin d'aide ?</h3>
                <p>Si le problème persiste, n'hésitez pas à nous contacter :</p>
                <ul>
                    <li>Email : contact@diaspomoney.fr</li>
                    <li>Support disponible 7j/7</li>
                </ul>
            </div>
        </div>

        <div class="footer">
            <p>Ce message a été envoyé automatiquement par DiaspoMoney</p>
            <p>© 2024 DiaspoMoney - Tous droits réservés</p>
        </div>
    </div>
</body>
</html>
      `;

      const emailText = `
Erreur de paiement - Action requise

Bonjour ${requesterName},

Une erreur s'est produite lors du traitement de votre paiement.

Détails de la réservation :
- Service : ${appointment.selectedService?.name || 'N/A'}
- Prestataire : ${appointment.provider?.name || 'N/A'}
- Date : ${formattedDate}
- Montant : ${paymentData.amount} ${paymentData.currency}

Erreur : ${errorMessage}

Réessayer le paiement :
Vous pouvez réessayer le paiement en utilisant ce lien (valide 15 minutes) :
${retryUrl}

Besoin d'aide ?
Si le problème persiste, contactez-nous à contact@diaspomoney.fr

Cordialement,
L'équipe DiaspoMoney
      `;

      // Envoyer les emails via EmailService
      const contactEmail = process.env['EMAIL_CONTACT'] || 'contact@diaspomoney.fr';
      const requesterEmail = appointment.requester?.email;

      const emailPromises: Promise<boolean>[] = [];

      // Email à contact@diaspomoney.fr
      if (contactEmail) {
        emailPromises.push(
          emailService.sendCustomEmail(
            contactEmail,
            emailSubject,
            emailHTML,
            emailText,
          ),
        );
      }

      // Email au client
      if (requesterEmail) {
        emailPromises.push(
          emailService.sendCustomEmail(
            requesterEmail,
            emailSubject,
            emailHTML,
            emailText,
          ),
        );
      }

      // Envoyer tous les emails en parallèle
      await Promise.all(emailPromises);

      logger.info(
        {
          appointmentId: appointment._id || appointment.id,
          requesterEmail,
          errorMessage,
        },
        'Payment error email sent successfully',
      );

      return {
        success: true,
        message: "Email d'erreur envoyé avec succès",
      };
    },
    'api/bookings/payment-error',
  );
}

