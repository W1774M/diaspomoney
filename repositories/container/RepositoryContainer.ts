/**
 * Container de dépendances pour les repositories
 * Implémente le pattern Dependency Injection
 */

import { MongoAttachmentRepository } from '../implementations/MongoAttachmentRepository';
import { MongoAuditLogRepository } from '../implementations/MongoAuditLogRepository';
import { MongoBeneficiaryRepository } from '../implementations/MongoBeneficiaryRepository';
import { MongoBookingRepository } from '../implementations/MongoBookingRepository';
import { MongoComplaintRepository } from '../implementations/MongoComplaintRepository';
import { MongoConversationRepository } from '../implementations/MongoConversationRepository';
import { MongoHealthProviderRepository } from '../implementations/MongoHealthProviderRepository';
import { MongoInvoiceRepository } from '../implementations/MongoInvoiceRepository';
import { MongoKYCRepository } from '../implementations/MongoKYCRepository';
import { MongoMessageRepository } from '../implementations/MongoMessageRepository';
import { MongoNotificationRepository } from '../implementations/MongoNotificationRepository';
import { MongoNotificationTemplateRepository } from '../implementations/MongoNotificationTemplateRepository';
import { MongoPrescriptionRepository } from '../implementations/MongoPrescriptionRepository';
import { MongoQuoteRepository } from '../implementations/MongoQuoteRepository';
import { MongoSpecialityRepository } from '../implementations/MongoSpecialityRepository';
import { MongoSupportTicketRepository } from '../implementations/MongoSupportTicketRepository';
import { MongoTeleconsultationRepository } from '../implementations/MongoTeleconsultationRepository';
import { MongoTransactionRepository } from '../implementations/MongoTransactionRepository';
import { MongoUserRepository } from '../implementations/MongoUserRepository';
import { MongoAvailabilityRuleRepository } from '../implementations/MongoAvailabilityRuleRepository';
import { IAuditLogRepository } from '../interfaces/IAuditLogRepository';
import { IBeneficiaryRepository } from '../interfaces/IBeneficiaryRepository';
import { IBookingRepository } from '../interfaces/IBookingRepository';
import { IComplaintRepository } from '../interfaces/IComplaintRepository';
import { IDataProcessingRecordRepository } from '../interfaces/IDataProcessingRecordRepository';
import { IDataSubjectRequestRepository } from '../interfaces/IDataSubjectRequestRepository';
import { IGDPRConsentRepository } from '../interfaces/IGDPRConsentRepository';
import { IHealthProviderRepository } from '../interfaces/IHealthProviderRepository';
import { IInvoiceRepository } from '../interfaces/IInvoiceRepository';
import { IKYCRepository } from '../interfaces/IKYCRepository';
import {
  IAttachmentRepository,
  IConversationRepository,
  IMessageRepository,
  ISupportTicketRepository,
} from '../interfaces/IMessagingRepository';
import { INotificationRepository } from '../interfaces/INotificationRepository';
import { INotificationTemplateRepository } from '../interfaces/INotificationTemplateRepository';
import { IPCIAuditLogRepository } from '../interfaces/IPCIAuditLogRepository';
import { IPrescriptionRepository } from '../interfaces/IPrescriptionRepository';
import { IQuoteRepository } from '../interfaces/IQuoteRepository';
import { ISpecialityRepository } from '../interfaces/ISpecialityRepository';
import { ITeleconsultationRepository } from '../interfaces/ITeleconsultationRepository';
import { ITransactionRepository } from '../interfaces/ITransactionRepository';
import { IUserRepository } from '../interfaces/IUserRepository';
import { IAvailabilityRuleRepository } from '../interfaces/IAvailabilityRuleRepository';

/**
 * Container singleton pour gérer les instances de repositories
 */
class RepositoryContainer {
  private static instance: RepositoryContainer;
  private repositories: Map<string, any> = new Map();

  private constructor() {
    // Initialiser les repositories
    this.initializeRepositories();
  }

  static getInstance(): RepositoryContainer {
    if (!RepositoryContainer.instance) {
      RepositoryContainer.instance = new RepositoryContainer();
    }
    return RepositoryContainer.instance;
  }

