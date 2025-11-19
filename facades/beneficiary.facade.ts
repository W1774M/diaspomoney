/**
 * Beneficiary Facade - DiaspoMoney
 *
 * Facade Pattern pour simplifier le processus de gestion des bénéficiaires complet
 * Orchestre UserService, BeneficiaryRepository et NotificationService
 */

import { Log } from '@/lib/decorators/log.decorator';
import { Validate } from '@/lib/decorators/validate.decorator';
import { logger } from '@/lib/logger';
import { LANGUAGES } from '@/lib/constants';
import { getBeneficiaryRepository } from '@/repositories';
import { userService } from '@/services/user/user.service';
import { notificationService } from '@/services/notification/notification.service';
import type {
  Beneficiary,
  BeneficiaryData,
  BeneficiaryRelationship,
} from '@/lib/types';
import {
  CreateBeneficiarySchema,
  UpdateBeneficiarySchema,
} from '@/lib/validations/beneficiary.schema';
import * as Sentry from '@sentry/nextjs';

export interface BeneficiaryFacadeData extends BeneficiaryData {
  sendNotification?: boolean; // Envoyer une notification
  sendEmail?: boolean; // Envoyer un email de confirmation
}

export interface BeneficiaryFacadeResult {
  success: boolean;
  beneficiary?: Beneficiary;
  notificationSent?: boolean;
  emailSent?: boolean;
  error?: string;
}

export interface UpdateBeneficiaryFacadeData {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  relationship?: BeneficiaryRelationship;
  country?: string;
  address?: string;
}

/**
 * BeneficiaryFacade - Facade pour le processus de gestion des bénéficiaires complet
 */
export class BeneficiaryFacade {
  private static instance: BeneficiaryFacade;
  private beneficiaryRepository = getBeneficiaryRepository();

  private constructor() {}

  static getInstance(): BeneficiaryFacade {
    if (!BeneficiaryFacade.instance) {
      BeneficiaryFacade.instance = new BeneficiaryFacade();
    }
    return BeneficiaryFacade.instance;
  }

  /**
   * Créer un bénéficiaire complet avec orchestration
   *
   * Étapes :
   * 1. Créer le bénéficiaire via UserService
   * 2. Envoyer une notification (si demandé)
   * 3. Envoyer un email de confirmation (si demandé)
   */
  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @Validate({
    rules: [
      {
        paramIndex: 1,
        schema: CreateBeneficiarySchema,
        paramName: 'data',
      },
    ],
  })
  async createBeneficiary(
    userId: string,
    data: BeneficiaryFacadeData,
  ): Promise<BeneficiaryFacadeResult> {
    try {
      logger.info(
        {
          userId,
          firstName: data.firstName,
          lastName: data.lastName,
          relationship: data.relationship,
          sendNotification: data.sendNotification,
          sendEmail: data.sendEmail,
        },
        'Creating beneficiary via BeneficiaryFacade',
      );

      // Étape 1: Créer le bénéficiaire via UserService
      const beneficiary = await userService.addBeneficiary(userId, {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email || '',
        phone: data.phone || '',
        relationship: data.relationship,
        country: data.country,
        address: data.address || '',
      });

      const beneficiaryId = beneficiary.id || (beneficiary as any)._id?.toString() || '';

      let notificationSent = false;
      let emailSent = false;

      // Étape 2: Envoyer une notification si demandé
      if (data.sendNotification !== false) {
        try {
          await notificationService.sendNotification({
            recipient: userId,
            type: 'BENEFICIARY_CREATED',
            template: 'beneficiary_created',
            data: {
              beneficiaryName: `${data.firstName} ${data.lastName}`,
              relationship: data.relationship,
            },
            channels: [
              { type: 'IN_APP', enabled: true, priority: 'MEDIUM' },
              { type: 'EMAIL', enabled: true, priority: 'LOW' },
            ],
            locale: LANGUAGES.FR.code,
            priority: 'MEDIUM',
          });

          notificationSent = true;
        } catch (notificationError) {
          // Ne pas faire échouer la création si la notification échoue
          logger.error(
            { error: notificationError, beneficiaryId },
            'Failed to send notification, continuing...',
          );
        }
      }

      // Étape 3: Envoyer un email de confirmation si demandé
      if (data.sendEmail !== false && data.email) {
        try {
          const { emailService } = await import('@/services/email/email.service');
          const emailResult = await emailService.sendCustomEmail(
            data.email,
            `Bénéficiaire ${data.firstName} ${data.lastName} ajouté`,
            this.generateBeneficiaryEmailHTML(beneficiary, data),
            this.generateBeneficiaryEmailText(beneficiary, data),
          );

          emailSent = emailResult;
        } catch (emailError) {
          // Ne pas faire échouer la création si l'email échoue
          logger.error(
            { error: emailError, beneficiaryId },
            'Failed to send beneficiary email, continuing...',
          );
        }
      }

      logger.info(
        {
          beneficiaryId,
          notificationSent,
          emailSent,
        },
        'Beneficiary created successfully via BeneficiaryFacade',
      );

      return {
        success: true,
        beneficiary,
        notificationSent,
        emailSent,
      };
    } catch (error: any) {
      logger.error(
        {
          error,
          data: {
            userId,
            firstName: data.firstName,
            lastName: data.lastName,
          },
        },
        'Error creating beneficiary via BeneficiaryFacade',
      );

      Sentry.captureException(error, {
        extra: {
          beneficiaryData: {
            userId,
            firstName: data.firstName,
            lastName: data.lastName,
            relationship: data.relationship,
          },
        },
      });

      return {
        success: false,
        error: error.message || 'Erreur lors de la création du bénéficiaire',
      };
    }
  }

