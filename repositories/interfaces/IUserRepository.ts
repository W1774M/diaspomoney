/**
 * Interface du repository pour les utilisateurs
 */

import { IPaginatedRepository, PaginatedResult, PaginationOptions } from './IRepository';

export interface User {
  _id?: string;
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  name?: string;
  phone?: string;
  country?: string;
  roles?: string[];
  status?: string;
  isActive?: boolean;
  isEmailVerified?: boolean;
  kycStatus?: string;
  createdAt?: Date;
  updatedAt?: Date;
  password?: string;
  [key: string]: any;
}

export interface UserFilters {
  role?: string;
  roles?: string[];
  status?: string;
  email?: string;
  country?: string;
  isActive?: boolean;
  isEmailVerified?: boolean;
  kycStatus?: string;
  specialty?: string;
  city?: string;
  [key: string]: any;
}

export interface IUserRepository extends IPaginatedRepository<User, string> {
  /**
   * Trouver un utilisateur par email
   */
  findByEmail(email: string): Promise<User | null>;

  /**
   * Trouver des utilisateurs par rôle
   */
  findByRole(role: string): Promise<User[]>;

  /**
   * Trouver des utilisateurs par statut
   */
  findByStatus(status: string): Promise<User[]>;

  /**
   * Mettre à jour le mot de passe
   */
  updatePassword(userId: string, hashedPassword: string): Promise<boolean>;

  /**
   * Vérifier l'email
   */
  verifyEmail(userId: string): Promise<boolean>;

  /**
   * Mettre à jour le statut KYC
   */
  updateKYCStatus(userId: string, status: string): Promise<boolean>;

  /**
   * Trouver des utilisateurs avec pagination et filtres avancés
   */
  findUsersWithFilters(
    filters: UserFilters,
    options?: PaginationOptions
  ): Promise<PaginatedResult<User>>;
}

