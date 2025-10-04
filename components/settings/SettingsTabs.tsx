"use client";

import { SettingsTabsProps } from "@/types/settings";
import { Bell, CreditCard, Lock, Shield, User } from "lucide-react";
import React from "react";

const SettingsTabs = React.memo<SettingsTabsProps>(function SettingsTabs({
  activeTab,
  setActiveTab,
  tabs,
}) {
  const defaultTabs = [
    {
      id: "profile",
      name: "Profil",
      icon: User,
      description: "Informations personnelles",
    },
    {
      id: "security",
      name: "Sécurité",
      icon: Lock,
      description: "Mot de passe et authentification",
    },
    {
      id: "notifications",
      name: "Notifications",
      icon: Bell,
      description: "Préférences de notification",
    },
    {
      id: "billing",
      name: "Facturation",
      icon: CreditCard,
      description: "Méthodes de paiement",
    },
    {
      id: "privacy",
      name: "Confidentialité",
      icon: Shield,
      description: "Paramètres de confidentialité",
    },
  ];

  const tabsToShow = tabs.length > 0 ? tabs : defaultTabs;

  return (
    <div className="mb-8">
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabsToShow.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? "border-[hsl(25,100%,53%)] text-[hsl(25,100%,53%)]"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center">
                  <Icon className="h-4 w-4 mr-2" />
                  {tab.name}
                </div>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
});

SettingsTabs.displayName = "SettingsTabs";

export default SettingsTabs;
