'use client';

/**
 * Custom Hook pour créer un utilisateur
 * Implémente le Custom Hooks Pattern
 * Utilise les API routes au lieu d'importer directement les services (évite les imports MongoDB côté client)
 */

import { logger } from '@/lib/logger';
import { useCallback, useState } from 'react';

export interface CreateUserFormData {
  email: string;
  name?: string;
  firstName?: string;
  lastName?: string;
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
}

export interface CreateUserResult {
  success: boolean;
  user?: any;
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
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMessage =
            errorData.error ||
            errorData.message ||
            "Erreur lors de la création de l'utilisateur";
          logger.error(
            { error: errorData, status: response.status },
            'API Error during user creation',
          );
          throw new Error(errorMessage);
        }

        const result = await response.json();

        if (!result.success) {
          const errorMessage = result.error || 'Erreur inconnue';
          logger.error({ error: result }, 'User creation failed');
          throw new Error(errorMessage);
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