  private initializeRepositories() {
    // Enregistrer les repositories
    this.repositories.set('user', new MongoUserRepository());
    this.repositories.set('transaction', new MongoTransactionRepository());
    this.repositories.set('booking', new MongoBookingRepository());
    this.repositories.set('invoice', new MongoInvoiceRepository());
    this.repositories.set('speciality', new MongoSpecialityRepository());
    this.repositories.set('quote', new MongoQuoteRepository());
    this.repositories.set('complaint', new MongoComplaintRepository());
    this.repositories.set(
      'teleconsultation',
      new MongoTeleconsultationRepository(),
    );
    this.repositories.set('prescription', new MongoPrescriptionRepository());
    this.repositories.set(
      'healthProvider',
      new MongoHealthProviderRepository(),
    );
    // Repositories de messagerie
    this.repositories.set('conversation', new MongoConversationRepository());
    this.repositories.set('message', new MongoMessageRepository());
    this.repositories.set('supportTicket', new MongoSupportTicketRepository());
    this.repositories.set('attachment', new MongoAttachmentRepository());
    // Repositories de notifications
    this.repositories.set('notification', new MongoNotificationRepository());
    this.repositories.set(
      'notificationTemplate',
      new MongoNotificationTemplateRepository(),
    );
    // Repositories utilisateur
    this.repositories.set('beneficiary', new MongoBeneficiaryRepository());
    this.repositories.set('kyc', new MongoKYCRepository());
    this.repositories.set('availabilityRule', new MongoAvailabilityRuleRepository());
    // Repository audit
    this.repositories.set('auditLog', new MongoAuditLogRepository());
  }

  /**
   * Obtenir un repository par son nom
   */
  get<T>(name: string): T {
    const repository = this.repositories.get(name);
    if (!repository) {
      throw new Error(`Repository ${name} not found`);
    }
    return repository as T;
  }

  /**
   * Enregistrer un repository personnalisé (utile pour les tests)
   */
  register(name: string, repository: any): void {
    this.repositories.set(name, repository);
  }

  /**
   * Obtenir le repository utilisateur
   */
  getUserRepository(): IUserRepository {
    return this.get<IUserRepository>('user');
  }

  /**
   * Obtenir le repository transaction
   */
  getTransactionRepository(): ITransactionRepository {
    return this.get<ITransactionRepository>('transaction');
  }

  /**
   * Obtenir le repository booking
   */
  getBookingRepository(): IBookingRepository {
    return this.get<IBookingRepository>('booking');
  }

  /**
   * Obtenir le repository invoice
   */
  getInvoiceRepository(): IInvoiceRepository {
    return this.get<IInvoiceRepository>('invoice');
  }

  /**
   * Obtenir le repository conversation
   */
  getConversationRepository(): IConversationRepository {
    return this.get<IConversationRepository>('conversation');
  }

  /**
   * Obtenir le repository message
   */
  getMessageRepository(): IMessageRepository {
    return this.get<IMessageRepository>('message');
  }

  /**
   * Obtenir le repository support ticket
   */
  getSupportTicketRepository(): ISupportTicketRepository {
    return this.get<ISupportTicketRepository>('supportTicket');
  }

  /**
   * Obtenir le repository attachment
   */
  getAttachmentRepository(): IAttachmentRepository {
    return this.get<IAttachmentRepository>('attachment');
  }

  /**
   * Obtenir le repository speciality
   */
  getSpecialityRepository(): ISpecialityRepository {
    return this.get<ISpecialityRepository>('speciality');
  }

  /**
   * Obtenir le repository quote
   */
  getQuoteRepository(): IQuoteRepository {
    return this.get<IQuoteRepository>('quote');
  }

  /**
   * Obtenir le repository complaint
   */
  getComplaintRepository(): IComplaintRepository {
    return this.get<IComplaintRepository>('complaint');
  }

  /**
   * Obtenir le repository teleconsultation
   */
  getTeleconsultationRepository(): ITeleconsultationRepository {
    return this.get<ITeleconsultationRepository>('teleconsultation');
  }

  /**
   * Obtenir le repository prescription
   */
  getPrescriptionRepository(): IPrescriptionRepository {
    return this.get<IPrescriptionRepository>('prescription');
  }

