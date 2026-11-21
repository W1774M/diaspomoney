import { NextRequest, NextResponse } from 'next/server';
import { handleApiRoute } from '@/lib/api/error-handler';
import { childLogger } from '@/lib/logger';
import { z } from 'zod';
import { getMongoClient } from '@/lib/database/mongodb';
import { sendEmail } from '@/lib/email/resend';

const log = childLogger({ route: 'api/roadmap/subscribe' });

// Schéma de validation
const SubscribeSchema = z.object({
  email: z.string().email('Email invalide').toLowerCase().trim(),
});

// Interface pour un document d'abonnement roadmap
interface RoadmapSubscription {
  _id?: string;
  email: string;
  subscribedAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export async function POST(request: NextRequest) {
  return handleApiRoute(
    request,
    async () => {
      const body = await request.json();
      const { email } = SubscribeSchema.parse(body);

      log.info({ email }, 'Tentative d\'inscription aux notifications roadmap');

      // Connexion à MongoDB
      const client = await getMongoClient();
      const db = client.db();
      const subscriptionsCollection = db.collection<RoadmapSubscription>(
        'roadmap_subscriptions',
      );

      // Créer un index unique sur l'email si ce n'est pas déjà fait
      try {
        await subscriptionsCollection.createIndex({ email: 1 }, { unique: true });
      } catch (error) {
        // L'index existe peut-être déjà, on continue
        log.debug({ error }, 'Index creation (may already exist)');
      }

      // Vérifier si l'email est déjà inscrit
      const existing = await subscriptionsCollection.findOne({ email });

      if (existing) {
        log.info({ email }, 'Email déjà inscrit');
        return NextResponse.json(
          {
            success: true,
            message: 'Vous êtes déjà inscrit aux notifications de roadmap',
            alreadySubscribed: true,
          },
          { status: 200 },
        );
      }

      // Créer l'inscription
      await subscriptionsCollection.insertOne({
        email,
        subscribedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      log.info({ email }, 'Inscription réussie');

      // Envoyer un email de confirmation
      try {
        const emailSubject = 'Bienvenue dans les notifications de roadmap Diaspomoney';
        const emailHtml = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Inscription confirmée</title>
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4;">
              <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px;">
                <div style="background-color: #F97015; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
                  <h1 style="margin: 0; font-size: 24px;">🎉 Inscription confirmée !</h1>
                </div>
                <div style="padding: 30px 20px;">
                  <p style="font-size: 16px; margin-bottom: 20px;">
                    Bonjour,
                  </p>
                  <p style="font-size: 16px; margin-bottom: 20px;">
                    Merci de vous être inscrit pour recevoir les notifications sur les nouveautés de <strong>Diaspomoney</strong> !
                  </p>
                  <p style="font-size: 16px; margin-bottom: 20px;">
                    Vous serez informé en priorité des prochaines fonctionnalités :
                  </p>
                  <ul style="font-size: 16px; margin-bottom: 20px; padding-left: 20px;">
                    <li>📱 Application Mobile (iOS & Android)</li>
                    <li>🔌 API Développeurs</li>
                    <li>🌍 Extension vers de nouveaux pays</li>
                    <li>🔔 Notifications avancées</li>
                  </ul>
                  <p style="font-size: 16px; margin-bottom: 20px;">
                    Restez connecté pour ne rien manquer !
                  </p>
                  <p style="font-size: 14px; color: #666; margin-top: 30px;">
                    L'équipe Diaspomoney
                  </p>
                </div>
                <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px; color: #666;">
                  <p style="margin: 0;">
                    Si vous n'avez pas demandé cette inscription, vous pouvez ignorer cet email.
                  </p>
                </div>
              </div>
            </body>
          </html>
        `;

        await sendEmail({
          to: email,
          subject: emailSubject,
          html: emailHtml,
        });

        log.info({ email }, 'Email de confirmation envoyé');
      } catch (emailError) {
        // Ne pas faire échouer l'inscription si l'email échoue
        log.warn(
          { email, error: emailError },
          'Échec envoi email de confirmation (inscription quand même enregistrée)',
        );
      }

      return NextResponse.json(
        {
          success: true,
          message: 'Inscription réussie ! Vous recevrez un email de confirmation.',
        },
        { status: 201 },
      );
    },
    'api/roadmap/subscribe',
  );
}
