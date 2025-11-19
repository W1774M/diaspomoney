'use client';

/**
 * Custom Hook pour les préférences de notifications
 * Implémente le Custom Hooks Pattern
 */

import { PreferencesData } from '@/lib/types';
import { LANGUAGES, TIMEZONES } from '@/lib/constants';
import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../auth/useAuth';

export interface UseNotificationPreferencesReturn {
  preferences: PreferencesData;
  loading: boolean;
  saving: boolean;
  error: string | null;
  setPreferences: React.Dispatch<React.SetStateAction<PreferencesData>>;
  updatePreferences: (preferences: Partial<PreferencesData>) => Promise<void>;
}

/**
 * Custom Hook pour gérer les préférences de notifications
 * Implémente le Custom Hooks Pattern
 */
export function useNotificationPreferences(): UseNotificationPreferencesReturn {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<PreferencesData>({
    language: LANGUAGES.FR.code,
    timezone: TIMEZONES.PARIS,
    notifications: true,
    emailNotifications: true,
    smsNotifications: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      // Charger les préférences depuis l'utilisateur
      // Les préférences sont stockées dans user.preferences
      const userPreferences = (user as any).preferences;
      if (userPreferences) {
        setPreferences({
          language: userPreferences.language || LANGUAGES.FR.code,
          timezone: userPreferences.timezone || TIMEZONES.PARIS,
          notifications: userPreferences.notifications !== false,
          emailNotifications: userPreferences.emailNotifications !== false,
          smsNotifications: userPreferences.smsNotifications === true,
        });
      }
      setLoading(false);
    }
  }, [user]);

  const updatePreferences = useCallback(
    async (newPreferences: Partial<PreferencesData>) => {
      setSaving(true);
      setError(null);

      try {
        const response = await fetch('/api/users/me', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            preferences: {
              ...preferences,
              ...newPreferences,
            },
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erreur lors de la sauvegarde');
        }

        const data = await response.json();
        if (data.success) {
          setPreferences(prev => ({ ...prev, ...newPreferences }));
        } else {
          throw new Error(data.error || 'Erreur inconnue');
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Erreur inconnue';
        setError(errorMessage);
        // Le logging est fait côté serveur via les services avec @Log decorator
        throw error;
      } finally {
        setSaving(false);
      }
    },
    [preferences],
  );

  return {
    preferences,
    loading,
    saving,
    error,
    setPreferences,
    updatePreferences,
  };
}
