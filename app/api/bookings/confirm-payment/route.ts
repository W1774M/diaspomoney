/**
 * API Route - Confirm Booking Payment
 * Endpoint pour confirmer le paiement d'une réservation
 * Utilise BookingFacade et EmailService (Facade Pattern + Service Layer Pattern)
 */

import { auth } from '@/auth';
import { handleApiRoute, ApiErrors, validateBody } from '@/lib/api/error-handler';
import { emailService } from '@/services/email/email.service';
import { logger } from '@/lib/logger';
import { NextRequest } from 'next/server';
import { z } from 'zod';

/**
 * Schéma de validation pour la confirmation de paiement
 */
const ConfirmPaymentSchema = z.object({
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
});

/**
 * POST /api/bookings/confirm-payment - Confirmer le paiement d'une réservation
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
      const validatedData = validateBody(body, ConfirmPaymentSchema);

      const { appointment, paymentData } = validatedData;

      // Génération d'un numéro de réservation unique
      const reservationNumber = `RES-${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 11)
        .toUpperCase()}`;

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

      // Préparer le contenu de l'email de confirmation
      const requesterName = appointment.requester
        ? `${appointment.requester.firstName} ${appointment.requester.lastName}`
        : 'Client';

      const emailSubject = `Confirmation de réservation - ${reservationNumber} - DiaspoMoney`;

      const emailHTML = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Confirmation de réservation - DiaspoMoney</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .section { background: white; margin: 20px 0; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; }
        .highlight { background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .price { font-size: 24px; font-weight: bold; color: #667eea; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 Confirmation de réservation</h1>
            <p>Votre réservation a été confirmée avec succès !</p>
        </div>
        
        <div class="content">
            <div class="highlight">
                <h2>Numéro de réservation : ${reservationNumber}</h2>
                <p>Date et heure : ${formattedDate}</p>
            </div>

            <div class="section">
                <h3>📋 Détails de la réservation</h3>
                <p><strong>Service :</strong> ${appointment.selectedService?.name || 'N/A'}</p>
                <p><strong>Prestataire :</strong> ${appointment.provider?.name || 'N/A'}</p>
                <p><strong>Prix :</strong> <span class="price">${paymentData.amount} ${paymentData.currency}</span></p>
                <p><strong>Statut :</strong> <span style="color: green; font-weight: bold;">✅ Paiement confirmé</span></p>
            </div>

            <div class="section">
                <h3>ℹ️ Informations importantes</h3>
                <ul>
                    <li>Présentez-vous 10 minutes avant l'heure du rendez-vous</li>
                    <li>Apportez une pièce d'identité</li>
                    <li>Annulation gratuite possible jusqu'à 24h avant le rendez-vous</li>
                    <li>En cas de problème, contactez-nous au support</li>
                </ul>
            </div>
        </div>

        <div class="footer">
            <p>Ce message a été envoyé automatiquement par DiaspoMoney</p>
            <p>Pour toute question, contactez-nous à contact@diaspomoney.fr</p>
            <p>© 2024 DiaspoMoney - Tous droits réservés</p>
        </div>
    </div>
</body>
</html>
      `;

      const emailText = `
Confirmation de réservation - ${reservationNumber}

Bonjour ${requesterName},

Votre réservation a été confirmée avec succès !

Numéro de réservation : ${reservationNumber}
Date et heure : ${formattedDate}
Service : ${appointment.selectedService?.name || 'N/A'}
Prestataire : ${appointment.provider?.name || 'N/A'}
Prix : ${paymentData.amount} ${paymentData.currency}
Statut : ✅ Paiement confirmé

Informations importantes :
- Présentez-vous 10 minutes avant l'heure du rendez-vous
- Apportez une pièce d'identité
- Annulation gratuite possible jusqu'à 24h avant le rendez-vous
- En cas de problème, contactez-nous au support

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
          reservationNumber,
          requesterEmail,
          amount: paymentData.amount,
        },
        'Booking payment confirmed and confirmation emails sent',
      );

      return {
        success: true,
        message: 'Paiement confirmé et emails envoyés avec succès',
        reservationNumber,
      };
    },
    'api/bookings/confirm-payment',
  );
}

