/**
 * Notification Service - DiaspoMoney
 * Service de notifications multi-canaux Company-Grade
 *
 * Implémente les design patterns :
 * - Singleton Pattern
 * - Repository Pattern
 * - Service Layer Pattern
 * - Logger Pattern (structured logging avec childLogger)
 * - Decorator Pattern (@Log)
 * - Error Handling Pattern (Sentry)
 * - Dependency Injection
 */

import { LOCALE } from '@/lib/constants';
import { Cacheable } from '@/lib/decorators/cache.decorator';
import { Log } from '@/lib/decorators/log.decorator';
import { sendEmail } from '@/lib/email/resend';
import { childLogger } from '@/lib/logger';
import { monitoringManager } from '@/lib/monitoring/advanced-monitoring';
import type {
  INotificationRepository,
  INotificationTemplateRepository,
} from '@/repositories';
import {
  getNotificationRepository,
  getNotificationTemplateRepository,
} from '@/repositories';

import type {
  NotificationData,
  NotificationStats,
  NotificationTemplate,
  NotificationType,
} from '@/lib/types';
import type { Notification } from '@/lib/types/notifications.types';
import * as Sentry from '@sentry/nextjs';

export class NotificationService {
  private static instance: NotificationService;
  private notificationRepository: INotificationRepository;
  private templateRepository: INotificationTemplateRepository;
  private readonly log = childLogger({
    component: 'NotificationService',
  });

