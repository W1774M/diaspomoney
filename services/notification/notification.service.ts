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

import { LOCALE, NOTIFICATION_STATUSES } from '@/lib/constants';
import { Cacheable } from '@/lib/decorators/cache.decorator';
import { Log } from '@/lib/decorators/log.decorator';
import { Performance } from '@/lib/decorators/performance.decorator';
import { Validate } from '@/lib/decorators/validate.decorator';
import { SendNotificationSchema } from '@/lib/validations/notification-service.schema';
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

  /**
   * Types pour lesquels l'email est considéré comme transactionnel/obligatoire,
   * même si l'utilisateur désactive les emails (anti-perte d'information critique).
   */
  private isForcedEmailType(type: string): boolean {
    const t = (type || '').toUpperCase();
    return (
      // Argent / transactionnel (y compris variantes PROVIDER_*)
      t.includes('PAYMENT_') ||
      // KYC / conformité (y compris variantes PROVIDER_*)
      t.includes('KYC_') ||
      // Sécurité
      t.startsWith('LOGIN_') ||
      t.includes('SECURITY_')
    );
  }

  private isEmail(recipient: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient);
  }

  private async resolveUserFromRecipient(recipient: string) {
    try {
      const { getUserRepository } = await import('@/repositories');
      const userRepository = getUserRepository();

      if (this.isEmail(recipient)) {
        return await userRepository.findByEmail(recipient);
      }

      return await userRepository.findById(recipient);
    } catch (error) {
      this.log.warn({ error, recipient }, 'Unable to resolve user for recipient');
      return null;
    }
  }

  private async shouldSendEmailForNotification(
    notification: Notification,
  ): Promise<boolean> {
    if (this.isForcedEmailType(notification.type)) return true;

    const user = await this.resolveUserFromRecipient(notification.recipient);
    if (!user) return true;

    const prefs = (user as any).preferences;
    if (prefs && prefs.emailNotifications === false) return false;

    const map = prefs?.notificationEmailByType;
    if (map && typeof map === 'object') {
      const key = (notification.type || '').toUpperCase();
      const v = map[key];
      if (typeof v === 'boolean') return v;
    }

    return true;
  }

  private async shouldDeliverNow(notification: Notification): Promise<boolean> {
    const now = new Date();

    if (
      notification.expiresAt &&
      new Date(notification.expiresAt).getTime() <= now.getTime()
    ) {
      await this.notificationRepository.updateStatus(
        String(notification.id),
        'EXPIRED',
        {
          failedAt: new Date(),
          failureReason: 'Notification expirée avant envoi',
        },
      );
      return false;
    }

    if (
      notification.scheduledAt &&
      new Date(notification.scheduledAt).getTime() > now.getTime()
    ) {
      return false;
    }

    // Conditions métier (ex: rappels KYC uniquement si le user est toujours PENDING)
    const requiredKycStatus =
      ((notification.metadata as any)?.requiredKycStatus as string | undefined) ||
      ((notification.metadata as any)?.originalData?.requiredKycStatus as
        | string
        | undefined);
    if (requiredKycStatus) {
      const user = await this.resolveUserFromRecipient(notification.recipient);
      const current = (user as any)?.kycStatus;
      if (!user || current !== requiredKycStatus) {
        await this.notificationRepository.updateStatus(
          String(notification.id),
          'EXPIRED',
          {
            failedAt: new Date(),
            failureReason: `Condition non satisfaite (KYC=${
              current || 'unknown'
            }, attendu=${requiredKycStatus})`,
          },
        );
        return false;
      }
    }

    return true;
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
  @Validate({
    rules: [
      {
        paramIndex: 0,
        schema: SendNotificationSchema.passthrough(),
        paramName: 'data',
      },
    ],
  })
  @Performance({ warningThreshold: 1000, errorThreshold: 3000 })
  async sendNotification(data: NotificationData): Promise<Notification> {
    try {

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
      const recipientIsEmail = this.isEmail(data.recipient);
      const inferredUserId =
        (data as any as NotificationData & { userId?: string }).userId ||
        (!recipientIsEmail ? data.recipient : undefined) ||
        'unknown';

      const notification: Notification = {
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        recipient: data.recipient,
        type: data.type as keyof typeof NotificationType,
        subject: processedContent.subject,
        content: processedContent.content,
        channels: data.channels,
        status: NOTIFICATION_STATUSES.PENDING,
        read: false,
        metadata: {
          template: data.template,
          locale: data.locale,
          priority: data.priority,
          originalData: data.data,
        },
        createdAt: new Date(),  
        updatedAt: new Date(),
        userId: inferredUserId,
        ...(data.scheduledAt && { scheduledAt: data.scheduledAt }),
        ...(data.expiresAt && { expiresAt: data.expiresAt }),
        // Ne pas définir _id ici, il sera généré par le repository MongoDB
      };

      // Sauvegarder en base de données via le repository
      const savedNotification = await this.notificationRepository.create(
        notification,
      );

      // Si la notification est planifiée dans le futur, ne pas envoyer tout de suite.
      // Elle devra être traitée par un job/cron.
      if (!(await this.shouldDeliverNow(savedNotification))) {
        this.log.info(
          {
            notificationId: savedNotification.id,
            scheduledAt: savedNotification.scheduledAt,
            expiresAt: savedNotification.expiresAt,
          },
          'Notification saved (not delivered yet)',
        );
        return savedNotification;
      }

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
  @Performance({ warningThreshold: 1000, errorThreshold: 3000 })
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
  @Performance({ warningThreshold: 1000, errorThreshold: 3000 })
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
  @Performance({ warningThreshold: 1000, errorThreshold: 3000 })
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
  @Performance({ warningThreshold: 1000, errorThreshold: 3000 })
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
  @Performance({ warningThreshold: 500, errorThreshold: 2000 })
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
  @Performance({ warningThreshold: 1000, errorThreshold: 3000 })
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
        payment_refunded: {
          _id: 'payment_refunded',
          id: 'payment_refunded',
          name: 'payment_refunded',
          subject: 'Remboursement confirmé - Transaction {{transactionId}}',
          content:
            'Votre remboursement pour la transaction {{transactionId}} est confirmé. Montant: {{amount}} {{currency}}.',
          variables: ['transactionId', 'amount', 'currency'],
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
        kyc_required_reminder: {
          _id: 'kyc_required_reminder',
          id: 'kyc_required_reminder',
          name: 'kyc_required_reminder',
          subject: "Action requise : vérification d'identité (KYC)",
          content:
            "Bonjour {{userName}},\n\nPour continuer à utiliser pleinement DiaspoMoney, nous avons besoin de vérifier votre identité.\n\n👉 Complétez votre vérification dans votre espace : {{dashboardUrl}}\n\nSi vous avez besoin d'aide, contactez {{supportEmail}}.",
          variables: ['userName', 'dashboardUrl', 'supportEmail'],
          channels: [{ type: 'EMAIL', enabled: true, priority: 'HIGH' }],
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
        login_success: {
          _id: 'login_success',
          id: 'login_success',
          name: 'login_success',
          subject: 'Connexion réussie - DiaspoMoney',
          content:
            'Bonjour, vous vous êtes connecté avec succès à votre compte DiaspoMoney le {{timestamp}}. Si ce n\'était pas vous, veuillez contacter {{supportEmail}} immédiatement.',
          variables: ['email', 'timestamp', 'supportEmail'],
          channels: [{ type: 'EMAIL', enabled: true, priority: 'LOW' }, { type: 'IN_APP', enabled: true, priority: 'MEDIUM' }],
          locale,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        provider_booking_assigned: {
          _id: 'provider_booking_assigned',
          id: 'provider_booking_assigned',
          name: 'provider_booking_assigned',
          subject: 'Nouvelle mission assignée - {{serviceName}}',
          content:
            'Bonjour {{providerName}},\n\nUne nouvelle mission vous a été assignée.\n\n- Réservation: {{reservationNumber}}\n- Service: {{serviceName}}\n- Date: {{appointmentDate}}\n- Heure: {{appointmentTime}}\n\nAccédez à vos réservations: {{bookingsUrl}}',
          variables: [
            'providerName',
            'reservationNumber',
            'serviceName',
            'appointmentDate',
            'appointmentTime',
            'bookingsUrl',
          ],
          channels: [{ type: 'IN_APP', enabled: true, priority: 'HIGH' }],
          locale,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        provider_booking_updated: {
          _id: 'provider_booking_updated',
          id: 'provider_booking_updated',
          name: 'provider_booking_updated',
          subject: 'Mission mise à jour - {{reservationNumber}}',
          content:
            'Bonjour {{providerName}},\n\nUne mission a été mise à jour.\n\n- Réservation: {{reservationNumber}}\n- Service: {{serviceName}}\n- Date: {{appointmentDate}}\n- Heure: {{appointmentTime}}\n\nVoir les détails: {{bookingsUrl}}',
          variables: [
            'providerName',
            'reservationNumber',
            'serviceName',
            'appointmentDate',
            'appointmentTime',
            'bookingsUrl',
          ],
          channels: [{ type: 'IN_APP', enabled: true, priority: 'MEDIUM' }],
          locale,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        provider_booking_cancelled: {
          _id: 'provider_booking_cancelled',
          id: 'provider_booking_cancelled',
          name: 'provider_booking_cancelled',
          subject: 'Mission annulée - {{reservationNumber}}',
          content:
            'Bonjour {{providerName}},\n\nLa mission {{reservationNumber}} a été annulée.\n\nService: {{serviceName}}\nDate: {{appointmentDate}} {{appointmentTime}}\n\nConsultez vos réservations: {{bookingsUrl}}',
          variables: [
            'providerName',
            'reservationNumber',
            'serviceName',
            'appointmentDate',
            'appointmentTime',
            'bookingsUrl',
          ],
          channels: [{ type: 'IN_APP', enabled: true, priority: 'HIGH' }],
          locale,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        provider_booking_reminder: {
          _id: 'provider_booking_reminder',
          id: 'provider_booking_reminder',
          name: 'provider_booking_reminder',
          subject: 'Rappel mission - {{reservationNumber}}',
          content:
            'Bonjour {{providerName}},\n\nRappel: vous avez une mission à venir.\n\n- Réservation: {{reservationNumber}}\n- Service: {{serviceName}}\n- Date: {{appointmentDate}}\n- Heure: {{appointmentTime}}\n\nVoir vos réservations: {{bookingsUrl}}',
          variables: [
            'providerName',
            'reservationNumber',
            'serviceName',
            'appointmentDate',
            'appointmentTime',
            'bookingsUrl',
          ],
          channels: [{ type: 'IN_APP', enabled: true, priority: 'MEDIUM' }],
          locale,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        provider_complaint_created: {
          _id: 'provider_complaint_created',
          id: 'provider_complaint_created',
          name: 'provider_complaint_created',
          subject: 'Nouvelle réclamation - {{complaintNumber}}',
          content:
            'Bonjour,\n\nUne nouvelle réclamation a été créée.\n\n- Réclamation: {{complaintNumber}}\n- Titre: {{title}}\n- Type: {{type}}\n- Priorité: {{priority}}\n\n{{actionLine}}\n\nAccédez aux réclamations: {{complaintsUrl}}',
          variables: [
            'complaintNumber',
            'title',
            'type',
            'priority',
            'actionLine',
            'complaintsUrl',
          ],
          channels: [{ type: 'IN_APP', enabled: true, priority: 'HIGH' }],
          locale,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        csm_complaint_created: {
          _id: 'csm_complaint_created',
          id: 'csm_complaint_created',
          name: 'csm_complaint_created',
          subject: 'Conflit à suivre (portefeuille) - {{complaintNumber}}',
          content:
            'Bonjour,\n\nUn conflit/réclamation concerne un prestataire de votre portefeuille.\n\n- Réclamation: {{complaintNumber}}\n- Titre: {{title}}\n- Type: {{type}}\n- Priorité: {{priority}}\n\n{{actionLine}}\n\nOuvrir les réclamations: {{complaintsUrl}}',
          variables: [
            'complaintNumber',
            'title',
            'type',
            'priority',
            'actionLine',
            'complaintsUrl',
          ],
          channels: [{ type: 'IN_APP', enabled: true, priority: 'HIGH' }],
          locale,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        csm_booking_created: {
          _id: 'csm_booking_created',
          id: 'csm_booking_created',
          name: 'csm_booking_created',
          subject: 'Nouvelle réservation (portefeuille) - {{reservationNumber}}',
          content:
            'Bonjour,\n\nUne nouvelle réservation concerne un prestataire de votre portefeuille.\n\n- Réservation: {{reservationNumber}}\n- Prestataire: {{providerName}}\n- Service: {{serviceName}}\n- Date: {{appointmentDate}} {{appointmentTime}}\n\nVoir les réservations: {{bookingsUrl}}',
          variables: [
            'reservationNumber',
            'providerName',
            'serviceName',
            'appointmentDate',
            'appointmentTime',
            'bookingsUrl',
          ],
          channels: [{ type: 'IN_APP', enabled: true, priority: 'MEDIUM' }],
          locale,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        csm_booking_cancelled: {
          _id: 'csm_booking_cancelled',
          id: 'csm_booking_cancelled',
          name: 'csm_booking_cancelled',
          subject: 'Réservation annulée (portefeuille) - {{reservationNumber}}',
          content:
            'Bonjour,\n\nUne réservation a été annulée sur votre portefeuille.\n\n- Réservation: {{reservationNumber}}\n- Prestataire: {{providerName}}\n- Service: {{serviceName}}\n- Date: {{appointmentDate}} {{appointmentTime}}\n\nVoir les réservations: {{bookingsUrl}}',
          variables: [
            'reservationNumber',
            'providerName',
            'serviceName',
            'appointmentDate',
            'appointmentTime',
            'bookingsUrl',
          ],
          channels: [{ type: 'IN_APP', enabled: true, priority: 'HIGH' }],
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
    // Ne pas envoyer si la notification n'est pas due / est expirée / condition métier non satisfaite
    if (!(await this.shouldDeliverNow(notification))) return;

    let sentAtLeastOne = false;

    for (const channel of notification.channels) {
      if (!channel.enabled) continue;

      try {
        switch (channel.type) {
          case 'EMAIL':
            // Anti-spam: respecter les préférences email (sauf types transactionnels/obligatoires)
            if (!(await this.shouldSendEmailForNotification(notification))) {
              this.log.info(
                { notificationId: notification.id, recipient: notification.recipient },
                'Email suppressed by user preferences',
              );
              break;
            }
            await this.sendEmail(notification);
            sentAtLeastOne = true;
            break;
          case 'SMS':
            await this.sendSMS(notification);
            sentAtLeastOne = true;
            break;
          case 'PUSH':
            await this.sendPush(notification);
            sentAtLeastOne = true;
            break;
          case 'WHATSAPP':
            await this.sendWhatsApp(notification);
            sentAtLeastOne = true;
            break;
          case 'IN_APP':
            await this.sendInApp(notification);
            sentAtLeastOne = true;
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

    // Si aucun canal n'a effectivement envoyé (ex: email désactivé + aucun autre canal),
    // on évite de laisser la notif en PENDING indéfiniment.
    if (!sentAtLeastOne) {
      await this.notificationRepository.updateStatus(
        String(notification.id),
        'EXPIRED',
        {
          failedAt: new Date(),
          failureReason:
            "Notification supprimée (aucun canal actif après préférences utilisateur)",
        },
      );
    }
  }

  /**
   * Livrer une notification existante (utile pour traiter les notifications planifiées).
   */
  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  async deliverNotificationById(notificationId: string): Promise<boolean> {
    const notif = await this.notificationRepository.findById(notificationId);
    if (!notif) return false;
    await this.sendToChannels(notif);
    return true;
  }

  /**
   * Envoyer un email via Resend
   */
  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  private async sendEmail(notification: Notification): Promise<void> {
    try {
      // Récupérer l'email de l'utilisateur si recipient est un ID
      let recipientEmail = notification.recipient;
      
      // Vérifier si recipient est un email valide ou un ID
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(notification.recipient);
      
      if (!isEmail) {
        // C'est probablement un ID utilisateur, récupérer l'email
        try {
          const { getUserRepository } = await import('@/repositories');
          const userRepository = getUserRepository();
          const user = await userRepository.findById(notification.recipient);
          
          if (user && user.email) {
            recipientEmail = user.email;
            this.log.debug(
              { userId: notification.recipient, email: recipientEmail },
              'Resolved user email from userId',
            );
          } else {
            this.log.warn(
              { recipient: notification.recipient },
              'User not found or has no email, cannot send email',
            );
            throw new Error(`User not found or has no email: ${notification.recipient}`);
          }
        } catch (userError) {
          this.log.error(
            { error: userError, recipient: notification.recipient },
            'Error fetching user email',
          );
          throw new Error(`Failed to resolve user email: ${notification.recipient}`);
        }
      }
      
      const emailSent = await sendEmail({
        to: recipientEmail,
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
