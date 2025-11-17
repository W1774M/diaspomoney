/**
 * Email Service - DiaspoMoney
 * Service de gestion des emails
 *
 * Implémente les design patterns :
 * - Service Layer Pattern
 * - Singleton Pattern (via instance exportée)
 * - Logger Pattern (structured logging avec childLogger)
 * - Decorator Pattern (@Log, @Retry)
 * - Error Handling Pattern (Sentry)
 * - Queue Pattern (pour le traitement asynchrone des emails)
 */

import { Log } from '@/lib/decorators/log.decorator';
import { Retry, RetryHelpers } from '@/lib/decorators/retry.decorator';
import {
  sendAppointmentNotificationEmail,
  sendEmail,
  sendPasswordResetEmail,
  sendPaymentConfirmationEmail,
  sendWelcomeEmail,
  testEmailConnection,
} from '@/lib/email/resend';
import { childLogger } from '@/lib/logger';
import type {
  EmailOptions,
  EmailQueueItem,
  EmailServiceConfig,
} from '@/types/email';
import * as Sentry from '@sentry/nextjs';

export class EmailService {
  private readonly log = childLogger({
    component: 'EmailService',
  });
  private queue: EmailQueueItem[] = [];
  private isProcessing = false;
  private readonly config: EmailServiceConfig;

  constructor(config: EmailServiceConfig) {
    this.config = config;
  }

  /**
   * Obtenir la configuration du service
   */
  getConfig(): EmailServiceConfig {
    return this.config;
  }

  /**
   * Test de connexion Resend
   */
  @Log({ level: 'info', logArgs: false, logExecutionTime: true })
  async testConnection(): Promise<boolean> {
    try {
      this.log.debug('Testing Resend connection');
      const result = await testEmailConnection();

      if (result) {
        this.log.info('Resend connection successful');
        return true;
      } else {
        this.log.error('Resend connection failed');
        return false;
      }
    } catch (error) {
      this.log.error({ error }, 'Resend connection test error');
      Sentry.captureException(error, {
        tags: {
          component: 'EmailService',
          action: 'testConnection',
        },
      });
      return false;
    }
  }

  /**
   * Envoi d'email de bienvenue
   */
  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @Retry({
    maxAttempts: 3,
    delay: 2000,
    backoff: 'exponential',
    shouldRetry: RetryHelpers.retryOnNetworkOrServerError,
  })
  async sendWelcomeEmail(
    email: string,
    name: string,
    verificationUrl: string,
  ): Promise<boolean> {
    try {
      this.log.debug({ email, name }, 'Sending welcome email');

      const result = await sendWelcomeEmail(email, name, verificationUrl);

      if (result) {
        this.log.info({ email, name }, 'Welcome email sent successfully');
        return true;
      } else {
        this.log.error({ email, name }, 'Failed to send welcome email');
        Sentry.captureMessage('Failed to send welcome email', {
          level: 'warning',
          extra: { email, name },
        });
        return false;
      }
    } catch (error) {
      this.log.error({ error, email, name }, 'Welcome email sending error');
      Sentry.captureException(error, {
        tags: {
          component: 'EmailService',
          action: 'sendWelcomeEmail',
        },
        extra: { email, name },
      });
      return false;
    }
  }

  /**
   * Envoi d'email de réinitialisation de mot de passe
   */
  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @Retry({
    maxAttempts: 3,
    delay: 2000,
    backoff: 'exponential',
    shouldRetry: RetryHelpers.retryOnNetworkOrServerError,
  })
  async sendPasswordResetEmail(
    email: string,
    name: string,
    resetUrl: string,
  ): Promise<boolean> {
    try {
      this.log.debug({ email, name }, 'Sending password reset email');

      const result = await sendPasswordResetEmail(email, name, resetUrl);

      if (result) {
        this.log.info(
          { email, name },
          'Password reset email sent successfully',
        );
        return true;
      } else {
        this.log.error({ email, name }, 'Failed to send password reset email');
        Sentry.captureMessage('Failed to send password reset email', {
          level: 'warning',
          extra: { email, name },
        });
        return false;
      }
    } catch (error) {
      this.log.error(
        { error, email, name },
        'Password reset email sending error',
      );
      Sentry.captureException(error, {
        tags: {
          component: 'EmailService',
          action: 'sendPasswordResetEmail',
        },
        extra: { email, name },
      });
      return false;
    }
  }

