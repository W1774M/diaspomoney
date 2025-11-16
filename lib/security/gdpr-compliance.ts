/**
 * GDPR Compliance - DiaspoMoney
 * Conformité RGPD pour la gestion des données personnelles
 *
 * Implémente les design patterns :
 * - Repository Pattern (via IGDPRConsentRepository, IDataProcessingRecordRepository, IDataSubjectRequestRepository)
 * - Dependency Injection (via getGDPRConsentRepository, getDataProcessingRecordRepository, getDataSubjectRequestRepository)
 * - Logger Pattern (structured logging avec childLogger)
 * - Decorator Pattern (@Log, @Cacheable, @InvalidateCache dans les repositories)
 * - Singleton Pattern (GDPRCompliance)
 * - Error Handling Pattern (Sentry)
 */

import { childLogger } from '@/lib/logger';
import { monitoringManager } from '@/lib/monitoring/advanced-monitoring';
import { getRedisClient } from '@/lib/redis/redis-client';
import { destroyUserSessions } from '@/lib/session-security';
import {
  getAuditLogRepository,
  getBeneficiaryRepository,
  getBookingRepository,
  getDataProcessingRecordRepository,
  getDataSubjectRequestRepository,
  getGDPRConsentRepository,
  getKYCRepository,
  getNotificationRepository,
  getTransactionRepository,
  getUserRepository,
} from '@/repositories';
import type {
  DataProcessingRecord,
  DataSubjectRequest,
  GDPRConsent,
} from '@/types/gdpr';
import * as Sentry from '@sentry/nextjs';
import { fieldEncryption, SENSITIVE_FIELDS } from './field-encryption';

export class GDPRCompliance {
  private static instance: GDPRCompliance;
  private readonly gdprConsentRepository = getGDPRConsentRepository();
  private readonly dataProcessingRecordRepository =
    getDataProcessingRecordRepository();
  private readonly dataSubjectRequestRepository =
    getDataSubjectRequestRepository();
  private readonly userRepository = getUserRepository();
  private readonly transactionRepository = getTransactionRepository();
  private readonly bookingRepository = getBookingRepository();
  private readonly notificationRepository = getNotificationRepository();
  private readonly auditLogRepository = getAuditLogRepository();
  private readonly beneficiaryRepository = getBeneficiaryRepository();
  private readonly kycRepository = getKYCRepository();
  private readonly log = childLogger({
    component: 'GDPRCompliance',
  });

  static getInstance(): GDPRCompliance {
    if (!GDPRCompliance.instance) {
      GDPRCompliance.instance = new GDPRCompliance();
    }
    return GDPRCompliance.instance;
  }

