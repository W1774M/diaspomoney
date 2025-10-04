"use client";

import { SecuritySettingsProps } from "@/types/settings";
import { Eye, EyeOff, Lock, Save, Shield } from "lucide-react";
import React, { useCallback, useState } from "react";

const SecuritySettings = React.memo<SecuritySettingsProps>(
  function SecuritySettings({ data, setData, onSave, saving }) {
    const [showPasswords, setShowPasswords] = useState({
      current: false,
      new: false,
      confirm: false,
    });

    const handleChange = useCallback(
      (field: keyof typeof data, value: string | boolean) => {
        setData({ ...data, [field]: value });
      },
      [data, setData]
    );

    const handleSubmit = useCallback(
      (e: React.FormEvent) => {
        e.preventDefault();
        onSave();
      },
      [onSave]
    );

    const togglePasswordVisibility = useCallback(
      (field: keyof typeof showPasswords) => {
        setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
      },
      []
    );

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Sécurité du compte
          </h2>
          <p className="text-gray-600">
            Gérez votre mot de passe et les paramètres de sécurité.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mot de passe actuel
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type={showPasswords.current ? "text" : "password"}
                  value={data.currentPassword}
                  onChange={e =>
                    handleChange("currentPassword", e.target.value)
                  }
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Votre mot de passe actuel"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility("current")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPasswords.current ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nouveau mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type={showPasswords.new ? "text" : "password"}
                  value={data.newPassword}
                  onChange={e => handleChange("newPassword", e.target.value)}
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nouveau mot de passe"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility("new")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPasswords.new ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirmer le nouveau mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type={showPasswords.confirm ? "text" : "password"}
                  value={data.confirmPassword}
                  onChange={e =>
                    handleChange("confirmPassword", e.target.value)
                  }
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Confirmer le nouveau mot de passe"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility("confirm")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPasswords.confirm ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="border-t pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-md font-medium text-gray-900">
                  Authentification à deux facteurs
                </h3>
                <p className="text-sm text-gray-600">
                  Ajoutez une couche de sécurité supplémentaire à votre compte
                </p>
              </div>
              <div className="flex items-center">
                <Shield className="h-5 w-5 text-gray-400 mr-3" />
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={data.twoFactorEnabled}
                    onChange={e =>
                      handleChange("twoFactorEnabled", e.target.checked)
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
);

SecuritySettings.displayName = "SecuritySettings";

export default SecuritySettings;
