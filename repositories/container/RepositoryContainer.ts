/**
 * Container de dépendances pour les repositories
 * Implémente le pattern Dependency Injection
 */

import { MongoBookingRepository } from '../implementations/MongoBookingRepository';
import { MongoInvoiceRepository } from '../implementations/MongoInvoiceRepository';
import { MongoTransactionRepository } from '../implementations/MongoTransactionRepository';
import { MongoUserRepository } from '../implementations/MongoUserRepository';
import { IBookingRepository } from '../interfaces/IBookingRepository';
import { IInvoiceRepository } from '../interfaces/IInvoiceRepository';
import { ITransactionRepository } from '../interfaces/ITransactionRepository';
import { IUserRepository } from '../interfaces/IUserRepository';

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
}

// Export singleton instance
export const repositoryContainer = RepositoryContainer.getInstance();

// Export des helpers pour faciliter l'utilisation
export const getUserRepository = () => repositoryContainer.getUserRepository();
export const getTransactionRepository = () => repositoryContainer.getTransactionRepository();
export const getBookingRepository = () => repositoryContainer.getBookingRepository();
export const getInvoiceRepository = () => repositoryContainer.getInvoiceRepository();