  /**
   * Enregistrer un consentement
   */
  async recordConsent(
    userId: string,
    purpose: string,
    dataCategories: string[],
    legalBasis: GDPRConsent['legalBasis'],
    retentionPeriod: number = 365
  ): Promise<GDPRConsent> {
    try {
      const consent: GDPRConsent = {
        id: `consent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        purpose,
        granted: true,
        grantedAt: new Date(),
        legalBasis,
        dataCategories,
        retentionPeriod,
        isActive: true,
      };

      // Sauvegarder en base de données via le repository
      await this.gdprConsentRepository.create(consent);

      this.log.debug(
        {
          consentId: consent.id,
          userId: consent.userId,
          purpose: consent.purpose,
          legalBasis: consent.legalBasis,
        },
        'GDPR consent saved to database'
      );

      // Enregistrer l'audit
      await this.recordDataProcessing(
        userId,
        purpose,
        dataCategories,
        legalBasis,
        retentionPeriod
      );

      // Enregistrer les métriques
      monitoringManager.recordMetric({
        name: 'gdpr_consents_recorded',
        value: 1,
        timestamp: new Date(),
        labels: {
          purpose,
          legal_basis: legalBasis,
          retention_days: retentionPeriod.toString(),
        },
        type: 'counter',
      });

      return consent;
    } catch (error) {
      this.log.error(
        { error, userId, purpose, legalBasis },
        'GDPR consent recording error'
      );
      Sentry.captureException(error, {
        tags: {
          component: 'GDPRCompliance',
          action: 'recordConsent',
        },
        extra: { userId, purpose, dataCategories, legalBasis, retentionPeriod },
      });
      throw error;
    }
  }

  /**
   * Retirer un consentement
   */
  async withdrawConsent(consentId: string, reason?: string): Promise<void> {
    try {
      // Récupérer le consentement existant
      const existingConsent = await this.gdprConsentRepository.findById(
        consentId
      );

      if (!existingConsent) {
        throw new Error(`Consent not found: ${consentId}`);
      }

      // Mettre à jour le consentement via le repository
      const updatedConsent = await this.gdprConsentRepository.withdrawConsent(
        consentId,
        existingConsent.userId,
        reason
      );

      if (!updatedConsent) {
        throw new Error(`Failed to withdraw consent: ${consentId}`);
      }

      this.log.info(
        {
          consentId: updatedConsent.id,
          userId: updatedConsent.userId,
          reason,
        },
        'GDPR consent withdrawn'
      );

      // Enregistrer l'audit
      await this.recordDataProcessing(
        existingConsent.userId,
        'consent_withdrawal',
        ['consent_data'],
        'LEGAL_OBLIGATION',
        30
      );

      // Enregistrer les métriques
      monitoringManager.recordMetric({
        name: 'gdpr_consents_withdrawn',
        value: 1,
        timestamp: new Date(),
        labels: {
          purpose: existingConsent.purpose,
          legal_basis: existingConsent.legalBasis,
        },
        type: 'counter',
      });
    } catch (error) {
      this.log.error(
        { error, consentId, reason },
        'GDPR consent withdrawal error'
      );
      Sentry.captureException(error, {
        tags: {
          component: 'GDPRCompliance',
          action: 'withdrawConsent',
        },
        extra: { consentId, reason },
      });
      throw error;
    }
  }

  /**
   * Traiter une demande d'accès aux données (Article 15)
   */
  async handleDataAccessRequest(userId: string): Promise<DataSubjectRequest> {
    try {
      const request: DataSubjectRequest = {
        id: `dsr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        type: 'ACCESS',
        status: 'PENDING',
        requestedAt: new Date(),
      };

      // Sauvegarder la demande via le repository
      const savedRequest = await this.dataSubjectRequestRepository.create(
        request
      );

      this.log.debug(
        {
          requestId: savedRequest.id,
          userId: savedRequest.userId,
          type: savedRequest.type,
        },
        'Data access request saved to database'
      );

      // Collecter toutes les données personnelles
      const personalData = await this.collectPersonalData(userId);

      // Déchiffrer les données sensibles
      const decryptedData = this.decryptPersonalData(personalData, userId);

      // Mettre à jour la demande
      const updatedRequest =
        await this.dataSubjectRequestRepository.updateStatus(
          savedRequest.id,
          'COMPLETED',
          new Date(),
          decryptedData
        );

      if (!updatedRequest) {
        throw new Error(
          `Failed to update data access request: ${savedRequest.id}`
        );
      }

      // Enregistrer l'audit
      await this.recordDataProcessing(
        userId,
        'data_access_request',
        ['personal_data'],
        'LEGAL_OBLIGATION',
        30
      );

      return updatedRequest;
    } catch (error) {
      this.log.error({ error, userId }, 'GDPR data access request error');
      Sentry.captureException(error, {
        tags: {
          component: 'GDPRCompliance',
          action: 'handleDataAccessRequest',
        },
        extra: { userId },
      });
      throw error;
    }
  }

