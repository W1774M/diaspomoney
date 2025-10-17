/**
 * User Service - DiaspoMoney
 * Service de gestion des utilisateurs Company-Grade
 * Basé sur la charte de développement
 */

import User from '@/models/User';
import { securityManager } from '@/lib/security/advanced-security';
import * as Sentry from '@sentry/nextjs';

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  country: string;
  role: string;
  isActive: boolean;
  isEmailVerified: boolean;
  kycStatus: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateProfileData {
  firstName?: string;
  lastName?: string;
  phone?: string;
  country?: string;
}

export interface BeneficiaryData {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  relationship: 'PARENT' | 'CHILD' | 'SPOUSE' | 'SIBLING' | 'FRIEND' | 'OTHER';
  country: string;
  address?: string;
}

export interface Beneficiary extends BeneficiaryData {
  id: string;
  payerId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface KYCDocument {
  type: 'ID_CARD' | 'PASSPORT' | 'DRIVER_LICENSE' | 'UTILITY_BILL' | 'BANK_STATEMENT';
  fileUrl: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  uploadedAt: Date;
  reviewedAt?: Date;
  rejectionReason?: string;
}

export interface KYCData {
  documents: KYCDocument[];
  status: 'PENDING' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED';
  submittedAt: Date;
  reviewedAt?: Date;
  rejectionReason?: string;
}

export class UserService {
  private static instance: UserService;
  
  static getInstance(): UserService {
    if (!UserService.instance) {
      UserService.instance = new UserService();
    }
    return UserService.instance;
  }

  /**
   * Récupérer le profil utilisateur
   */
  async getUserProfile(userId: string): Promise<UserProfile> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('Utilisateur non trouvé');
      }