  /**
   * Mettre à jour un bénéficiaire
   */
  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @Validate({
    rules: [
      {
        paramIndex: 2,
        schema: UpdateBeneficiarySchema,
        paramName: 'data',
      },
    ],
  })
  async updateBeneficiary(
    userId: string,
    beneficiaryId: string,
    data: UpdateBeneficiaryFacadeData,
  ): Promise<BeneficiaryFacadeResult> {
    try {
      logger.info(
        {
          userId,
          beneficiaryId,
          updateFields: Object.keys(data),
        },
        'Updating beneficiary via BeneficiaryFacade',
      );

      // Vérifier que le bénéficiaire appartient à l'utilisateur
      const existingBeneficiary = await this.beneficiaryRepository.findById(
        beneficiaryId,
      );

      if (!existingBeneficiary) {
        return {
          success: false,
          error: 'Bénéficiaire non trouvé',
        };
      }

      if (existingBeneficiary.payerId !== userId) {
        return {
          success: false,
          error: "Ce bénéficiaire n'appartient pas à cet utilisateur",
        };
      }

      // Vérifier l'unicité de l'email si fourni
      if (data.email && data.email !== existingBeneficiary.email) {
        const beneficiaries = await this.beneficiaryRepository.findByPayer(userId);
        const duplicate = beneficiaries.data.find(
          b => b.email === data.email && b.id !== beneficiaryId,
        );

        if (duplicate) {
          return {
            success: false,
            error: 'Un autre bénéficiaire avec cet email existe déjà',
          };
        }
      }

      // Préparer les données de mise à jour
      const updateData: Partial<Beneficiary> = {
        updatedAt: new Date(),
      };

      if (data.firstName !== undefined) updateData.firstName = data.firstName;
      if (data.lastName !== undefined) updateData.lastName = data.lastName;
      if (data.email !== undefined) updateData.email = data.email || '';
      if (data.phone !== undefined) updateData.phone = data.phone;
      if (data.relationship !== undefined)
        updateData.relationship = data.relationship;
      if (data.country !== undefined) updateData.country = data.country;
      if (data.address !== undefined) updateData.address = data.address;

      // Mettre à jour via le repository
      const updatedBeneficiary = await this.beneficiaryRepository.update(
        beneficiaryId,
        updateData,
      );

      if (!updatedBeneficiary) {
        return {
          success: false,
          error: 'Erreur lors de la mise à jour du bénéficiaire',
        };
      }

      logger.info(
        {
          beneficiaryId,
        },
        'Beneficiary updated successfully via BeneficiaryFacade',
      );

      return {
        success: true,
        beneficiary: updatedBeneficiary,
      };
    } catch (error: any) {
      logger.error(
        {
          error,
          userId,
          beneficiaryId,
        },
        'Error updating beneficiary via BeneficiaryFacade',
      );

      Sentry.captureException(error, {
        extra: {
          beneficiaryId,
          updateData: data,
        },
      });

      return {
        success: false,
        error: error.message || 'Erreur lors de la mise à jour du bénéficiaire',
      };
    }
  }

