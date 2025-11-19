/**
 * Interface du repository pour les utilisateurs
 */

import {
  IPaginatedRepository,
  PaginatedResult,
  PaginationOptions,
} from './IRepository';

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
   * Créer un utilisateur avec hashage automatique du mot de passe
   * Utilise le modèle User Mongoose pour bénéficier du hook pre('save')
   */
  createWithPassword(
    data: Partial<User> & { password?: string }
  ): Promise<User>;

  /**
   * Mettre à jour le mot de passe
   * @param userId - ID de l'utilisateur
   * @param hashedPassword - Mot de passe déjà hashé
   * @param updatePasswordChangedAt - Si true, met à jour le champ passwordChangedAt (défaut: true)
   */
  updatePassword(
    userId: string,
    hashedPassword: string,
    updatePasswordChangedAt?: boolean
  ): Promise<boolean>;

  /**
   * Vérifier le mot de passe d'un utilisateur
   */
  verifyPassword(userId: string, password: string): Promise<boolean>;

  /**
   * Vérifier l'email
   */
  verifyEmail(userId: string): Promise<boolean>;

  /**
   * Mettre à jour le statut KYC
   */
  updateKYCStatus(userId: string, status: string): Promise<boolean>;

  /**
   * Configurer la 2FA pour un utilisateur
   */
  setup2FA(
    userId: string,
    secret: string,
    backupCodes: string[]
  ): Promise<boolean>;

  /**
   * Activer la 2FA pour un utilisateur
   */
  enable2FA(userId: string): Promise<boolean>;

  /**
   * Désactiver la 2FA pour un utilisateur
   */
  disable2FA(userId: string): Promise<boolean>;

  /**
   * Mettre à jour les codes de backup 2FA
   */
  update2FABackupCodes(userId: string, backupCodes: string[]): Promise<boolean>;

  /**
   * Récupérer les informations 2FA d'un utilisateur
   */
  get2FAInfo(userId: string): Promise<{
    twoFactorSecret?: string;
    twoFactorBackupCodes?: string[];
    twoFactorEnabled?: boolean;
  } | null>;

  /**
   * Trouver des utilisateurs avec pagination et filtres avancés
   */
  findUsersWithFilters(
    filters: UserFilters,
    options?: PaginationOptions
  ): Promise<PaginatedResult<User>>;
}
