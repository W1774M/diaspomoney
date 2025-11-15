/**
 * Point d'entrée principal pour les repositories
 * Exporte toutes les interfaces et implémentations
 */

// Interfaces
export * from './interfaces/IBookingRepository';
export * from './interfaces/IInvoiceRepository';
export * from './interfaces/IRepository';
export * from './interfaces/ITransactionRepository';
export * from './interfaces/IUserRepository';

// Implémentations
export { MongoBookingRepository } from './implementations/MongoBookingRepository';
export { MongoInvoiceRepository } from './implementations/MongoInvoiceRepository';
export { MongoTransactionRepository } from './implementations/MongoTransactionRepository';
export { MongoUserRepository } from './implementations/MongoUserRepository';

// Container
export {
  getBookingRepository,
  getInvoiceRepository, getTransactionRepository, getUserRepository, repositoryContainer
} from './container/RepositoryContainer';