      return {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        country: user.country,
        role: user.role,
        isActive: user.isActive,
        isEmailVerified: user.isEmailVerified,
        kycStatus: user.kycStatus || 'PENDING',
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      };

    } catch (error) {
      console.error('Erreur getUserProfile:', error);
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Mettre à jour le profil utilisateur
   */
  async updateUserProfile(userId: string, data: UpdateProfileData): Promise<UserProfile> {
    try {
      // Validation des données
      if (data.phone && !this.isValidPhone(data.phone)) {
        throw new Error('Numéro de téléphone invalide');
      }

      if (data.country && !this.isValidCountry(data.country)) {
        throw new Error('Pays invalide');
      }

      // Mise à jour de l'utilisateur
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { 
          ...data,
          updatedAt: new Date()
        },
        { new: true }
      );

      if (!updatedUser) {
        throw new Error('Utilisateur non trouvé');
      }

      // Enregistrer l'événement
      await securityManager.detectAnomalies(userId, 'PROFILE_UPDATED', data);

      return {
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        phone: updatedUser.phone,
        country: updatedUser.country,
        role: updatedUser.role,
        isActive: updatedUser.isActive,
        isEmailVerified: updatedUser.isEmailVerified,
        kycStatus: updatedUser.kycStatus || 'PENDING',
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt
      };

    } catch (error) {
      console.error('Erreur updateUserProfile:', error);
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Supprimer le compte utilisateur (GDPR)
   */
  async deleteUserAccount(userId: string): Promise<void> {
    try {
      // Anonymiser au lieu de supprimer (pour les enregistrements légaux/financiers)
      await User.findByIdAndUpdate(
        userId,
        {
          email: `deleted_${userId}@anonymized.com`,
          phone: null,
          firstName: '[DELETED]',
          lastName: '[DELETED]',
          isActive: false,
          deletedAt: new Date(),
          gdprDeleted: true
        }
      );

      // Supprimer les données non essentielles
      // TODO: Supprimer les documents, notifications, etc.
      
      // Enregistrer l'événement de suppression
      await securityManager.detectAnomalies(userId, 'USER_DELETED');

    } catch (error) {
      console.error('Erreur deleteUserAccount:', error);
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Ajouter un bénéficiaire
   */
  async addBeneficiary(userId: string, data: BeneficiaryData): Promise<Beneficiary> {
    try {
      // Validation des données
      if (!data.firstName || !data.lastName) {
        throw new Error('Prénom et nom requis');
      }

      if (!data.relationship) {
        throw new Error('Relation requise');
      }

      if (!this.isValidCountry(data.country)) {
        throw new Error('Pays invalide');
      }

      // Vérifier la limite de bénéficiaires
      const existingBeneficiaries = await this.getBeneficiaries(userId);
      if (existingBeneficiaries.length >= 10) {
        throw new Error('Limite de bénéficiaires atteinte (10 max)');
      }

      // Créer le bénéficiaire
      const beneficiary = {
        id: `beneficiary_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        payerId: userId,
        ...data,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // TODO: Sauvegarder en base de données
      // await Beneficiary.create(beneficiary);

      return beneficiary;

    } catch (error) {
      console.error('Erreur addBeneficiary:', error);
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Récupérer les bénéficiaires
   */
  async getBeneficiaries(_userId: string): Promise<Beneficiary[]> {
    try {
      // TODO: Récupérer depuis la base de données
      // const beneficiaries = await Beneficiary.find({ payerId: userId, isActive: true });
      
      // Simulation pour l'instant
      return [];

    } catch (error) {
      console.error('Erreur getBeneficiaries:', error);
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Supprimer un bénéficiaire
   */
  async removeBeneficiary(_userId: string, _beneficiaryId: string): Promise<void> {
    try {
      // TODO: Vérifier que le bénéficiaire appartient à l'utilisateur
      // TODO: Désactiver le bénéficiaire
      // await Beneficiary.updateOne(
      //   { id: beneficiaryId, payerId: userId },
      //   { isActive: false, updatedAt: new Date() }
      // );

    } catch (error) {
      console.error('Erreur removeBeneficiary:', error);
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Soumettre les documents KYC
   */
  async submitKYCDocuments(userId: string, documents: KYCDocument[]): Promise<KYCData> {
    try {
      // Validation des documents
      if (documents.length === 0) {
        throw new Error('Au moins un document requis');
      }

      // Vérifier les types de documents requis
      const requiredTypes = ['ID_CARD', 'PASSPORT'];
      const submittedTypes = documents.map(doc => doc.type);
      const hasRequiredType = requiredTypes.some(type => submittedTypes.includes(type));

      if (!hasRequiredType) {
        throw new Error('Au moins une pièce d\'identité requise (carte d\'identité ou passeport)');
      }

      // Créer les données KYC
      const kycData: KYCData = {
        documents,
        status: 'PENDING',
        submittedAt: new Date()
      };

      // TODO: Sauvegarder en base de données
      // await KYC.create({ userId, ...kycData });

      // Mettre à jour le statut KYC de l'utilisateur
      await User.findByIdAndUpdate(
        userId,
        { 
          kycStatus: 'IN_REVIEW',
          kycSubmittedAt: new Date()
        }
      );

      return kycData;

    } catch (error) {
      console.error('Erreur submitKYCDocuments:', error);
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Récupérer le statut KYC
   */
  async getKYCStatus(_userId: string): Promise<KYCData | null> {
    try {
      // TODO: Récupérer depuis la base de données
      // const kyc = await KYC.findOne({ userId });
      // return kyc;

      return null;

    } catch (error) {
      console.error('Erreur getKYCStatus:', error);
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Exporter les données utilisateur (GDPR)
   */
  async exportUserData(userId: string): Promise<any> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('Utilisateur non trouvé');
      }

      // TODO: Récupérer toutes les données associées
      // const transactions = await Transaction.find({ userId });
      // const beneficiaries = await Beneficiary.find({ payerId: userId });
      // const kyc = await KYC.findOne({ userId });

      const exportData = {
        personal_info: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          country: user.country,
          role: user.role,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        },
        // transactions: transactions.map(t => t.toJSON()),
        // beneficiaries: beneficiaries.map(b => b.toJSON()),
        // kyc: kyc?.toJSON(),
        exported_at: new Date().toISOString()
      };

      return exportData;

    } catch (error) {
      console.error('Erreur exportUserData:', error);
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Validation du numéro de téléphone
   */
  private isValidPhone(phone: string): boolean {
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(phone);
  }

  /**
   * Validation du pays
   */
  private isValidCountry(country: string): boolean {
    const validCountries = [
      'FR', 'DE', 'ES', 'IT', 'BE', 'NL', 'CH', 'AT', 'LU', 'IE',
      'SN', 'CI', 'CM', 'BF', 'ML', 'NE', 'TD', 'GN', 'LR', 'SL'
    ];
    return validCountries.includes(country.toUpperCase());
  }
}

// Export de l'instance singleton
export const userService = UserService.getInstance();