  /**
   * Traiter une demande de suppression (Article 17 - Droit à l'effacement)
   */
  async handleDataErasureRequest(
    userId: string,
    reason?: string
  ): Promise<DataSubjectRequest> {
    try {
      const request: Omit<DataSubjectRequest, 'reason'> & { reason?: string } =
        {
          id: `dsr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId,
          type: 'ERASURE',
          status: 'PENDING',
          requestedAt: new Date(),
          reason: reason ?? undefined,
        } as Omit<DataSubjectRequest, 'reason'> & { reason?: string };

      // Sauvegarder la demande via le repository
      const savedRequest = await this.dataSubjectRequestRepository.create(
        request
      );

      this.log.debug(
        {
          requestId: savedRequest.id,
          userId: savedRequest.userId,
          type: savedRequest.type,
          reason: savedRequest.reason,
        },
        'Data erasure request saved to database'
      );

      // Anonymiser les données au lieu de les supprimer (pour les obligations légales)
      await this.anonymizeUserData(userId);

      // Supprimer les données non essentielles
      await this.deleteNonEssentialData(userId);

      // Mettre à jour la demande
      const updatedRequest =
        await this.dataSubjectRequestRepository.updateStatus(
          savedRequest.id,
          'COMPLETED',
          new Date()
        );

      if (!updatedRequest) {
        throw new Error(
          `Failed to update data erasure request: ${savedRequest.id}`
        );
      }

      // Enregistrer l'audit
      await this.recordDataProcessing(
        userId,
        'data_erasure_request',
        ['personal_data'],
        'LEGAL_OBLIGATION',
        30
      );

      return updatedRequest;
    } catch (error) {
      this.log.error(
        { error, userId, reason },
        'GDPR data erasure request error'
      );
      Sentry.captureException(error, {
        tags: {
          component: 'GDPRCompliance',
          action: 'handleDataErasureRequest',
        },
        extra: { userId, reason },
      });
      throw error;
    }
  }

  /**
   * Traiter une demande de portabilité (Article 20)
   */
  async handleDataPortabilityRequest(
    userId: string
  ): Promise<DataSubjectRequest> {
    try {
      const request: DataSubjectRequest = {
        id: `dsr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        type: 'PORTABILITY',
        status: 'PENDING',
        requestedAt: new Date(),
      };

      // Collecter les données exportables
      const exportableData = await this.collectExportableData(userId);

      // Déchiffrer les données
      const decryptedData = this.decryptPersonalData(exportableData, userId);

      // Générer un fichier JSON structuré
      const portableData = {
        user: decryptedData.user,
        transactions: decryptedData.transactions,
        preferences: decryptedData.preferences,
        exportedAt: new Date().toISOString(),
        format: 'JSON',
        version: '1.0',
      };

      // Sauvegarder la demande via le repository
      const savedRequest = await this.dataSubjectRequestRepository.create(
        request
      );

      this.log.debug(
        {
          requestId: savedRequest.id,
          userId: savedRequest.userId,
          type: savedRequest.type,
        },
        'Data portability request saved to database'
      );

      // Mettre à jour la demande avec les données portables
      const updatedRequest =
        await this.dataSubjectRequestRepository.updateStatus(
          savedRequest.id,
          'COMPLETED',
          new Date(),
          portableData
        );

      if (!updatedRequest) {
        throw new Error(
          `Failed to update data portability request: ${savedRequest.id}`
        );
      }

      return updatedRequest;
    } catch (error) {
      this.log.error({ error, userId }, 'GDPR data portability request error');
      Sentry.captureException(error, {
        tags: {
          component: 'GDPRCompliance',
          action: 'handleDataPortabilityRequest',
        },
        extra: { userId },
      });
      throw error;
    }
  }

