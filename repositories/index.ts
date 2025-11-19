/**
 * Point d'entrée principal pour les repositories
 * Exporte toutes les interfaces et implémentations
 */

// Interfaces
export * from './interfaces/IAuditLogRepository';
export * from './interfaces/IBeneficiaryRepository';
export * from './interfaces/IBookingRepository';
export * from './interfaces/IComplaintRepository';
export * from './interfaces/IHealthProviderRepository';
export * from './interfaces/IInvoiceRepository';
export * from './interfaces/IKYCRepository';
export * from './interfaces/INotificationRepository';
export * from './interfaces/INotificationTemplateRepository';
export * from './interfaces/IPrescriptionRepository';
export * from './interfaces/IQuoteRepository';
export * from './interfaces/IRepository';
export * from './interfaces/ISpecialityRepository';
export * from './interfaces/ITeleconsultationRepository';
export * from './interfaces/ITransactionRepository';
export * from './interfaces/IUserRepository';
export * from './interfaces/IAvailabilityRuleRepository';

// Implémentations
export { MongoAuditLogRepository } from './implementations/MongoAuditLogRepository';
export { MongoBeneficiaryRepository } from './implementations/MongoBeneficiaryRepository';
export { MongoBookingRepository } from './implementations/MongoBookingRepository';
export { MongoComplaintRepository } from './implementations/MongoComplaintRepository';
export { MongoDataProcessingRecordRepository } from './implementations/MongoDataProcessingRecordRepository';
export { MongoDataSubjectRequestRepository } from './implementations/MongoDataSubjectRequestRepository';
export { MongoGDPRConsentRepository } from './implementations/MongoGDPRConsentRepository';
export { MongoHealthProviderRepository } from './implementations/MongoHealthProviderRepository';
export { MongoInvoiceRepository } from './implementations/MongoInvoiceRepository';
export { MongoKYCRepository } from './implementations/MongoKYCRepository';
export { MongoNotificationRepository } from './implementations/MongoNotificationRepository';
export { MongoNotificationTemplateRepository } from './implementations/MongoNotificationTemplateRepository';
export { MongoPCIAuditLogRepository } from './implementations/MongoPCIAuditLogRepository';
export { MongoPrescriptionRepository } from './implementations/MongoPrescriptionRepository';
export { MongoQuoteRepository } from './implementations/MongoQuoteRepository';
export { MongoSpecialityRepository } from './implementations/MongoSpecialityRepository';
export { MongoTeleconsultationRepository } from './implementations/MongoTeleconsultationRepository';
export { MongoTransactionRepository } from './implementations/MongoTransactionRepository';
export { MongoUserRepository } from './implementations/MongoUserRepository';
export { MongoAvailabilityRuleRepository } from './implementations/MongoAvailabilityRuleRepository';

// Container
export {
  getAttachmentRepository,
  getAuditLogRepository,
  getBeneficiaryRepository,
  getBookingRepository,
  getComplaintRepository,
  getConversationRepository,
  getDataProcessingRecordRepository,
  getDataSubjectRequestRepository,
  getGDPRConsentRepository,
  getHealthProviderRepository,
  getInvoiceRepository,
  getKYCRepository,
  getMessageRepository,
  getNotificationRepository,
  getNotificationTemplateRepository,
  getPCIAuditLogRepository,
  getPrescriptionRepository,
  getQuoteRepository,
  getSpecialityRepository,
  getSupportTicketRepository,
  getTeleconsultationRepository,
  getTransactionRepository,
  getUserRepository,
  getAvailabilityRuleRepository,
  repositoryContainer,
} from './container/RepositoryContainer';
