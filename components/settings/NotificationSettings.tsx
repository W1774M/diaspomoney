"use client";

import { NotificationSettingsProps } from "@/lib/types"; 
import { Bell, Globe, Save } from "lucide-react";
import React, { useCallback } from "react";

function NotificationSettingsComponent({ data, setData, onSave, saving }: NotificationSettingsProps) {
    const emailByType = data.notificationEmailByType || {};

    const setEmailTypePref = useCallback(
      (type: string, enabled: boolean) => {
        setData({
          ...data,
          notificationEmailByType: {
            ...(data.notificationEmailByType || {}),
            [type.toUpperCase()]: enabled,
          },
        });
      },
      [data, setData],
    );

    const FORCED_EMAIL_TYPES = new Set([
      "PAYMENT_SUCCESS",
      "PAYMENT_FAILED",
      "PAYMENT_REFUNDED",
      "KYC_REQUIRED_REMINDER",
      "KYC_APPROVED",
      "KYC_REJECTED",
    ]);

    const EMAIL_TYPES_CATALOG: Array<{
      type: string;
      label: string;
      description: string;
    }> = [
      {
        type: "PAYMENT_SUCCESS",
        label: "Paiement reçu (confirmé)",
        description: "Reçu de paiement envoyé à chaque transaction",
      },
      {
        type: "PAYMENT_FAILED",
        label: "Paiement échoué",
        description: "Important si une action est nécessaire",
      },
      {
        type: "PAYMENT_REFUNDED",
        label: "Remboursement confirmé",
        description: "Confirmation d'un remboursement",
      },
      {
        type: "KYC_REQUIRED_REMINDER",
        label: "Rappel KYC (action requise)",
        description: "Rappels J+1, J+2, J+7 tant que le KYC est en attente",
      },
      {
        type: "KYC_APPROVED",
        label: "KYC approuvé",
        description: "Confirmation de vérification d'identité",
      },
      {
        type: "KYC_REJECTED",
        label: "KYC refusé",
        description: "Rejet + prochaines étapes",
      },
      {
        type: "APPOINTMENT_REMINDER",
        label: "Rappel de rendez-vous",
        description: "Rappels liés aux réservations/rendez-vous",
      },
      {
        type: "LOGIN_SUCCESS",
        label: "Connexion réussie",
        description: "Email de sécurité après connexion",
      },
      {
        type: "WELCOME_EMAIL",
        label: "Bienvenue",
        description: "Email de bienvenue lors de la création du compte",
      },
    ];

    const handleChange = useCallback(
      (field: keyof typeof data, value: string | boolean) => {
        setData({ ...data, [field]: value });
      },
      [data, setData],
    );

    const handleSubmit = useCallback(
      (e: React.FormEvent) => {
        e.preventDefault();
        onSave();
      },
      [onSave],
    );

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Préférences de notification
          </h2>
          <p className="text-gray-600">
            Configurez comment et quand vous souhaitez recevoir des
            notifications.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Langue
              </label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <select
                  title="Langue"
                  value={data.language}
                  onChange={e => handleChange("language", e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="fr">Français</option>
                  <option value="en">English</option>
                  <option value="es">Español</option>
                  <option value="de">Deutsch</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fuseau horaire
              </label>
              <select
                title="Fuseau horaire"
                value={data.timezone}
                onChange={e => handleChange("timezone", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Europe/Paris">Europe/Paris (UTC+1)</option>
                <option value="Europe/London">Europe/London (UTC+0)</option>
                <option value="America/New_York">
                  America/New_York (UTC-5)
                </option>
                <option value="Asia/Tokyo">Asia/Tokyo (UTC+9)</option>
              </select>
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-md font-medium text-gray-900 mb-4">
              Notifications
            </h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Bell className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Notifications générales
                    </p>
                    <p className="text-sm text-gray-600">
                      Recevoir des notifications sur l&apos;activité de votre
                      compte
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    title="Notifications générales"
                    type="checkbox"
                    checked={data.notifications}
                    onChange={e =>
                      handleChange("notifications", e.target.checked)
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Bell className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Notifications par email
                    </p>
                    <p className="text-sm text-gray-600">
                      Recevoir des notifications par email
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Les emails transactionnels (paiements, KYC) restent envoyés pour votre sécurité.
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    title="Notifications par email"
                    type="checkbox"
                    checked={data.emailNotifications}
                    onChange={e =>
                      handleChange("emailNotifications", e.target.checked)
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* Préférences fines par type (EMAIL) */}
              <div className="mt-2 bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Emails par type de notification
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      Active/désactive les emails pour chaque type (hors paiements/KYC qui restent obligatoires).
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const next: Record<string, boolean> = { ...(data.notificationEmailByType || {}) };
                        EMAIL_TYPES_CATALOG.forEach(item => {
                          if (!FORCED_EMAIL_TYPES.has(item.type)) next[item.type] = true;
                        });
                        setData({ ...data, notificationEmailByType: next });
                      }}
                      className="px-3 py-1.5 rounded-md text-xs font-medium bg-white border border-gray-200 hover:bg-gray-100"
                    >
                      Tout activer
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const next: Record<string, boolean> = { ...(data.notificationEmailByType || {}) };
                        EMAIL_TYPES_CATALOG.forEach(item => {
                          if (!FORCED_EMAIL_TYPES.has(item.type)) next[item.type] = false;
                        });
                        setData({ ...data, notificationEmailByType: next });
                      }}
                      className="px-3 py-1.5 rounded-md text-xs font-medium bg-white border border-gray-200 hover:bg-gray-100"
                    >
                      Tout désactiver
                    </button>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  {EMAIL_TYPES_CATALOG.map(item => {
                    const forced = FORCED_EMAIL_TYPES.has(item.type);
                    const checked = forced ? true : (emailByType[item.type] ?? true);
                    return (
                      <div key={item.type} className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900">
                            {item.label}
                            <span className="ml-2 text-[11px] text-gray-500 font-mono">{item.type}</span>
                          </p>
                          <p className="text-xs text-gray-600">{item.description}</p>
                        </div>
                        <label className={`relative inline-flex items-center cursor-pointer ${forced ? 'opacity-60 cursor-not-allowed' : ''}`}>
                          <input
                            type="checkbox"
                            disabled={forced || !data.emailNotifications}
                            checked={checked}
                            onChange={e => setEmailTypePref(item.type, e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Bell className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Notifications SMS
                    </p>
                    <p className="text-sm text-gray-600">
                      Recevoir des notifications par SMS
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    title="Notifications SMS"
                    type="checkbox"
                    checked={data.smsNotifications}
                    onChange={e =>
                      handleChange("smsNotifications", e.target.checked)
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center px-4 py-2 bg-[hsl(25,100%,53%)] text-white rounded-lg hover:bg-[hsl(25,100%,48%)] transition-colors disabled:opacity-50"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Sauvegarde..." : "Sauvegarder"}
            </button>
          </div>
        </form>
      </div>
    );
}

const NotificationSettings = React.memo(NotificationSettingsComponent);
NotificationSettings.displayName = "NotificationSettings";

export default NotificationSettings;
