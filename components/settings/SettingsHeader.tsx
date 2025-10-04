"use client";

import { SettingsHeaderProps } from "@/types/settings";
import { User } from "lucide-react";
import React from "react";

const SettingsHeader = React.memo<SettingsHeaderProps>(function SettingsHeader({
  userName: _userName,
  userEmail: _userEmail,
}) {
  return (
    <div className="mb-8">
      <div className="flex items-center space-x-4">
        <div className="p-3 bg-blue-100 rounded-full">
          <User className="h-8 w-8 text-blue-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Paramètres</h1>
          <p className="text-gray-600 mt-1">
            Gérez vos préférences et informations personnelles
          </p>
        </div>
      </div>
    </div>
  );
});

SettingsHeader.displayName = "SettingsHeader";

export default SettingsHeader;
