/**
 * API Route - Process Booking Payment with Card
 * Endpoint pour traiter le paiement d'une réservation avec les données de carte directement
 * Utilise PaymentFacade et ServiceBookingFacade
 */

import { auth } from '@/auth';
import { handleApiRoute, ApiErrors, validateBody } from '@/lib/api/error-handler';
import { ConfirmPaymentSchema, type ConfirmPaymentInput } from '@/lib/validations/booking-payment.schema';
import { serviceBookingFacade } from '@/facades/service-booking.facade';
import { emailService } from '@/services/email/email.service';
import { getStripeInstance } from '@/lib/stripe-config';
import { logger } from '@/lib/logger';
import { NextRequest } from 'next/server';
import * as Sentry from '@sentry/nextjs';

/**
 * POST /api/bookings/process-payment-with-card - Traiter le paiement d'une réservation avec les données de carte
 */
export async function POST(request: NextRequest) {
  return handleApiRoute(
    request,
    async () => {
      const session = await auth();
      if (!session?.user?.email || !session.user.id) {
        throw ApiErrors.UNAUTHORIZED;
      }

      // Validation avec Zod
      const body = await request.json();
      const validatedData: ConfirmPaymentInput = validateBody(body, ConfirmPaymentSchema);

      const { appointment, paymentData } = validatedData;

      // Vérifier que les données de carte sont présentes
      if (!paymentData.cardNumber || !paymentData.expiryDate || !paymentData.cvv || !paymentData.cardholderName) {
        throw new Error('Données de carte incomplètes');
      }

      // Parser la date d'expiration (format MM/YY ou MM/YYYY)
      const expiryDateStr = paymentData.expiryDate || '';
      const expiryParts = expiryDateStr.replace(/\s/g, '').split('/');
      if (expiryParts.length !== 2) {
        throw new Error('Format de date d\'expiration invalide (attendu: MM/YY ou MM/YYYY)');
      }
      
      const expiryMonth = parseInt(expiryParts[0] || '0', 10);
      let expiryYear = parseInt(expiryParts[1] || '0', 10);
      
      // Si l'année est à 2 chiffres, convertir en 4 chiffres
      if (expiryYear < 100) {
        expiryYear = 2000 + expiryYear;
      }

      // Nettoyer le numéro de carte (enlever les espaces)
      const cardNumber = paymentData.cardNumber.replace(/\s/g, '');

      try {
        const customerId = session.user.id;
        const serviceType = (appointment as any).serviceType || 'HEALTH';
        const serviceId = appointment.selectedService?.name || 'default';

        // Étape 1: Obtenir ou créer le customer Stripe
        const stripe = getStripeInstance();
        let stripeCustomerId: string;

        try {
          // Vérifier si le customer existe déjà dans Stripe
          const existingCustomers = await stripe.customers.list({
            email: session.user.email,
            limit: 1,
          });

          if (existingCustomers.data.length > 0 && existingCustomers.data[0]) {
            stripeCustomerId = existingCustomers.data[0].id;
          } else {
            // Créer un nouveau customer Stripe
            const customerName = appointment.requester
              ? `${appointment.requester.firstName} ${appointment.requester.lastName}`
              : undefined;
            
            const customerParams: any = {
              email: session.user.email,
              metadata: {
                userId: customerId,
              },
            };
            
            if (customerName) {
              customerParams.name = customerName;
            }
            
            const customer = await stripe.customers.create(customerParams);
            stripeCustomerId = customer.id;
            logger.info({ customerId: stripeCustomerId }, 'Stripe customer created');
          }
        } catch (error) {
          logger.error({ error, customerId }, 'Error managing Stripe customer');
          throw new Error('Erreur lors de la gestion du client Stripe', { cause: error });
        }

        // Étape 2: Créer une méthode de paiement temporaire avec Stripe
        // Note: Pour des raisons de sécurité PCI-DSS, les données de carte complètes ne devraient
        // normalement pas transiter par le serveur. Cette implémentation utilise l'API Stripe
        // qui permet de créer un PaymentMethod avec les données de carte pour les clients autorisés.
        // En production idéale, utilisez Stripe Elements côté client.
        logger.info({ cardLast4: cardNumber.slice(-4), amount: paymentData.amount }, 'Creating PaymentMethod and PaymentIntent');
        
        // Créer une méthode de paiement
        const paymentMethodParams: any = {
          type: 'card',
          card: {
            number: cardNumber,
            exp_month: expiryMonth,
            exp_year: expiryYear,
            cvc: paymentData.cvv || '',
          },
          billing_details: {
            name: paymentData.cardholderName,
          },
        };
        
        if (appointment.requester?.email) {
          paymentMethodParams.billing_details.email = appointment.requester.email;
        }
        
        if (appointment.requester?.phone) {
          paymentMethodParams.billing_details.phone = appointment.requester.phone;
        }
        
        const paymentMethod = await stripe.paymentMethods.create(paymentMethodParams);

        logger.info({ paymentMethodId: paymentMethod.id }, 'PaymentMethod created');

        // Attacher la méthode de paiement au customer
        await stripe.paymentMethods.attach(paymentMethod.id, {
          customer: stripeCustomerId,
        });

        // Créer un PaymentIntent avec la méthode de paiement
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(paymentData.amount * 100), // Convertir en centimes
          currency: (paymentData.currency || 'EUR').toLowerCase(),
          customer: stripeCustomerId,
          payment_method: paymentMethod.id,
          confirmation_method: 'automatic',
          capture_method: 'automatic',
          confirm: true, // Confirmer automatiquement
          metadata: {
            userId: customerId,
            appointmentId: appointment.id || (appointment as any)._id || '',
            providerId: appointment.provider?.id || '',
            serviceName: appointment.selectedService?.name || '',
            serviceType: serviceType,
          },
        });

        logger.info({ paymentIntentId: paymentIntent.id, status: paymentIntent.status }, 'PaymentIntent created and confirmed');

        // Vérifier le statut du paiement
        if (paymentIntent.status === 'requires_action') {
          // Le paiement nécessite une action (3D Secure, etc.)
          throw new Error('Le paiement nécessite une authentification supplémentaire (3D Secure). Veuillez utiliser Stripe Elements côté client.');
        }

        if (paymentIntent.status !== 'succeeded') {
          throw new Error(`Le paiement n'a pas réussi. Statut: ${paymentIntent.status}`);
        }

        // Étape 3: Utiliser PaymentFacade pour créer la transaction et la facture
        const paymentFacadeData = {
          amount: paymentData.amount,
          currency: paymentData.currency || 'EUR',
          customerId: customerId,
          paymentMethodId: paymentMethod.id,
          payerId: customerId,
          beneficiaryId: customerId,
          serviceType: serviceType as 'HEALTH' | 'BTP' | 'EDUCATION',
          serviceId: serviceId,
          description: `Paiement pour réservation - ${appointment.selectedService?.name || 'Service'}`,
          createInvoice: true,
          sendNotification: true,
          metadata: {
            appointmentId: appointment.id || (appointment as any)._id || '',
            providerId: appointment.provider?.id || '',
            serviceName: appointment.selectedService?.name || '',
            paymentIntentId: paymentIntent.id,
          },
        };

        logger.info({ paymentFacadeData }, 'Creating transaction and invoice via services');
        
        // Créer la transaction et la facture via les services
        // Note: Le paiement est déjà confirmé, on crée juste les enregistrements
        const { transactionService } = await import('@/services/transaction/transaction.service');
        const { invoiceService } = await import('@/services/invoice/invoice.service');
        
        // Créer la transaction
        const transaction = await transactionService.createTransaction({
          payerId: customerId,
          beneficiaryId: customerId, // Pour les services, le bénéficiaire est le payeur
          amount: paymentData.amount,
          currency: paymentData.currency || 'EUR',
          serviceType: serviceType as 'HEALTH' | 'BTP' | 'EDUCATION',
          serviceId: serviceId,
          description: paymentFacadeData.description,
          metadata: {
            ...paymentFacadeData.metadata,
            paymentIntentId: paymentIntent.id,
          },
        });

        // Créer la facture
        const invoice = await invoiceService.createInvoice({
          userId: customerId,
          amount: paymentData.amount,
          currency: paymentData.currency || 'EUR',
          transactionId: transaction.id,
          items: [
            {
              description: paymentFacadeData.description,
              quantity: 1,
              unitPrice: paymentData.amount,
              total: paymentData.amount,
            },
          ],
          metadata: paymentFacadeData.metadata,
        });

        const paymentResult = {
          success: true,
          paymentIntentId: paymentIntent.id,
          transactionId: transaction.id,
          invoiceId: invoice.id,
        };

        // Étape 4: Créer la réservation via ServiceBookingFacade
        const bookingData = {
          requesterId: customerId,
          providerId: appointment.provider?.id || '',
          serviceId: serviceId,
          serviceType: serviceType as 'HEALTH' | 'BTP' | 'EDUCATION',
          appointmentDate: appointment.timeslot ? new Date(appointment.timeslot) : new Date(),
          timeslot: appointment.timeslot,
          consultationMode: (appointment as any).consultationMode || 'IN_PERSON',
          recipient: appointment.recipient
            ? {
                firstName: appointment.recipient.firstName,
                lastName: appointment.recipient.lastName,
                phone: appointment.recipient.phone || '',
              }
            : undefined,
          metadata: {
            paymentIntentId: paymentResult.paymentIntentId,
            transactionId: paymentResult.transactionId,
            invoiceId: paymentResult.invoiceId,
            ...(appointment.selectedService && { serviceName: appointment.selectedService.name }),
          },
        };

        logger.info({ bookingData }, 'Creating booking via ServiceBookingFacade');
        const bookingResult = await serviceBookingFacade.createBookingWithPayment({
          ...bookingData,
          payment: undefined, // Le paiement est déjà traité
        });

        if (!bookingResult.success || !bookingResult.booking) {
          logger.error({ bookingResult }, 'Booking creation failed');
          throw new Error(bookingResult.error || 'Erreur lors de la création de la réservation');
        }

        // Générer un numéro de réservation
        const bookingId = bookingResult.booking.id || (bookingResult.booking as any)._id;
        const reservationNumber = `RES-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}-${bookingId.slice(-4).toUpperCase()}`;

        // Étape 5: Envoyer les emails de confirmation
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
            bookingId,
            paymentIntentId: paymentResult.paymentIntentId,
            transactionId: paymentResult.transactionId,
            requesterEmail,
          },
          'Booking payment processed successfully and confirmation emails sent',
        );

        return {
          success: true,
          message: 'Paiement traité et réservation créée avec succès',
          reservationNumber,
          bookingId,
          paymentIntentId: paymentResult.paymentIntentId,
          transactionId: paymentResult.transactionId,
          invoiceId: paymentResult.invoiceId,
        };
      } catch (error) {
        logger.error({ error, appointment, paymentData: { amount: paymentData.amount } }, 'Error processing booking payment');
        Sentry.captureException(error, {
          tags: {
            component: 'BookingPaymentAPI',
            action: 'process-payment-with-card',
          },
          extra: {
            appointmentId: appointment.id || (appointment as any)._id,
          },
        });
        throw error;
      }
    },
    'api/bookings/process-payment-with-card',
  );
}
