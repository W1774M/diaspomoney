import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { isSupportAgent } from '@/lib/support/impersonation-policy';
import { emailService, testEmailService } from '@/services/email/email.service';

/**
 * Envoi d'e-mails d'essai : réservé aux administrateurs. Ouverte à tous, cette route
 * laissait n'importe qui envoyer, depuis l'adresse DiaspoMoney, un e-mail au sujet et au
 * contenu HTML libres vers n'importe quelle adresse (relais d'hameçonnage).
 */
async function requireAdmin(): Promise<NextResponse | null> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }
  if (!isSupportAgent(session.user.roles)) {
    return NextResponse.json({ error: 'Accès réservé aux administrateurs' }, { status: 403 });
  }
  return null;
}

export async function POST(request: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const { type, email, data = {} } = await request.json();

    // Vérifier que l'email est fourni
    if (!email) {
      return NextResponse.json(
        { error: 'Email requis' },
        { status: 400 },
      );
    }

    let result = false;

    switch (type) {
      case 'welcome':
        {
          const { cleanUrl } = await import('@/lib/utils');
          const baseUrl = cleanUrl(process.env['NEXT_PUBLIC_APP_URL']);
          result = await emailService.sendWelcomeEmail(
            email,
            data.name || 'Test User',
            data.verificationUrl || `${baseUrl}/verify?token=test`,
          );
        }
        break;

      case 'password_reset':
        {
          const { cleanUrl } = await import('@/lib/utils');
          const baseUrl = cleanUrl(process.env['NEXT_PUBLIC_APP_URL']);
          result = await emailService.sendPasswordResetEmail(
            email,
            data.name || 'Test User',
            data.resetUrl || `${baseUrl}/reset?token=test`,
          );
        }
        break;

      case 'payment_confirmation':
        result = await emailService.sendPaymentConfirmationEmail(
          email,
          data.name || 'Test User',
          data.amount || 100,
          data.currency || 'EUR',
          data.service || 'Service Test',
        );
        break;

      case 'appointment_notification':
        result = await emailService.sendAppointmentNotificationEmail(
          email,
          data.name || 'Test User',
          data.provider || 'Dr. Test',
          data.date || new Date().toLocaleDateString('fr-FR'),
          data.time || '14:00',
          data.appointmentType || 'confirmation',
        );
        break;

      case 'custom':
        result = await emailService.sendCustomEmail(
          email,
          data.subject || 'Test Email',
          data.html || '<p>Test email personnalisé</p>',
          data.text || 'Test email personnalisé',
        );
        break;

      case 'service_test':
        result = await testEmailService();
        break;

      default:
        return NextResponse.json(
          { error: 'Type d\'email non supporté' },
          { status: 400 },
        );
    }

    if (result) {
      return NextResponse.json({
        success: true,
        message: `Email ${type} envoyé avec succès`,
        timestamp: new Date().toISOString(),
      });
    } else {
      return NextResponse.json(
        { error: `Échec envoi email ${type}` },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error('❌ Erreur API email test:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 },
    );
  }
}

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    // Obtenir les statistiques de la queue
    const stats = emailService.getQueueStats();
    
    // Test de connexion
    const connectionTest = await emailService.testConnection();
    
    return NextResponse.json({
      service: 'Email Service',
      status: 'active',
      connection: connectionTest ? 'connected' : 'disconnected',
      queue: stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Erreur API email status:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 },
    );
  }
}