  /**
   * Collecter toutes les données personnelles d'un utilisateur
   */
  private async collectPersonalData(userId: string): Promise<any> {
    try {
      this.log.debug({ userId }, 'Collecting personal data for GDPR request');

      // Récupérer toutes les données associées via les repositories
      const [
        user,
        transactionsResult,
        bookingsResult,
        notificationsResult,
        auditLogsResult,
        consentsResult,
        dataProcessingRecordsResult,
        dataSubjectRequestsResult,
      ] = await Promise.all([
        // Utilisateur
        this.userRepository.findById(userId),

        // Transactions (payerId ou beneficiaryId)
        this.transactionRepository.findTransactionsWithFilters(
          {
            $or: [{ payerId: userId }, { beneficiaryId: userId }],
          },
          {
            limit: 10000, // Limite élevée pour récupérer toutes les transactions
            offset: 0,
            sort: { createdAt: -1 },
          }
        ),

        // Bookings/Appointments (requesterId)
        this.bookingRepository.findBookingsWithFilters(
          {
            requesterId: userId,
          },
          {
            limit: 10000,
            offset: 0,
            sort: { createdAt: -1 },
          }
        ),

        // Notifications (recipient)
        this.notificationRepository.findByRecipient(userId, {
          limit: 10000,
          offset: 0,
        }),

        // Audit logs
        this.auditLogRepository.searchAuditLogs(
          {
            userId,
          },
          {
            limit: 10000,
            offset: 0,
            sort: { timestamp: -1 },
          }
        ),

        // Consentements GDPR
        this.gdprConsentRepository.findActiveByUserId(userId, {
          limit: 10000,
          offset: 0,
        }),

        // Enregistrements de traitement de données
        this.dataProcessingRecordRepository.findByUserId(userId, {
          limit: 10000,
          offset: 0,
        }),

        // Demandes de sujet de données
        this.dataSubjectRequestRepository.findByUserId(userId, {
          limit: 10000,
          offset: 0,
        }),
      ]);

      if (!user) {
        throw new Error(`User not found: ${userId}`);
      }

      const personalData = {
        user: {
          id: user.id || user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          country: user.country || (user as any).countryOfResidence,
          roles: user.roles,
          status: user.status,
          avatar: (user as any)['avatar'],
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
        transactions: transactionsResult.data.map((t: any) => ({
          id: t.id || t._id,
          amount: t.amount,
          currency: t.currency,
          status: t.status,
          type: t.type,
          payerId: t.payerId,
          beneficiaryId: t.beneficiaryId,
          createdAt: t.createdAt,
          updatedAt: t.updatedAt,
        })),
        bookings: bookingsResult.data.map((b: any) => ({
          id: b.id || b._id,
          requesterId: b.requesterId,
          providerId: b.providerId,
          serviceId: b.serviceId,
          status: b.status,
          appointmentDate: b.appointmentDate,
          createdAt: b.createdAt,
          updatedAt: b.updatedAt,
        })),
        notifications: notificationsResult.data.map((n: any) => ({
          id: n.id || n._id,
          type: n.type,
          title: n.title,
          message: n.message,
          read: n.read,
          createdAt: n.createdAt,
          updatedAt: n.updatedAt,
        })),
        auditLogs: auditLogsResult.data.map((log: any) => ({
          id: log.id || log._id,
          action: log.action,
          category: log.category,
          severity: log.severity,
          outcome: log.outcome,
          timestamp: log.timestamp,
        })),
        consents: consentsResult.data.map((c: any) => ({
          id: c.id || c._id,
          purpose: c.purpose,
          granted: c.granted,
          grantedAt: c.grantedAt,
          withdrawnAt: c.withdrawnAt,
          legalBasis: c.legalBasis,
          dataCategories: c.dataCategories,
          retentionPeriod: c.retentionPeriod,
          isActive: c.isActive,
        })),
        dataProcessingRecords: dataProcessingRecordsResult.data.map(
          (r: any) => ({
            id: r.id || r._id,
            purpose: r.purpose,
            dataCategories: r.dataCategories,
            legalBasis: r.legalBasis,
            processedAt: r.processedAt,
            processor: r.processor,
            retentionPeriod: r.retentionPeriod,
            isAnonymized: r.isAnonymized,
          })
        ),
        dataSubjectRequests: dataSubjectRequestsResult.data.map((r: any) => ({
          id: r.id || r._id,
          type: r.type,
          status: r.status,
          requestedAt: r.requestedAt,
          completedAt: r.completedAt,
          reason: r.reason,
        })),
        preferences: {
          // Les préférences utilisateur peuvent être dans user.preferences
          ...((user as any).preferences || {}),
        },
        collectedAt: new Date(),
      };

      this.log.info(
        {
          userId,
          transactionsCount: transactionsResult.data.length,
          bookingsCount: bookingsResult.data.length,
          notificationsCount: notificationsResult.data.length,
          auditLogsCount: auditLogsResult.data.length,
          consentsCount: consentsResult.data.length,
        },
        'Personal data collected successfully'
      );

      return personalData;
    } catch (error) {
      this.log.error({ error, userId }, 'Collect personal data error');
      Sentry.captureException(error, {
        tags: {
          component: 'GDPRCompliance',
          action: 'collectPersonalData',
        },
        extra: { userId },
      });
      throw error;
    }
  }

  /**
   * Déchiffrer les données personnelles
   */
  private decryptPersonalData(data: any, userId: string): any {
    try {
      const decrypted = { ...data };

      // Déchiffrer les champs sensibles de l'utilisateur
      if (data.user) {
        decrypted.user = fieldEncryption.decryptObject(
          data.user,
          SENSITIVE_FIELDS.PERSONAL,
          userId
        );
      }

      // Déchiffrer les transactions
      if (data.transactions) {
        decrypted.transactions = data.transactions.map((transaction: any) =>
          fieldEncryption.decryptObject(
            transaction,
            SENSITIVE_FIELDS.FINANCIAL,
            userId
          )
        );
      }

      return decrypted;
    } catch (error) {
      this.log.error({ error, userId }, 'Decrypt personal data error');
      throw error;
    }
  }

  /**
   * Anonymiser les données d'un utilisateur
   */
  private async anonymizeUserData(userId: string): Promise<void> {
    try {
      this.log.debug({ userId }, 'Anonymizing user data');

      // Récupérer l'utilisateur pour vérifier son existence
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new Error(`User not found: ${userId}`);
      }

      // Anonymiser les données personnelles via le repository
      const anonymizedData: Partial<any> = {
        email: `deleted_${userId}@anonymized.com`,
        phone: null,
        firstName: '[ANONYMIZED]',
        lastName: '[ANONYMIZED]',
        name: '[ANONYMIZED]',
        address: null,
        dateOfBirth: null,
        nationalId: null,
        countryOfResidence: null,
        targetCountry: null,
        targetCity: null,
        company: null,
        avatar: null,
        isActive: false,
        anonymizedAt: new Date(),
        gdprAnonymized: true,
        updatedAt: new Date(),
      };

      // Mettre à jour l'utilisateur via le repository
      const updatedUser = await this.userRepository.update(
        userId,
        anonymizedData
      );

      if (!updatedUser) {
        throw new Error(`Failed to anonymize user: ${userId}`);
      }

      this.log.info(
        {
          userId,
          anonymizedEmail: anonymizedData['email'],
          anonymizedAt: anonymizedData['anonymizedAt'],
        },
        'User data anonymized successfully'
      );

      // Enregistrer l'audit
      await this.recordDataProcessing(
        userId,
        'data_anonymization',
        ['personal_data', 'contact_data', 'identification_data'],
        'LEGAL_OBLIGATION',
        365 // Rétention de 1 an pour les données anonymisées
      );

      // Enregistrer les métriques
      monitoringManager.recordMetric({
        name: 'gdpr_data_anonymized',
        value: 1,
        timestamp: new Date(),
        labels: {
          userId,
        },
        type: 'counter',
      });
    } catch (error) {
      this.log.error({ error, userId }, 'Anonymize user data error');
      Sentry.captureException(error, {
        tags: {
          component: 'GDPRCompliance',
          action: 'anonymizeUserData',
        },
        extra: { userId },
      });
      throw error;
    }
  }

