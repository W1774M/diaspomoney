import {
  sendAppointmentNotificationEmail,
  sendEmail,
  sendPasswordResetEmail,
  sendPaymentConfirmationEmail,
  sendWelcomeEmail,
  testEmailConnection,
} from '@/lib/email/resend';
import type {
  EmailOptions,
  EmailQueueItem,
  EmailServiceConfig,
} from '@/types/email';

export class EmailService {
  // private config: EmailServiceConfig;
  private queue: EmailQueueItem[] = [];
  private isProcessing = false;

  constructor(_config: EmailServiceConfig) {
    // this.config = config;
  }

  // Test de connexion Resend
  async testConnection(): Promise<boolean> {
    try {
      console.log('🧪 Test de connexion Resend...');
      const result = await testEmailConnection();

      if (result) {
        console.log('✅ Connexion Resend réussie');
        return true;
      } else {
        console.error('❌ Connexion Resend échouée');
        return false;
      }
    } catch (error) {
      console.error('❌ Erreur test Resend:', error);
      return false;
    }
  }

  // Envoi d'email de bienvenue
  async sendWelcomeEmail(
    email: string,
    name: string,
    verificationUrl: string
  ): Promise<boolean> {
    try {
      console.log(`📧 Envoi email de bienvenue à ${email}`);

      const result = await sendWelcomeEmail(email, name, verificationUrl);

      if (result) {
        console.log('✅ Email de bienvenue envoyé avec succès');
        return true;
      } else {
        console.error('❌ Échec envoi email de bienvenue');
        return false;
      }
    } catch (error) {
      console.error('❌ Erreur envoi email de bienvenue:', error);
      return false;
    }
  }

  // Envoi d'email de réinitialisation de mot de passe
  async sendPasswordResetEmail(
    email: string,
    name: string,
    resetUrl: string
  ): Promise<boolean> {
    try {
      console.log(`📧 Envoi email de réinitialisation à ${email}`);

      const result = await sendPasswordResetEmail(email, name, resetUrl);

      if (result) {
        console.log('✅ Email de réinitialisation envoyé avec succès');
        return true;
      } else {
        console.error('❌ Échec envoi email de réinitialisation');
        return false;
      }
    } catch (error) {
      console.error('❌ Erreur envoi email de réinitialisation:', error);
      return false;
    }
  }

  // Envoi d'email de confirmation de paiement
  async sendPaymentConfirmationEmail(
    email: string,
    name: string,
    amount: number,
    currency: string,
    service: string
  ): Promise<boolean> {
    try {
      console.log(`📧 Envoi email de confirmation de paiement à ${email}`);

      const result = await sendPaymentConfirmationEmail(
        email,
        name,
        amount,
        currency,
        service
      );

      if (result) {
        console.log('✅ Email de confirmation de paiement envoyé avec succès');
        return true;
      } else {
        console.error('❌ Échec envoi email de confirmation de paiement');
        return false;
      }
    } catch (error) {
      console.error(
        '❌ Erreur envoi email de confirmation de paiement:',
        error
      );
      return false;
    }
  }

  // Envoi d'email de notification de rendez-vous
  async sendAppointmentNotificationEmail(
    email: string,
    name: string,
    provider: string,
    date: string,
    time: string,
    type: 'confirmation' | 'reminder'
  ): Promise<boolean> {
    try {
      console.log(`📧 Envoi email de notification de rendez-vous à ${email}`);

      const result = await sendAppointmentNotificationEmail(
        email,
        name,
        provider,
        date,
        time,
        type
      );

      if (result) {
        console.log(
          '✅ Email de notification de rendez-vous envoyé avec succès'
        );
        return true;
      } else {
        console.error('❌ Échec envoi email de notification de rendez-vous');
        return false;
      }
    } catch (error) {
      console.error(
        '❌ Erreur envoi email de notification de rendez-vous:',
        error
      );
      return false;
    }
  }

  // Envoi d'email personnalisé
  async sendCustomEmail(
    to: string | string[],
    subject: string,
    html: string,
    text?: string,
    tags?: Array<{ name: string; value: string }>
  ): Promise<boolean> {
    try {
      console.log(
        `📧 Envoi email personnalisé à ${Array.isArray(to) ? to.join(', ') : to}`
      );
      await sendEmail({
        to,
        subject,
        html,
        text: typeof text === 'string' ? text : '',
        tags: Array.isArray(tags) && tags.length > 0 ? tags : [],
      } as EmailOptions);
      return true;
    } catch (error) {
      console.error('❌ Erreur envoi email personnalisé :', error);
      return false;
    }
  }