  /**
   * Envoi d'email de confirmation de paiement
   */
  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @Retry({
    maxAttempts: 3,
    delay: 2000,
    backoff: 'exponential',
    shouldRetry: RetryHelpers.retryOnNetworkOrServerError,
  })
  async sendPaymentConfirmationEmail(
    email: string,
    name: string,
    amount: number,
    currency: string,
    service: string,
  ): Promise<boolean> {
    try {
      this.log.debug(
        { email, name, amount, currency, service },
        'Sending payment confirmation email',
      );

      const result = await sendPaymentConfirmationEmail(
        email,
        name,
        amount,
        currency,
        service,
      );

      if (result) {
        this.log.info(
          { email, name, amount, currency },
          'Payment confirmation email sent successfully',
        );
        return true;
      } else {
        this.log.error(
          { email, name, amount, currency },
          'Failed to send payment confirmation email',
        );
        Sentry.captureMessage('Failed to send payment confirmation email', {
          level: 'warning',
          extra: { email, name, amount, currency },
        });
        return false;
      }
    } catch (error) {
      this.log.error(
        { error, email, name, amount, currency },
        'Payment confirmation email sending error',
      );
      Sentry.captureException(error, {
        tags: {
          component: 'EmailService',
          action: 'sendPaymentConfirmationEmail',
        },
        extra: { email, name, amount, currency },
      });
      return false;
    }
  }

  /**
   * Envoi d'email de notification de rendez-vous
   */
  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  async sendAppointmentNotificationEmail(
    email: string,
    name: string,
    provider: string,
    date: string,
    time: string,
    type: 'confirmation' | 'reminder',
  ): Promise<boolean> {
    try {
      this.log.debug(
        { email, name, provider, date, time, type },
        'Sending appointment notification email',
      );

      const result = await sendAppointmentNotificationEmail(
        email,
        name,
        provider,
        date,
        time,
        type,
      );

      if (result) {
        this.log.info(
          { email, name, provider, date, time, type },
          'Appointment notification email sent successfully',
        );
        return true;
      } else {
        this.log.error(
          { email, name, provider, date, time, type },
          'Failed to send appointment notification email',
        );
        Sentry.captureMessage('Failed to send appointment notification email', {
          level: 'warning',
          extra: { email, name, provider, date, time, type },
        });
        return false;
      }
    } catch (error) {
      this.log.error(
        { error, email, name, provider, date, time, type },
        'Appointment notification email sending error',
      );
      Sentry.captureException(error, {
        tags: {
          component: 'EmailService',
          action: 'sendAppointmentNotificationEmail',
        },
        extra: { email, name, provider, date, time, type },
      });
      return false;
    }
  }

  /**
   * Envoi d'email personnalisé
   */
  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  async sendCustomEmail(
    to: string | string[],
    subject: string,
    html: string,
    text?: string,
    tags?: Array<{ name: string; value: string }>,
  ): Promise<boolean> {
    try {
      const recipients = Array.isArray(to) ? to.join(', ') : to;
      this.log.debug(
        { recipients, subject, hasTags: !!tags?.length },
        'Sending custom email',
      );

      await sendEmail({
        to,
        subject,
        html,
        text: typeof text === 'string' ? text : '',
        tags: Array.isArray(tags) && tags.length > 0 ? tags : [],
      } as EmailOptions);

      this.log.info({ recipients, subject }, 'Custom email sent successfully');
      return true;
    } catch (error) {
      this.log.error(
        { error, recipients: Array.isArray(to) ? to.join(', ') : to, subject },
        'Custom email sending error',
      );
      Sentry.captureException(error, {
        tags: {
          component: 'EmailService',
          action: 'sendCustomEmail',
        },
        extra: { to, subject },
      });
      return false;
    }
  }

