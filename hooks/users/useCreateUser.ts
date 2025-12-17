'use client';

/**
 * Custom Hook pour créer un utilisateur
 * Implémente le Custom Hooks Pattern
 * Utilise les API routes au lieu d'importer directement les services (évite les imports MongoDB côté client)
 */

import { logger } from '@/lib/logger';
import { useCallback, useState } from 'react';
import { ProviderType, ProviderCategory, User } from '@/lib/types';

export interface CreateUserFormData {
  email: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  password?: string;
  phone?: string;
  company?: string;
  address?: string;
  roles: string[];
  status: string;
  specialty?: string;
  recommended?: boolean;
  clientNotes?: string;
  avatar?: string;
  preferences?: {
    language?: string;
    timezone?: string;
    notifications?: boolean;
  };
  providerInfo?: {
    type: ProviderType;
    category: ProviderCategory;
    specialties?: string[];
    recommended?: boolean;
    individual?: {
      firstName: string;
      lastName: string;
      rcs?: string;
      tva?: string;
      siret?: string;
      siren?: string;
    };
    institution?: {
      legalName: string;
      registrationNumber?: string;
      taxId?: string;
      rcs?: string;
      siret?: string;
      siren?: string;
    };
    professionalAddress: {
      street: string;
      city: string;
      country: string;
      postalCode: string;
    };
  };
}

export interface CreateUserResult {
  success: boolean;
  user?: User | Partial<User>;
  error?: string;
}

/**
 * Custom Hook pour gérer la création d'un utilisateur
 * Implémente le Custom Hooks Pattern
 */
export function useCreateUser() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createUser = useCallback(
    async (data: CreateUserFormData): Promise<CreateUserResult> => {
      setLoading(true);
      setError(null);

      try {
        logger.info(
          {
            email: data.email,
            roles: data.roles,
            status: data.status,
          },
          'Creating user via useCreateUser',
        );

        const response = await fetch('/api/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: data.email,
            firstName: data.firstName || data.name?.split(' ')[0] || '',
            lastName: data.lastName || data.name?.split(' ').slice(1).join(' ') || '',
            phone: data.phone,
            company: data.company,
            address: data.address,
            roles: data.roles,
            status: data.status,
            specialty: data.specialty,
            preferences: data.preferences,
            // Autres champs optionnels
            ...(data.recommended !== undefined && { recommended: data.recommended }),
            ...(data.clientNotes && { clientNotes: data.clientNotes }),
            ...(data.providerInfo && { providerInfo: data.providerInfo }),
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMessage =
            errorData.error ||
            errorData.message ||
            "Erreur lors de la création de l'utilisateur";
          
          // Préserver le code d'erreur pour les duplications (409)
          const error = new Error(errorMessage);
          if (response.status === 409) {
            (error as Error & { code?: string }).code = errorData.code || 'DUPLICATE_EMAIL';
          }
          
          logger.error(
            { error: errorData, status: response.status },
            'API Error during user creation',
          );
          throw error;
        }

        let result;
        try {
          result = await response.json();
        } catch (jsonError) {
          // Si la réponse n'est pas du JSON valide, mais que le status est OK, 
          // considérer que c'est un succès (l'utilisateur a peut-être été créé)
          if (response.ok) {
            logger.warn({ jsonError }, 'Failed to parse JSON response but status is OK');
            return {
              success: true,
              user: { email: data.email },
            };
          }
          throw new Error('Erreur lors de la lecture de la réponse du serveur');
        }

        if (!result.success) {
          const errorMessage = result.error || 'Erreur inconnue';
          logger.error({ error: result }, 'User creation failed');
          throw new Error(errorMessage);
        }

        // Vérifier que result.data existe
        if (!result.data) {
          logger.warn({ result }, 'Response success but no data returned');
          // Si l'email est fourni, considérer que c'est un succès partiel
          return {
            success: true,
            user: { email: data.email },
          };
        }

        logger.info(
          {
            userId: result.data?.id || result.data?._id,
            email: result.data?.email,
          },
          'User created successfully via useCreateUser',
        );

        return {
          success: true,
          user: result.data,
        };
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error ? err.message : 'Erreur inconnue';
        logger.error(
          {
            error: err,
            email: data.email,
            roles: data.roles,
          },
          'Error creating user via useCreateUser',
        );
        setError(errorMessage);
        return {
          success: false,
          error: errorMessage,
        };
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return {
    createUser,
    loading,
    error,
  };
}