  /**
   * Supprimer un bénéficiaire
   */
  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  async deleteBeneficiary(
    userId: string,
    beneficiaryId: string,
  ): Promise<BeneficiaryFacadeResult> {
    try {
      logger.info(
        {
          userId,
          beneficiaryId,
        },
        'Deleting beneficiary via BeneficiaryFacade',
      );

      // Utiliser UserService pour supprimer (désactiver) le bénéficiaire
      await userService.removeBeneficiary(userId, beneficiaryId);

      logger.info(
        {
          beneficiaryId,
        },
        'Beneficiary deleted successfully via BeneficiaryFacade',
      );

      return {
        success: true,
      };
    } catch (error: any) {
      logger.error(
        {
          error,
          userId,
          beneficiaryId,
        },
        'Error deleting beneficiary via BeneficiaryFacade',
      );

      Sentry.captureException(error, {
        extra: {
          beneficiaryId,
        },
      });

      return {
        success: false,
        error: error.message || 'Erreur lors de la suppression du bénéficiaire',
      };
    }
  }

  /**
   * Récupérer tous les bénéficiaires d'un utilisateur
   */
  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  async getBeneficiaries(userId: string): Promise<Beneficiary[]> {
    try {
      return await userService.getBeneficiaries(userId);
    } catch (error: any) {
      logger.error(
        {
          error,
          userId,
        },
        'Error getting beneficiaries via BeneficiaryFacade',
      );

      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Générer le HTML de l'email de bénéficiaire
   */
  private generateBeneficiaryEmailHTML(
    _beneficiary: Beneficiary,
    data: BeneficiaryFacadeData,
  ): string {
    return `
      <html>
        <body>
          <h2>Bénéficiaire ajouté</h2>
          <p>Bonjour,</p>
          <p>Un nouveau bénéficiaire a été ajouté à votre compte.</p>
          <p><strong>Nom :</strong> ${data.firstName} ${data.lastName}</p>
          <p><strong>Relation :</strong> ${data.relationship}</p>
          ${data.email ? `<p><strong>Email :</strong> ${data.email}</p>` : ''}
          ${data.phone ? `<p><strong>Téléphone :</strong> ${data.phone}</p>` : ''}
          <p>Vous pouvez maintenant effectuer des transferts vers ce bénéficiaire.</p>
          <p>Cordialement,<br>L'équipe DiaspoMoney</p>
        </body>
      </html>
    `;
  }

  /**
   * Générer le texte de l'email de bénéficiaire
   */
  private generateBeneficiaryEmailText(
    _beneficiary: Beneficiary,
    data: BeneficiaryFacadeData,
  ): string {
    return `
      Bénéficiaire ajouté
      
      Bonjour,
      
      Un nouveau bénéficiaire a été ajouté à votre compte.
      
      Nom : ${data.firstName} ${data.lastName}
      Relation : ${data.relationship}
      ${data.email ? `Email : ${data.email}` : ''}
      ${data.phone ? `Téléphone : ${data.phone}` : ''}
      
      Vous pouvez maintenant effectuer des transferts vers ce bénéficiaire.
      
      Cordialement,
      L'équipe DiaspoMoney
    `;
  }
}

// Export de l'instance singleton
export const beneficiaryFacade = BeneficiaryFacade.getInstance();

