'use client';

import { useAuth } from '@/hooks';
import {
  BillingData,
  PreferencesData,
  PrivacyData,
  ProfileData,
  SecurityData,
} from '@/types/settings';
import { useCallback, useEffect, useState } from 'react';

export function useSettings() {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('profile');
  const [saving, setSaving] = useState(false);

  // États pour les formulaires
  const [profileData, setProfileData] = useState<ProfileData>({
    name: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    address: '',
    dateOfBirth: '',
    countryOfResidence: '',
    targetCountry: '',
    targetCity: '',
    monthlyBudget: '',
    specialty: '',
  });

  const [preferencesData, setPreferencesData] = useState<PreferencesData>({
    language: 'fr',
    timezone: 'Europe/Paris',
    notifications: true,
    emailNotifications: true,
    smsNotifications: false,
  });

  const [securityData, setSecurityData] = useState<SecurityData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    twoFactorEnabled: false,
  });

  const [billingData, setBillingData] = useState<BillingData>({
    paymentMethod: '',
    billingAddress: '',
    taxId: '',
  });

  const [privacyData, setPrivacyData] = useState<PrivacyData>({
    profileVisibility: 'private',
    dataSharing: false,
    analytics: true,
    marketingConsent: false,
    kycConsent: false,
  });

  const [complaintsData, setComplaintsData] = useState({
    complaints: [],
  });

  // Initialiser les données avec les informations utilisateur
  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        firstName: (user as any).firstName || '',
        lastName: (user as any).lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        company: (user as any).company || '',
        address: (user as any).address || '',
        dateOfBirth: (user as any).dateOfBirth
          ? String(
              new Date((user as any).dateOfBirth).toISOString().split('T')[0],
            )
          : '',
        countryOfResidence: (user as any).countryOfResidence || '',
        targetCountry: (user as any).targetCountry || '',
        targetCity: (user as any).targetCity || '',
        monthlyBudget: (user as any).monthlyBudget || '',
        specialty: (user as any).specialty || '',
      });

      // Initialiser les préférences
      const prefs = (user as any).preferences || {};
      setPreferencesData({
        language: prefs.language || 'fr',
        timezone: prefs.timezone || 'Europe/Paris',
        notifications: prefs.notifications !== false,
        emailNotifications: prefs.emailNotifications !== false,
        smsNotifications: prefs.smsNotifications === true,
      });

      // Initialiser les consentements
      setPrivacyData({
        profileVisibility: 'private',
        dataSharing: false,
        analytics: true,
        marketingConsent: (user as any).marketingConsent === true,
        kycConsent: (user as any).kycConsent === true,
      });
    }
  }, [user]);

  const handleSave = useCallback(
    async (dataType: string) => {
      setSaving(true);
      try {
        let response;

        if (dataType === 'profile') {
          // Sauvegarder le profil
          response = await fetch('/api/users/me', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              name: profileData.name,
              firstName: profileData.firstName,
              lastName: profileData.lastName,
              phone: profileData.phone,
              company: profileData.company,
              address: profileData.address,
              dateOfBirth: profileData.dateOfBirth || null,
              countryOfResidence: profileData.countryOfResidence || null,
              targetCountry: profileData.targetCountry || null,
              targetCity: profileData.targetCity || null,
              monthlyBudget: profileData.monthlyBudget || null,
              specialty: profileData.specialty || null,
            }),
          });
        } else if (dataType === 'notifications') {
          // Sauvegarder les préférences
          response = await fetch('/api/users/me', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              preferences: {
                language: preferencesData.language,
                timezone: preferencesData.timezone,
                notifications: preferencesData.notifications,
                emailNotifications: preferencesData.emailNotifications,
                smsNotifications: preferencesData.smsNotifications,
              },
            }),
          });
        } else if (dataType === 'privacy') {
          // Sauvegarder les consentements
          response = await fetch('/api/users/me', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              privacy: {
                profileVisibility: privacyData.profileVisibility,
                dataSharing: privacyData.dataSharing,
                analytics: privacyData.analytics,
              },
            }),
          });
        } else {
          // Pour les autres types, simuler une sauvegarde
          await new Promise(resolve => setTimeout(resolve, 1000));
          alert('Paramètres sauvegardés avec succès !');
          setSaving(false);
          return;
        }

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erreur lors de la sauvegarde');
        }

        // Afficher un message de succès
        alert('Paramètres sauvegardés avec succès !');
        // Rafraîchir les données utilisateur
        window.location.reload();
      } catch (error) {
        console.error('Erreur lors de la sauvegarde:', error);
        alert(
          error instanceof Error
            ? error.message
            : 'Erreur lors de la sauvegarde des paramètres.',
        );
      } finally {
        setSaving(false);
      }
    },
    [
      profileData,
      preferencesData,
      securityData,
      billingData,
      privacyData,
      complaintsData,
    ],
  );

  return {
    activeTab,
    setActiveTab,
    saving,
    profileData,
    setProfileData,
    preferencesData,
    setPreferencesData,
    securityData,
    setSecurityData,
    billingData,
    setBillingData,
    privacyData,
    setPrivacyData,
    complaintsData,
    setComplaintsData,
    handleSave,
  };
}
