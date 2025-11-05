/**
 * Notification Service - DiaspoMoney
 * Service de notifications multi-canaux Company-Grade
 * Basé sur la charte de développement
 */

import { monitoringManager } from '@/lib/monitoring/advanced-monitoring';
import * as Sentry from '@sentry/nextjs';

export interface NotificationTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  variables: string[];
  channels: NotificationChannel[];
  locale: string;
}

export interface NotificationChannel {
  type: 'EMAIL' | 'SMS' | 'PUSH' | 'WHATSAPP' | 'IN_APP';
  enabled: boolean;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
}

export interface NotificationData {
  recipient: string;
  type: string;
  template: string;
  data: Record<string, any>;
  channels: NotificationChannel[];
  locale: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  scheduledAt?: Date;
  expiresAt?: Date;
}

export interface Notification {
  id: string;
  recipient: string;
  type: string;
  subject: string;
  content: string;
  channels: NotificationChannel[];
  status: 'PENDING' | 'SENT' | 'DELIVERED' | 'FAILED' | 'EXPIRED';
  sentAt?: Date;
  deliveredAt?: Date;
  failedAt?: Date;
  failureReason?: string;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationStats {
  totalSent: number;
  deliveryRate: number;
  failureRate: number;
  averageDeliveryTime: number;
  channelBreakdown: Record<string, { sent: number; delivered: number; failed: number }>;
}

export class NotificationService {
  private static instance: NotificationService;
  
  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Envoyer une notification
   */
  async sendNotification(data: NotificationData): Promise<Notification> {
    try {
      // Validation des données
      if (!data.recipient || !data.type || !data.template) {
        throw new Error('Données de notification incomplètes');
      }

      // Récupérer le template
      const template = await this.getTemplate(data.template, data.locale);
      if (!template) {
        throw new Error(`Template non trouvé: ${data.template}`);
      }

      // Remplacer les variables dans le template
      const processedContent = this.processTemplate(template, data.data);
      
      // Créer la notification
      const notification: Notification = {
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        recipient: data.recipient,
        type: data.type,
        subject: processedContent.subject,
        content: processedContent.content,
        channels: data.channels,
        status: 'PENDING',
        metadata: {
          template: data.template,
          locale: data.locale,
          priority: data.priority,
          originalData: data.data
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // TODO: Sauvegarder en base de données
      // await Notification.create(notification);

      // Envoyer via les canaux activés
      await this.sendToChannels(notification);

      // Enregistrer les métriques
      monitoringManager.recordMetric({
        name: 'notifications_sent',
        value: 1,
        timestamp: new Date(),
        labels: {
          type: data.type,
          priority: data.priority,
          locale: data.locale
        },
        type: 'counter'
      });

      return notification;

    } catch (error) {
      console.error('Erreur sendNotification:', error);
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Envoyer une notification de bienvenue
   */
  async sendWelcomeNotification(userEmail: string, userName: string, locale: string = 'fr'): Promise<void> {
    try {
      await this.sendNotification({
        recipient: userEmail,
        type: 'WELCOME_EMAIL',
        template: 'welcome',
        data: {
          userName,
          appName: 'DiaspoMoney',
          supportEmail: 'support@diaspomoney.fr'
        },
        channels: [{ type: 'EMAIL', enabled: true, priority: 'MEDIUM' }],
        locale,
        priority: 'MEDIUM'
      });

    } catch (error) {
      console.error('Erreur sendWelcomeNotification:', error);
      throw error;
    }
  }

  /**
   * Envoyer une notification de succès de paiement
   */
  async sendPaymentSuccessNotification(
    userEmail: string,
    amount: number,
    currency: string,
    serviceName: string,
    locale: string = 'fr'
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
          transactionDate: new Date().toLocaleDateString(locale)
        },
        channels: [
          { type: 'EMAIL', enabled: true, priority: 'HIGH' },
          { type: 'PUSH', enabled: true, priority: 'HIGH' }
        ],
        locale,
        priority: 'HIGH'
      });

    } catch (error) {
      console.error('Erreur sendPaymentSuccessNotification:', error);
      throw error;
    }
  }