  // Ajouter un email à la queue
  addToQueue(
    type: string,
    to: string | string[],
    data: any,
    priority: 'high' | 'normal' | 'low' = 'normal',
    scheduledAt?: Date
  ): string {
    const id = `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const queueItem: EmailQueueItem = {
      id,
      type,
      to: Array.isArray(to) ? (to[0] ?? '') : (to ?? ''),
      data,
      priority,
      scheduledAt: scheduledAt || new Date(),
      attempts: 0,
      maxAttempts: 3,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.queue.push(queueItem);
    console.log(`📧 Email ajouté à la queue: ${id}`);

    return id;
  }

  // Traiter la queue d'emails
  async processQueue(): Promise<void> {
    if (this.isProcessing) {
      console.log('⏳ Queue déjà en cours de traitement');
      return;
    }

    this.isProcessing = true;
    console.log("🔄 Traitement de la queue d'emails...");

    try {
      const pendingEmails = this.queue.filter(
        email =>
          email.status === 'pending' &&
          (!email.scheduledAt || email.scheduledAt <= new Date())
      );

      // Trier par priorité
      pendingEmails.sort((a, b) => {
        const priorityOrder = { high: 3, normal: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });

      for (const email of pendingEmails) {
        await this.processEmail(email);
      }

      console.log(`✅ Queue traitée: ${pendingEmails.length} emails`);
    } catch (error) {
      console.error('❌ Erreur traitement queue:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  // Traiter un email individuel
  private async processEmail(email: EmailQueueItem): Promise<void> {
    try {
      email.status = 'processing';
      email.attempts++;
      email.updatedAt = new Date();

      console.log(
        `📧 Traitement email ${email.id} (tentative ${email.attempts})`
      );

      let result = false;

      switch (email.type) {
        case 'welcome':
          result = await this.sendWelcomeEmail(
            Array.isArray(email.to) ? email.to[0] : email.to,
            email.data.name,
            email.data.verificationUrl
          );
          break;

        case 'password_reset':
          result = await this.sendPasswordResetEmail(
            Array.isArray(email.to) ? email.to[0] : email.to,
            email.data.name,
            email.data.resetUrl
          );
          break;

        case 'payment_confirmation':
          result = await this.sendPaymentConfirmationEmail(
            Array.isArray(email.to) ? email.to[0] : email.to,
            email.data.name,
            email.data.amount,
            email.data.currency,
            email.data.service
          );
          break;

        case 'appointment_notification':
          result = await this.sendAppointmentNotificationEmail(
            Array.isArray(email.to) ? email.to[0] : email.to,
            email.data.name,
            email.data.provider,
            email.data.date,
            email.data.time,
            email.data.type
          );
          break;

        default:
          result = await this.sendCustomEmail(
            email.to,
            email.data.subject,
            email.data.html,
            email.data.text,
            email.data.tags
          );
      }

      if (result) {
        email.status = 'sent';
        console.log(`✅ Email ${email.id} envoyé avec succès`);
      } else {
        if (email.attempts >= email.maxAttempts) {
          email.status = 'failed';
          console.error(`❌ Email ${email.id} échoué définitivement`);
        } else {
          email.status = 'pending';
          console.log(`⏳ Email ${email.id} sera retenté plus tard`);
        }
      }
    } catch (error) {
      console.error(`❌ Erreur traitement email ${email.id}:`, error);
      email.status = 'failed';
    }
  }

  // Obtenir les statistiques de la queue
  getQueueStats(): {
    total: number;
    pending: number;
    processing: number;
    sent: number;
    failed: number;
  } {
    return {
      total: this.queue.length,
      pending: this.queue.filter(e => e.status === 'pending').length,
      processing: this.queue.filter(e => e.status === 'processing').length,
      sent: this.queue.filter(e => e.status === 'sent').length,
      failed: this.queue.filter(e => e.status === 'failed').length,
    };
  }

  // Nettoyer la queue (supprimer les emails anciens)
  cleanupQueue(): void {
    const cutoffDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 jours

    const initialLength = this.queue.length;
    this.queue = this.queue.filter(
      email => email.status !== 'sent' || email.updatedAt > cutoffDate
    );

    const removedCount = initialLength - this.queue.length;
    if (removedCount > 0) {
      console.log(`🧹 Queue nettoyée: ${removedCount} emails supprimés`);
    }
  }
}

// Instance singleton du service email
export const emailService = new EmailService({
  from: 'DiaspoMoney <noreply@diaspomoney.fr>',
  replyTo: 'support@diaspomoney.fr',
  enabled: !!process.env['RESEND_API_KEY'],
});

// Fonction utilitaire pour tester le service
export async function testEmailService(): Promise<boolean> {
  try {
    console.log('🧪 Test du service email...');

    // Test de connexion
    const connectionTest = await emailService.testConnection();
    if (!connectionTest) {
      console.error('❌ Test de connexion échoué');
      return false;
    }

    // Test d'envoi d'email
    const testResult = await emailService.sendCustomEmail(
      'test@diaspomoney.fr',
      'Test Service Email',
      '<p>Test du service email DiaspoMoney</p>',
      'Test du service email DiaspoMoney'
    );

    if (testResult) {
      console.log('✅ Service email fonctionne correctement');
      return true;
    } else {
      console.error("❌ Test d'envoi d'email échoué");
      return false;
    }
  } catch (error) {
    console.error('❌ Erreur test service email:', error);
    return false;
  }
}