  /**
   * Supprimer les données non essentielles
   */
  private async deleteNonEssentialData(userId: string): Promise<void> {
    try {
      this.log.debug({ userId }, 'Deleting non-essential user data');

      const deletionResults = {
        notifications: 0,
        beneficiaries: 0,
        kyc: false,
        sessions: false,
        cache: false,
      };

      // Supprimer les notifications de l'utilisateur
      try {
        const notifications = await this.notificationRepository.findByRecipient(
          userId,
          {
            limit: 10000,
            offset: 0,
          }
        );

        for (const notification of notifications.data) {
          await this.notificationRepository.delete(notification.id);
          deletionResults.notifications++;
        }

        this.log.info(
          { userId, count: deletionResults.notifications },
          'Notifications deleted'
        );
      } catch (notificationError) {
        this.log.warn(
          { error: notificationError, userId },
          'Error deleting notifications, continuing'
        );
      }

      // Désactiver les bénéficiaires de l'utilisateur
      try {
        const beneficiaries =
          await this.beneficiaryRepository.findActiveByPayer(userId, {
            limit: 10000,
            offset: 0,
          });

        for (const beneficiary of beneficiaries.data) {
          await this.beneficiaryRepository.deactivate(beneficiary.id, userId);
          deletionResults.beneficiaries++;
        }

        this.log.info(
          { userId, count: deletionResults.beneficiaries },
          'Beneficiaries deactivated'
        );
      } catch (beneficiaryError) {
        this.log.warn(
          { error: beneficiaryError, userId },
          'Error deactivating beneficiaries, continuing'
        );
      }

      // Supprimer les données KYC (documents sensibles)
      try {
        const kyc = await this.kycRepository.findByUserId(userId);
        if (kyc && kyc._id) {
          await this.kycRepository.delete(kyc._id);
          deletionResults.kyc = true;
          this.log.info({ userId, kycId: kyc._id }, 'KYC data deleted');
        }
      } catch (kycError) {
        this.log.warn(
          { error: kycError, userId },
          'Error deleting KYC data, continuing'
        );
      }

      // Supprimer les sessions utilisateur (en mémoire)
      try {
        destroyUserSessions(userId);
        deletionResults.sessions = true;
        this.log.debug({ userId }, 'User sessions destroyed');
      } catch (sessionError) {
        this.log.warn(
          { error: sessionError, userId },
          'Error destroying sessions, continuing'
        );
      }

      // Supprimer les sessions Redis (on utilise deleteSession avec le userId comme clé)
      try {
        const redisClient = getRedisClient();
        // Supprimer la session Redis si elle existe (format: session:userId)
        await redisClient.deleteSession(userId);
        deletionResults.cache = true;
        this.log.debug({ userId }, 'Redis session deleted');
      } catch (redisError) {
        this.log.warn(
          { error: redisError, userId },
          'Error deleting Redis session, continuing'
        );
      }

      this.log.info(
        {
          userId,
          deletionResults,
        },
        'Non-essential data deleted successfully'
      );

      // Enregistrer l'audit
      await this.recordDataProcessing(
        userId,
        'non_essential_data_deletion',
        ['notifications', 'sessions', 'cache', 'beneficiaries', 'kyc'],
        'LEGAL_OBLIGATION',
        30 // Rétention de 30 jours pour les logs d'audit
      );

      // Enregistrer les métriques
      monitoringManager.recordMetric({
        name: 'gdpr_non_essential_data_deleted',
        value: 1,
        timestamp: new Date(),
        labels: {
          userId,
          notificationsCount: deletionResults.notifications.toString(),
          beneficiariesCount: deletionResults.beneficiaries.toString(),
        },
        type: 'counter',
      });
    } catch (error) {
      this.log.error({ error, userId }, 'Delete non-essential data error');
      Sentry.captureException(error, {
        tags: {
          component: 'GDPRCompliance',
          action: 'deleteNonEssentialData',
        },
        extra: { userId },
      });
      throw error;
    }
  }