  /**
   * Ajouter un email à la queue
   */
  @Log({ level: 'info', logArgs: true, logExecutionTime: false })
  addToQueue(
    type: string,
    to: string | string[],
    data: any,
    priority: 'high' | 'normal' | 'low' = 'normal',
    scheduledAt?: Date,
  ): string {
    const id = `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const queueItem: EmailQueueItem = {
      id,
      type,
      to: Array.isArray(to) ? to[0] ?? '' : to ?? '',
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
    this.log.info(
      { emailId: id, type, priority, scheduledAt: queueItem.scheduledAt },
      'Email added to queue',
    );

    return id;
  }

  /**
   * Traiter la queue d'emails
   */
  @Log({ level: 'info', logArgs: false, logExecutionTime: true })
  async processQueue(): Promise<void> {
    if (this.isProcessing) {
      this.log.debug('Queue already processing');
      return;
    }

    this.isProcessing = true;
    this.log.info('Processing email queue');

    try {
      const pendingEmails = this.queue.filter(
        email =>
          email.status === 'pending' &&
          (!email.scheduledAt || email.scheduledAt <= new Date()),
      );

      // Trier par priorité
      pendingEmails.sort((a, b) => {
        const priorityOrder = { high: 3, normal: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });

      for (const email of pendingEmails) {
        await this.processEmail(email);
      }

      this.log.info(
        { processedCount: pendingEmails.length },
        'Email queue processed',
      );
    } catch (error) {
      this.log.error({ error }, 'Email queue processing error');
      Sentry.captureException(error, {
        tags: {
          component: 'EmailService',
          action: 'processQueue',
        },
      });
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Traiter un email individuel
   */
  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  private async processEmail(email: EmailQueueItem): Promise<void> {
    try {
      email.status = 'processing';
      email.attempts++;
      email.updatedAt = new Date();

      this.log.debug(
        { emailId: email.id, attempt: email.attempts, type: email.type },
        'Processing email',
      );

      let result = false;

      switch (email.type) {
        case 'welcome':
          result = await this.sendWelcomeEmail(
            Array.isArray(email.to) ? email.to[0] : email.to,
            email.data.name,
            email.data.verificationUrl,
          );
          break;

        case 'password_reset':
          result = await this.sendPasswordResetEmail(
            Array.isArray(email.to) ? email.to[0] : email.to,
            email.data.name,
            email.data.resetUrl,
          );
          break;

        case 'payment_confirmation':
          result = await this.sendPaymentConfirmationEmail(
            Array.isArray(email.to) ? email.to[0] : email.to,
            email.data.name,
            email.data.amount,
            email.data.currency,
            email.data.service,
          );
          break;

        case 'appointment_notification':
          result = await this.sendAppointmentNotificationEmail(
            Array.isArray(email.to) ? email.to[0] : email.to,
            email.data.name,
            email.data.provider,
            email.data.date,
            email.data.time,
            email.data.type,
          );
          break;

        default:
          result = await this.sendCustomEmail(
            email.to,
            email.data.subject,
            email.data.html,
            email.data.text,
            email.data.tags,
          );
      }

      if (result) {
        email.status = 'sent';
        this.log.info({ emailId: email.id }, 'Email sent successfully');
      } else {
        if (email.attempts >= email.maxAttempts) {
          email.status = 'failed';
          this.log.error(
            { emailId: email.id, attempts: email.attempts },
            'Email failed permanently',
          );
          Sentry.captureMessage('Email failed permanently', {
            level: 'error',
            extra: {
              emailId: email.id,
              type: email.type,
              attempts: email.attempts,
            },
          });
        } else {
          email.status = 'pending';
          this.log.warn(
            { emailId: email.id, attempts: email.attempts },
            'Email will be retried later',
          );
        }
      }
    } catch (error) {
      this.log.error({ error, emailId: email.id }, 'Email processing error');
      email.status = 'failed';
      Sentry.captureException(error, {
        tags: {
          component: 'EmailService',
          action: 'processEmail',
        },
        extra: { emailId: email.id, type: email.type },
      });
    }
  }

  /**
   * Obtenir les statistiques de la queue
   */
  @Log({ level: 'debug', logArgs: false, logExecutionTime: false })
  getQueueStats(): {
    total: number;
    pending: number;
    processing: number;
    sent: number;
    failed: number;
  } {
    const stats = {
      total: this.queue.length,
      pending: this.queue.filter(e => e.status === 'pending').length,
      processing: this.queue.filter(e => e.status === 'processing').length,
      sent: this.queue.filter(e => e.status === 'sent').length,
      failed: this.queue.filter(e => e.status === 'failed').length,
    };

    this.log.debug(stats, 'Email queue stats');
    return stats;
  }

  /**
   * Nettoyer la queue (supprimer les emails anciens)
   */
  @Log({ level: 'info', logArgs: false, logExecutionTime: true })
  cleanupQueue(): void {
    const cutoffDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 jours

    const initialLength = this.queue.length;
    this.queue = this.queue.filter(
      email => email.status !== 'sent' || email.updatedAt > cutoffDate,
    );

    const removedCount = initialLength - this.queue.length;
    if (removedCount > 0) {
      this.log.info(
        { removedCount, remainingCount: this.queue.length },
        'Email queue cleaned up',
      );
    }
  }
}

// Instance singleton du service email
export const emailService = new EmailService({
  from: 'DiaspoMoney <noreply@diaspomoney.fr>',
  replyTo: 'support@diaspomoney.fr',
  enabled: !!process.env['RESEND_API_KEY'],
});

/**
 * Fonction utilitaire pour tester le service
 */
export async function testEmailService(): Promise<boolean> {
  const log = childLogger({
    component: 'testEmailService',
  });

  try {
    log.debug('Testing email service');

    // Test de connexion
    const connectionTest = await emailService.testConnection();
    if (!connectionTest) {
      log.error('Connection test failed');
      return false;
    }

    // Test d'envoi d'email
    const testResult = await emailService.sendCustomEmail(
      'test@diaspomoney.fr',
      'Test Service Email',
      '<p>Test du service email DiaspoMoney</p>',
      'Test du service email DiaspoMoney',
    );

    if (testResult) {
      log.info('Email service is working correctly');
      return true;
    } else {
      log.error('Email sending test failed');
      return false;
    }
  } catch (error) {
    log.error({ error }, 'Email service test error');
    Sentry.captureException(error, {
      tags: {
        component: 'EmailService',
        action: 'testEmailService',
      },
    });
    return false;
  }
}