  /**
   * Envoyer une notification d'échec de paiement
   */
  async sendPaymentFailedNotification(
    userEmail: string,
    amount: number,
    currency: string,
    reason: string,
    locale: string = 'fr'
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
          supportEmail: 'support@diaspomoney.fr'
        },
        channels: [
          { type: 'EMAIL', enabled: true, priority: 'HIGH' },
          { type: 'SMS', enabled: true, priority: 'URGENT' }
        ],
        locale,
        priority: 'HIGH'
      });

    } catch (error) {
      console.error('Erreur sendPaymentFailedNotification:', error);
      throw error;
    }
  }

  /**
   * Envoyer une notification KYC approuvé
   */
  async sendKYCApprovedNotification(
    userEmail: string,
    userName: string,
    locale: string = 'fr'
  ): Promise<void> {
    try {
      await this.sendNotification({
        recipient: userEmail,
        type: 'KYC_APPROVED',
        template: 'kyc_approved',
        data: {
          userName,
          appName: 'DiaspoMoney'
        },
        channels: [
          { type: 'EMAIL', enabled: true, priority: 'MEDIUM' },
          { type: 'PUSH', enabled: true, priority: 'MEDIUM' }
        ],
        locale,
        priority: 'MEDIUM'
      });

    } catch (error) {
      console.error('Erreur sendKYCApprovedNotification:', error);
      throw error;
    }
  }

  /**
   * Envoyer un code 2FA
   */
  async send2FACode(
    userPhone: string,
    code: string,
    locale: string = 'fr'
  ): Promise<void> {
    try {
      await this.sendNotification({
        recipient: userPhone,
        type: 'TWO_FACTOR_CODE',
        template: '2fa_code',
        data: {
          code,
          appName: 'DiaspoMoney',
          expiresIn: '5 minutes'
        },
        channels: [
          { type: 'SMS', enabled: true, priority: 'URGENT' }
        ],
        locale,
        priority: 'URGENT',
        expiresAt: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes
      });

    } catch (error) {
      console.error('Erreur send2FACode:', error);
      throw error;
    }
  }

  /**
   * Envoyer un rappel de rendez-vous
   */
  async sendAppointmentReminder(
    userEmail: string,
    appointmentDate: Date,
    serviceName: string,
    providerName: string,
    locale: string = 'fr'
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
          providerName
        },
        channels: [
          { type: 'EMAIL', enabled: true, priority: 'MEDIUM' },
          { type: 'PUSH', enabled: true, priority: 'MEDIUM' }
        ],
        locale,
        priority: 'MEDIUM',
        scheduledAt: new Date(appointmentDate.getTime() - 24 * 60 * 60 * 1000) // 24h avant
      });

    } catch (error) {
      console.error('Erreur sendAppointmentReminder:', error);
      throw error;
    }
  }

  /**
   * Récupérer un template
   */
  private async getTemplate(templateName: string, locale: string): Promise<NotificationTemplate | null> {
    try {
      // TODO: Récupérer depuis la base de données
      // const template = await NotificationTemplate.findOne({ 
      //   name: templateName, 
      //   locale 
      // });

      // Templates par défaut
      const defaultTemplates: Record<string, NotificationTemplate> = {
        'welcome': {
          id: 'welcome',
          name: 'welcome',
          subject: 'Bienvenue sur DiaspoMoney',
          content: 'Bonjour {{userName}}, bienvenue sur {{appName}} ! Votre compte a été créé avec succès.',
          variables: ['userName', 'appName'],
          channels: [{ type: 'EMAIL', enabled: true, priority: 'MEDIUM' }],
          locale
        },
        'payment_success': {
          id: 'payment_success',
          name: 'payment_success',
          subject: 'Paiement confirmé - {{serviceName}}',
          content: 'Votre paiement de {{amount}} {{currency}} pour {{serviceName}} a été confirmé le {{transactionDate}}.',
          variables: ['amount', 'currency', 'serviceName', 'transactionDate'],
          channels: [{ type: 'EMAIL', enabled: true, priority: 'HIGH' }],
          locale
        },
        'payment_failed': {
          id: 'payment_failed',
          name: 'payment_failed',
          subject: 'Échec du paiement',
          content: 'Votre paiement de {{amount}} {{currency}} a échoué. Raison: {{reason}}. Contactez {{supportEmail}} pour assistance.',
          variables: ['amount', 'currency', 'reason', 'supportEmail'],
          channels: [{ type: 'EMAIL', enabled: true, priority: 'HIGH' }],
          locale
        },
        'kyc_approved': {
          id: 'kyc_approved',
          name: 'kyc_approved',
          subject: 'Vérification d\'identité approuvée',
          content: 'Bonjour {{userName}}, votre vérification d\'identité a été approuvée. Vous pouvez maintenant utiliser tous les services de {{appName}}.',
          variables: ['userName', 'appName'],
          channels: [{ type: 'EMAIL', enabled: true, priority: 'MEDIUM' }],
          locale
        },
        '2fa_code': {
          id: '2fa_code',
          name: '2fa_code',
          subject: 'Code de vérification',
          content: 'Votre code de vérification {{appName}} est: {{code}}. Valide {{expiresIn}}.',
          variables: ['code', 'appName', 'expiresIn'],
          channels: [{ type: 'SMS', enabled: true, priority: 'URGENT' }],
          locale
        },
        'appointment_reminder': {
          id: 'appointment_reminder',
          name: 'appointment_reminder',
          subject: 'Rappel de rendez-vous',
          content: 'Rappel: Vous avez un rendez-vous le {{appointmentDate}} à {{appointmentTime}} avec {{providerName}} pour {{serviceName}}.',
          variables: ['appointmentDate', 'appointmentTime', 'providerName', 'serviceName'],
          channels: [{ type: 'EMAIL', enabled: true, priority: 'MEDIUM' }],
          locale
        }
      };

      return defaultTemplates[templateName] || null;

    } catch (error) {
      console.error('Erreur getTemplate:', error);
      return null;
    }
  }

  /**
   * Traiter un template avec les variables
   */
  private processTemplate(template: NotificationTemplate, data: Record<string, any>): { subject: string; content: string } {
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
        console.error(`Erreur envoi ${channel.type}:`, error);
        // Continuer avec les autres canaux
      }
    }
  }

  /**
   * Envoyer un email
   */
  private async sendEmail(notification: Notification): Promise<void> {
    try {
      // TODO: Intégrer avec SendGrid ou Resend
      console.log(`Email envoyé à ${notification.recipient}: ${notification.subject}`);
      
      // Simulation d'envoi
      await new Promise(resolve => setTimeout(resolve, 100));

    } catch (error) {
      console.error('Erreur sendEmail:', error);
      throw error;
    }
  }

  /**
   * Envoyer un SMS
   */
  private async sendSMS(notification: Notification): Promise<void> {
    try {
      // TODO: Intégrer avec Twilio
      console.log(`SMS envoyé à ${notification.recipient}: ${notification.content}`);
      
      // Simulation d'envoi
      await new Promise(resolve => setTimeout(resolve, 50));

    } catch (error) {
      console.error('Erreur sendSMS:', error);
      throw error;
    }
  }

  /**
   * Envoyer une notification push
   */
  private async sendPush(notification: Notification): Promise<void> {
    try {
      // TODO: Intégrer avec Firebase
      console.log(`Push envoyé à ${notification.recipient}: ${notification.subject}`);
      
      // Simulation d'envoi
      await new Promise(resolve => setTimeout(resolve, 30));

    } catch (error) {
      console.error('Erreur sendPush:', error);
      throw error;
    }
  }

  /**
   * Envoyer un WhatsApp
   */
  private async sendWhatsApp(notification: Notification): Promise<void> {
    try {
      // TODO: Intégrer avec WhatsApp Business API
      console.log(`WhatsApp envoyé à ${notification.recipient}: ${notification.content}`);
      
      // Simulation d'envoi
      await new Promise(resolve => setTimeout(resolve, 200));

    } catch (error) {
      console.error('Erreur sendWhatsApp:', error);
      throw error;
    }
  }

  /**
   * Envoyer une notification in-app
   */
  private async sendInApp(notification: Notification): Promise<void> {
    try {
      // TODO: Sauvegarder en base de données pour affichage in-app
      console.log(`Notification in-app pour ${notification.recipient}: ${notification.subject}`);
      
      // Simulation d'envoi
      await new Promise(resolve => setTimeout(resolve, 10));

    } catch (error) {
      console.error('Erreur sendInApp:', error);
      throw error;
    }
  }

  /**
   * Obtenir les statistiques des notifications
   */
  async getNotificationStats(_period: 'day' | 'week' | 'month' = 'day'): Promise<NotificationStats> {
    try {
      // TODO: Calculer les statistiques depuis la base de données
      return {
        totalSent: 0,
        deliveryRate: 0,
        failureRate: 0,
        averageDeliveryTime: 0,
        channelBreakdown: {}
      };

    } catch (error) {
      console.error('Erreur getNotificationStats:', error);
      throw error;
    }
  }
}

// Export de l'instance singleton
export const notificationService = NotificationService.getInstance();