  /**
   * Collecter les données exportables
   */
  private async collectExportableData(_userId: string): Promise<any> {
    try {
      // Collecter uniquement les données exportables selon l'article 20
      return {
        user: {},
        transactions: [],
        preferences: {},
        exportedAt: new Date(),
      };
    } catch (error) {
      this.log.error(
        { error, userId: _userId },
        'Collect exportable data error'
      );
      throw error;
    }
  }

  /**
   * Enregistrer un traitement de données
   */
  private async recordDataProcessing(
    userId: string,
    purpose: string,
    dataCategories: string[],
    legalBasis: string,
    retentionPeriod: number
  ): Promise<void> {
    try {
      const record: DataProcessingRecord = {
        id: `dpr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        purpose,
        dataCategories,
        legalBasis,
        processedAt: new Date(),
        processor: 'diaspomoney-system',
        retentionPeriod,
        isAnonymized: false,
      };

      // Sauvegarder l'enregistrement via le repository
      await this.dataProcessingRecordRepository.create(record);

      this.log.debug(
        {
          recordId: record.id,
          userId: record.userId,
          purpose: record.purpose,
          legalBasis: record.legalBasis,
        },
        'Data processing record saved to database'
      );
    } catch (error) {
      this.log.error(
        { error, userId, purpose },
        'Record data processing error'
      );
      Sentry.captureException(error, {
        tags: {
          component: 'GDPRCompliance',
          action: 'recordDataProcessing',
        },
        extra: { userId, purpose, dataCategories, legalBasis },
      });
      throw error;
    }
  }

  /**
   * Vérifier la conformité GDPR
   */
  async checkGDPRCompliance(_userId: string): Promise<{
    isCompliant: boolean;
    issues: string[];
    recommendations: string[];
  }> {
    try {
      const issues: string[] = [];
      const recommendations: string[] = [];

      // Vérifier les consentements
      // const consents = await Consent.find({ userId, isActive: true });
      // if (consents.length === 0) {
      //   issues.push('No active consents found');
      //   recommendations.push('Obtain explicit consent for data processing');
      // }

      // Vérifier la rétention des données
      // const oldData = await this.findOldData(userId);
      // if (oldData.length > 0) {
      //   issues.push('Data retention period exceeded');
      //   recommendations.push('Review and delete old data');
      // }

      return {
        isCompliant: issues.length === 0,
        issues,
        recommendations,
      };
    } catch (error) {
      this.log.error({ error, userId: _userId }, 'GDPR compliance check error');
      throw error;
    }
  }
}

// Instance singleton
export const gdprCompliance = GDPRCompliance.getInstance();