  private constructor() {
    this.notificationRepository = getNotificationRepository();
    this.templateRepository = getNotificationTemplateRepository();
  }

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Envoyer une notification
   */
  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  async sendNotification(data: NotificationData): Promise<Notification> {
    try {
      // Validation des données
      if (!data.recipient || !data.type || !data.template) {
        const error = new Error('Données de notification incomplètes');
        this.log.error(
          {
            recipient: data.recipient,
            type: data.type,
            template: data.template,
          },
          'Invalid notification data',
        );
        throw error;
      }

      // Récupérer le template depuis le repository
      const template = await this.getTemplate(data.template, data.locale);
      if (!template) {
        const errorMessage = `Template non trouvé: ${data.template} (locale: ${
          data.locale || 'default'
        })`;
        // Enregistrer la métrique d'erreur
        monitoringManager.recordMetric({
          name: 'notification_template_not_found',
          value: 1,
          timestamp: new Date(),
          labels: { template: data.template, locale: data.locale || 'default' },
          type: 'counter',
        });
        Sentry.captureException(new Error(errorMessage), {
          tags: { template: data.template, locale: data.locale },
        });
        throw new Error(errorMessage);
      }

      // Remplacer les variables dans le template
      const processedContent = this.processTemplate(template, data.data);

      // Créer la notification
      const notification: Notification = {
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        recipient: data.recipient,
        type: data.type as keyof typeof NotificationType,
        subject: processedContent.subject,
        content: processedContent.content,
        channels: data.channels,
        status: 'PENDING',
        metadata: {
          template: data.template,
          locale: data.locale,
          priority: data.priority,
          originalData: data.data,
        },
        createdAt: new Date(),  
        updatedAt: new Date(),
        userId: (data as any as NotificationData & { userId: string }).userId,
        _id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      };

      // Sauvegarder en base de données via le repository
      const savedNotification = await this.notificationRepository.create(
        notification,
      );

      // Envoyer via les canaux activés
      await this.sendToChannels(savedNotification);

      // Enregistrer les métriques
      monitoringManager.recordMetric({
        name: 'notifications_sent',
        value: 1,
        timestamp: new Date(),
        labels: {
          type: data.type,
          priority: data.priority,
          locale: data.locale,
        },
        type: 'counter',
      });

      this.log.info(
        {
          notificationId: savedNotification.id,
          recipient: savedNotification.recipient,
          type: savedNotification.type,
        },
        'Notification sent successfully',
      );

      return savedNotification;
    } catch (error) {
      this.log.error(
        {
          error,
          recipient: data.recipient,
          type: data.type,
          template: data.template,
        },
        'Error sending notification',
      );
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Envoyer une notification de bienvenue
   */
  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  async sendWelcomeNotification(
    userEmail: string,
    userName: string,
    locale: string = LOCALE.DEFAULT,
  ): Promise<void> {
    try {
      await this.sendNotification({
        recipient: userEmail,
        type: 'WELCOME_EMAIL',
        template: 'welcome',
        data: {
          userName,
          appName: 'DiaspoMoney',
          supportEmail: 'support@diaspomoney.fr',
        },
        channels: [{ type: 'EMAIL', enabled: true, priority: 'MEDIUM' }],
        locale,
        priority: 'MEDIUM',
      });
    } catch (error) {
      this.log.error(
        { error, userEmail, userName },
        'Error sending welcome notification',
      );
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Envoyer une notification de succès de paiement
   */
  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  async sendPaymentSuccessNotification(
    userEmail: string,
    amount: number,
    currency: string,
    serviceName: string,
    locale: string = LOCALE.DEFAULT,
  ): Promise<void> {
    try {
      await this.sendNotification({
        recipient: userEmail,
        type: 'PAYMENT_SUCCESS',
        template: 'payment_success',
        data: {
          amount,
          currency,
          serviceName,
          transactionDate: new Date().toLocaleDateString(locale),
        },
        channels: [
          { type: 'EMAIL', enabled: true, priority: 'HIGH' },
          { type: 'PUSH', enabled: true, priority: 'HIGH' },
        ],
        locale,
        priority: 'HIGH',
      });
    } catch (error) {
      this.log.error(
        { error, userEmail, amount, currency },
        'Error sending payment success notification',
      );
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Envoyer une notification d'échec de paiement
   */
  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  async sendPaymentFailedNotification(
    userEmail: string,
    amount: number,
    currency: string,
    reason: string,
    locale: string = LOCALE.DEFAULT,
  ): Promise<void> {
    try {
      await this.sendNotification({
        recipient: userEmail,
        type: 'PAYMENT_FAILED',
        template: 'payment_failed',
        data: {
          amount,
          currency,
          reason,
          supportEmail: 'support@diaspomoney.fr',
        },
        channels: [
          { type: 'EMAIL', enabled: true, priority: 'HIGH' },
          { type: 'SMS', enabled: true, priority: 'URGENT' },
        ],
        locale,
        priority: 'HIGH',
      });
    } catch (error) {
      this.log.error(
        { error, userEmail, amount, reason },
        'Error sending payment failed notification',
      );
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Envoyer une notification KYC approuvé
   */
  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  async sendKYCApprovedNotification(
    userEmail: string,
    userName: string,
    locale: string = LOCALE.DEFAULT,
  ): Promise<void> {
    try {
      await this.sendNotification({
        recipient: userEmail,
        type: 'KYC_APPROVED',
        template: 'kyc_approved',
        data: {
          userName,
          appName: 'DiaspoMoney',
        },
        channels: [
          { type: 'EMAIL', enabled: true, priority: 'MEDIUM' },
          { type: 'PUSH', enabled: true, priority: 'MEDIUM' },
        ],
        locale,
        priority: 'MEDIUM',
      });
    } catch (error) {
      this.log.error(
        { error, userEmail, userName },
        'Error sending KYC approved notification',
      );
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Envoyer un code 2FA
   */
  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  async send2FACode(
    userPhone: string,
    code: string,
    locale: string = LOCALE.DEFAULT,
  ): Promise<void> {
    try {
      await this.sendNotification({
        recipient: userPhone,
        type: 'TWO_FACTOR_CODE',
        template: '2fa_code',
        data: {
          code,
          appName: 'DiaspoMoney',
          expiresIn: '5 minutes',
        },
        channels: [{ type: 'SMS', enabled: true, priority: 'URGENT' }],
        locale,
        priority: 'URGENT',
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
      });
    } catch (error) {
      this.log.error({ error, userPhone }, 'Error sending 2FA code');
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Envoyer un rappel de rendez-vous
   */
  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  async sendAppointmentReminder(
    userEmail: string,
    appointmentDate: Date,
    serviceName: string,
    providerName: string,
    locale: string = LOCALE.DEFAULT,
  ): Promise<void> {
    try {
      await this.sendNotification({
        recipient: userEmail,
        type: 'APPOINTMENT_REMINDER',
        template: 'appointment_reminder',
        data: {
          appointmentDate: appointmentDate.toLocaleDateString(locale),
          appointmentTime: appointmentDate.toLocaleTimeString(locale),
          serviceName,
          providerName,
        },
        channels: [
          { type: 'EMAIL', enabled: true, priority: 'MEDIUM' },
          { type: 'PUSH', enabled: true, priority: 'MEDIUM' },
        ],
        locale,
        priority: 'MEDIUM',
        scheduledAt: new Date(appointmentDate.getTime() - 24 * 60 * 60 * 1000), // 24h avant
      });
    } catch (error) {
      this.log.error(
        { error, userEmail, appointmentDate, serviceName },
        'Error sending appointment reminder',
      );
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Récupérer un template depuis le repository ou utiliser les templates par défaut
   */
  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'NotificationService:getTemplate' }) // Cache 5 minutes
  private async getTemplate(
    templateName: string,
    locale: string,
  ): Promise<NotificationTemplate | null> {
    try {
      // Essayer de récupérer depuis la base de données
      const dbTemplate = await this.templateRepository.findByNameAndLocale(
        templateName,
        locale,
      );
      if (dbTemplate) {
        this.log.debug({ templateName, locale }, 'Template found in database');
        return dbTemplate;
      }

      // Fallback sur les templates par défaut
      const defaultTemplates: Record<string, NotificationTemplate> = {
        welcome: {
          _id: 'welcome',
          id: 'welcome',
          name: 'welcome',
          subject: 'Bienvenue sur DiaspoMoney',
          content:
            'Bonjour {{userName}}, bienvenue sur {{appName}} ! Votre compte a été créé avec succès.',
          variables: ['userName', 'appName'],
          channels: [{ type: 'EMAIL', enabled: true, priority: 'MEDIUM' }],
          locale,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        payment_success: {
          _id: 'payment_success',
          id: 'payment_success',
          name: 'payment_success',
          subject: 'Paiement confirmé - {{serviceName}}',
          content:
            'Votre paiement de {{amount}} {{currency}} pour {{serviceName}} a été confirmé le {{transactionDate}}.',
          variables: ['amount', 'currency', 'serviceName', 'transactionDate'],
          channels: [{ type: 'EMAIL', enabled: true, priority: 'HIGH' }],
          locale,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        payment_failed: {
          _id: 'payment_failed',
          id: 'payment_failed',
          name: 'payment_failed',
          subject: 'Échec du paiement',
          content:
            'Votre paiement de {{amount}} {{currency}} a échoué. Raison: {{reason}}. Contactez {{supportEmail}} pour assistance.',
          variables: ['amount', 'currency', 'reason', 'supportEmail'],
          channels: [{ type: 'EMAIL', enabled: true, priority: 'HIGH' }],
          locale,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        kyc_approved: {
          _id: 'kyc_approved',
          id: 'kyc_approved',
          name: 'kyc_approved',
          subject: "Vérification d'identité approuvée",
          content:
            "Bonjour {{userName}}, votre vérification d'identité a été approuvée. Vous pouvez maintenant utiliser tous les services de {{appName}}.",
          variables: ['userName', 'appName'],
          channels: [{ type: 'EMAIL', enabled: true, priority: 'MEDIUM' }],
          locale,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        '2fa_code': {
          _id: '2fa_code',
          id: '2fa_code',
          name: '2fa_code',
          subject: 'Code de vérification',
          content:
            'Votre code de vérification {{appName}} est: {{code}}. Valide {{expiresIn}}.',
          variables: ['code', 'appName', 'expiresIn'],
          channels: [{ type: 'SMS', enabled: true, priority: 'URGENT' }],
          locale,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        appointment_reminder: {
          _id: 'appointment_reminder',
          id: 'appointment_reminder',
          name: 'appointment_reminder',
          subject: 'Rappel de rendez-vous',
          content:
            'Rappel: Vous avez un rendez-vous le {{appointmentDate}} à {{appointmentTime}} avec {{providerName}} pour {{serviceName}}.',
          variables: [
            'appointmentDate',
            'appointmentTime',
            'providerName',
            'serviceName',
          ],
          channels: [{ type: 'EMAIL', enabled: true, priority: 'MEDIUM' }],
          locale,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        dispute_created: {
          _id: 'dispute_created',
          id: 'dispute_created',
          name: 'dispute_created',
          subject: 'Dispute créée - Transaction {{transactionId}}',
          content:
            'Une dispute a été créée pour la transaction {{transactionId}}. Montant: {{amount}} {{currency}}. Raison: {{reason}}. Client: {{customerId}}.',
          variables: [
            'disputeId',
            'transactionId',
            'amount',
            'currency',
            'reason',
            'customerId',
          ],
          channels: [{ type: 'EMAIL', enabled: true, priority: 'URGENT' }],
          locale,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };

      const template = defaultTemplates[templateName] || null;
      if (template) {
        this.log.debug({ templateName, locale }, 'Using default template');
      } else {
        this.log.warn(
          { templateName, locale },
          'Template not found in database or defaults',
        );
      }
      return template;
    } catch (error) {
      this.log.error({ error, templateName, locale }, 'Error getting template');
      Sentry.captureException(error);
      return null;
    }
  }

  /**
   * Traiter un template avec les variables
   */
  private processTemplate(
    template: NotificationTemplate,
    data: Record<string, any>,
  ): { subject: string; content: string } {
    let subject = template.subject;
    let content = template.content;

    // Remplacer les variables
    for (const [key, value] of Object.entries(data)) {
      const placeholder = `{{${key}}}`;
      subject = subject.replace(new RegExp(placeholder, 'g'), String(value));
      content = content.replace(new RegExp(placeholder, 'g'), String(value));
    }

    return { subject, content };
  }

  /**
   * Envoyer via les canaux activés
   */
  private async sendToChannels(notification: Notification): Promise<void> {
    for (const channel of notification.channels) {
      if (!channel.enabled) continue;

      try {
        switch (channel.type) {
          case 'EMAIL':
            await this.sendEmail(notification);
            break;
          case 'SMS':
            await this.sendSMS(notification);
            break;
          case 'PUSH':
            await this.sendPush(notification);
            break;
          case 'WHATSAPP':
            await this.sendWhatsApp(notification);
            break;
          case 'IN_APP':
            await this.sendInApp(notification);
            break;
        }
      } catch (error) {
        this.log.error(
          { error, channel: channel.type, notificationId: notification.id },
          `Error sending notification via ${channel.type}`,
        );
        // Mettre à jour le statut de la notification en cas d'erreur
        await this.notificationRepository.updateStatus(
          String(notification.id),
          'FAILED',
          {
            failedAt: new Date(),
            failureReason: `Erreur lors de l'envoi via ${channel.type}: ${
              error instanceof Error ? error.message : 'Unknown error'
            }`,
          },
        );
        // Continuer avec les autres canaux
      }
    }
  }

  /**
   * Envoyer un email via Resend
   */
  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  private async sendEmail(notification: Notification): Promise<void> {
    try {
      const emailSent = await sendEmail({
        to: notification.recipient,
        subject: notification.subject,
        html: notification.content.replace(/\n/g, '<br>'),
        text: notification.content,
        tags: [
          { name: 'notification_type', value: notification.type },
          { name: 'notification_id', value: notification.id },
        ],
      });

      if (emailSent) {
        // Mettre à jour le statut de la notification
        await this.notificationRepository.updateStatus(
          String(notification.id),
          'SENT',
          { sentAt: new Date() },
        );
        this.log.info(
          {
            notificationId: notification.id,
            recipient: notification.recipient,
          },
          'Email sent successfully',
        );
      } else {
        throw new Error('Failed to send email via Resend');
      }
    } catch (error) {
      this.log.error(
        {
          error,
          notificationId: notification.id,
          recipient: notification.recipient,
        },
        'Error sending email',
      );
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Envoyer un SMS
   * TODO: Intégrer avec Twilio ou un autre service SMS
   */
  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  private async sendSMS(notification: Notification): Promise<void> {
    try {
      // TODO: Intégrer avec Twilio
      this.log.info(
        {
          notificationId: notification.id,
          recipient: notification.recipient,
          content: notification.content,
        },
        'SMS sending (not implemented yet)',
      );

      // Simulation d'envoi pour le moment
      await new Promise(resolve => setTimeout(resolve, 50));

      // Mettre à jour le statut de la notification
      await this.notificationRepository.updateStatus(String(notification.id), 'SENT', {
        sentAt: new Date(),
      });
    } catch (error) {
      this.log.error(
        { error, notificationId: notification.id },
        'Error sending SMS',
      );
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Envoyer une notification push
   * TODO: Intégrer avec Firebase Cloud Messaging
   */
  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  private async sendPush(notification: Notification): Promise<void> {
    try {
      // TODO: Intégrer avec Firebase Cloud Messaging
      this.log.info(
        {
          notificationId: notification.id,
          recipient: notification.recipient,
          subject: notification.subject,
        },
        'Push notification sending (not implemented yet)',
      );

      // Simulation d'envoi pour le moment
      await new Promise(resolve => setTimeout(resolve, 30));

      // Mettre à jour le statut de la notification
      await this.notificationRepository.updateStatus(String(notification.id), 'SENT', {
        sentAt: new Date(),
      });
    } catch (error) {
      this.log.error(
        { error, notificationId: notification.id },
        'Error sending push notification',
      );
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Envoyer un WhatsApp
   * TODO: Intégrer avec WhatsApp Business API
   */
  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  private async sendWhatsApp(notification: Notification): Promise<void> {
    try {
      // TODO: Intégrer avec WhatsApp Business API
      this.log.info(
        {
          notificationId: notification.id,
          recipient: notification.recipient,
          content: notification.content,
        },
        'WhatsApp sending (not implemented yet)',
      );

      // Simulation d'envoi pour le moment
      await new Promise(resolve => setTimeout(resolve, 200));

      // Mettre à jour le statut de la notification
      await this.notificationRepository.updateStatus(String(notification.id), 'SENT', {
        sentAt: new Date(),
      });
    } catch (error) {
      this.log.error(
        { error, notificationId: notification.id },
        'Error sending WhatsApp',
      );
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Envoyer une notification in-app
   * La notification est déjà sauvegardée en base de données
   */
  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  private async sendInApp(notification: Notification): Promise<void> {
    try {
      // La notification est déjà sauvegardée en base de données via sendNotification
      // On marque simplement comme envoyée
      await this.notificationRepository.updateStatus(String(notification.id), 'SENT', {
        sentAt: new Date(),
      });

      this.log.info(
        {
          notificationId: notification.id,
          recipient: notification.recipient,
        },
        'In-app notification saved',
      );
    } catch (error) {
      this.log.error(
        { error, notificationId: notification.id },
        'Error saving in-app notification',
      );
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Obtenir les statistiques des notifications depuis le repository
   */
  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'NotificationService:getNotificationStats' }) // Cache 5 minutes
  async getNotificationStats(
    period: 'day' | 'week' | 'month' = 'day',
  ): Promise<NotificationStats> {
    try {
      const stats = await this.notificationRepository.getStats(period);
      this.log.debug({ period, stats }, 'Notification stats retrieved');
      return stats;
    } catch (error) {
      this.log.error({ error, period }, 'Error getting notification stats');
      Sentry.captureException(error);
      throw error;
    }
  }
}

// Export de l'instance singleton
export const notificationService = NotificationService.getInstance();