  /**
   * Obtenir le repository health provider
   */
  getHealthProviderRepository(): IHealthProviderRepository {
    return this.get<IHealthProviderRepository>('healthProvider');
  }

  /**
   * Obtenir le repository notification
   */
  getNotificationRepository(): INotificationRepository {
    return this.get<INotificationRepository>('notification');
  }

  /**
   * Obtenir le repository notification template
   */
  getNotificationTemplateRepository(): INotificationTemplateRepository {
    return this.get<INotificationTemplateRepository>('notificationTemplate');
  }

  /**
   * Obtenir le repository beneficiary
   */
  getBeneficiaryRepository(): IBeneficiaryRepository {
    return this.get<IBeneficiaryRepository>('beneficiary');
  }

  /**
   * Obtenir le repository KYC
   */
  getKYCRepository(): IKYCRepository {
    return this.get<IKYCRepository>('kyc');
  }

  /**
   * Obtenir le repository availability rule
   */
  getAvailabilityRuleRepository(): IAvailabilityRuleRepository {
    return this.get<IAvailabilityRuleRepository>('availabilityRule');
  }

  /**
   * Obtenir le repository audit log
   */
  getAuditLogRepository(): IAuditLogRepository {
    return this.get<IAuditLogRepository>('auditLog');
  }

  getPCIAuditLogRepository(): IPCIAuditLogRepository {
    return this.get<IPCIAuditLogRepository>('pciAuditLog');
  }

  getGDPRConsentRepository(): IGDPRConsentRepository {
    return this.get<IGDPRConsentRepository>('gdprConsent');
  }

  getDataProcessingRecordRepository(): IDataProcessingRecordRepository {
    return this.get<IDataProcessingRecordRepository>('dataProcessingRecord');
  }

  getDataSubjectRequestRepository(): IDataSubjectRequestRepository {
    return this.get<IDataSubjectRequestRepository>('dataSubjectRequest');
  }
}

// Export singleton instance
export const repositoryContainer = RepositoryContainer.getInstance();

// Export des helpers pour faciliter l'utilisation
export const getUserRepository = () => repositoryContainer.getUserRepository();
export const getTransactionRepository = () =>
  repositoryContainer.getTransactionRepository();
export const getBookingRepository = () =>
  repositoryContainer.getBookingRepository();
export const getInvoiceRepository = () =>
  repositoryContainer.getInvoiceRepository();
// Helpers pour les repositories de messagerie
export const getConversationRepository = () =>
  repositoryContainer.getConversationRepository();
export const getMessageRepository = () =>
  repositoryContainer.getMessageRepository();
export const getSupportTicketRepository = () =>
  repositoryContainer.getSupportTicketRepository();
export const getAttachmentRepository = () =>
  repositoryContainer.getAttachmentRepository();
export const getSpecialityRepository = () =>
  repositoryContainer.getSpecialityRepository();
export const getQuoteRepository = () =>
  repositoryContainer.getQuoteRepository();
export const getComplaintRepository = () =>
  repositoryContainer.getComplaintRepository();
export const getTeleconsultationRepository = () =>
  repositoryContainer.getTeleconsultationRepository();
export const getPrescriptionRepository = () =>
  repositoryContainer.getPrescriptionRepository();
export const getHealthProviderRepository = () =>
  repositoryContainer.getHealthProviderRepository();
export const getNotificationRepository = () =>
  repositoryContainer.getNotificationRepository();
export const getNotificationTemplateRepository = () =>
  repositoryContainer.getNotificationTemplateRepository();
export const getBeneficiaryRepository = () =>
  repositoryContainer.getBeneficiaryRepository();
export const getKYCRepository = () => repositoryContainer.getKYCRepository();
export const getAuditLogRepository = () =>
  repositoryContainer.getAuditLogRepository();
export const getPCIAuditLogRepository = () =>
  repositoryContainer.getPCIAuditLogRepository();

export const getGDPRConsentRepository = () =>
  repositoryContainer.getGDPRConsentRepository();

export const getDataProcessingRecordRepository = () =>
  repositoryContainer.getDataProcessingRecordRepository();

export const getDataSubjectRequestRepository = () =>
  repositoryContainer.getDataSubjectRequestRepository();

export const getAvailabilityRuleRepository = () =>
  repositoryContainer.getAvailabilityRuleRepository();