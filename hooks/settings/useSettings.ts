"use client";

import { useAuth } from "@/hooks";
import {
  BillingData,
  PreferencesData,
  PrivacyData,
  ProfileData,
  SecurityData,
} from "@/types/settings";
import { useCallback, useEffect, useState } from "react";

export function useSettings() {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState("profile");
  const [saving, setSaving] = useState(false);

  // États pour les formulaires
  const [profileData, setProfileData] = useState<ProfileData>({
    name: "",
    email: "",
    phone: "",
    company: "",
    address: "",
  });

  const [preferencesData, setPreferencesData] = useState<PreferencesData>({
    language: "fr",
    timezone: "Europe/Paris",
    notifications: true,
    emailNotifications: true,
    smsNotifications: false,
  });

  const [securityData, setSecurityData] = useState<SecurityData>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    twoFactorEnabled: false,
  });

  const [billingData, setBillingData] = useState<BillingData>({
    paymentMethod: "",
    billingAddress: "",
    taxId: "",
  });

  const [privacyData, setPrivacyData] = useState<PrivacyData>({
    profileVisibility: "private",
    dataSharing: false,
    analytics: true,
  });

  // Initialiser les données avec les informations utilisateur
  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        company: user.company || "",
        address: user.address || "",
      });
    }
  }, [user]);

  const handleSave = useCallback(
    async (dataType: string) => {
      setSaving(true);
      try {
        // Simuler une sauvegarde
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Ici, vous feriez l'appel API pour sauvegarder les données
        console.log(`Sauvegarde des données ${dataType}:`, {
          profile: profileData,
          preferences: preferencesData,
          security: securityData,
          billing: billingData,
          privacy: privacyData,
        });

        // Afficher un message de succès
        alert("Paramètres sauvegardés avec succès !");
      } catch (error) {
        console.error("Erreur lors de la sauvegarde:", error);
        alert("Erreur lors de la sauvegarde des paramètres.");
      } finally {
        setSaving(false);
      }
    },
    [profileData, preferencesData, securityData, billingData, privacyData]
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
    handleSave,
  };
}
