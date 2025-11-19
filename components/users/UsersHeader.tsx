"use client";

import type { UsersHeaderProps } from "@/lib/types";
import { Plus } from "lucide-react";
import React from "react";

const UsersHeader = React.memo<UsersHeaderProps>(function UsersHeader({
  totalUsers,
  onAddUser,
}) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Gestion des utilisateurs
        </h1>
        <p className="text-gray-600 mt-1">
          {totalUsers} utilisateur{totalUsers !== 1 ? "s" : ""} au total
        </p>
      </div>
      <button
        onClick={onAddUser}
        className="flex items-center px-4 py-2 bg-[hsl(25,100%,53%)] text-white rounded-lg hover:bg-[hsl(25,100%,48%)] transition-colors"
      >
        <Plus className="h-4 w-4 mr-2" />
        Ajouter un utilisateur
      </button>
    </div>
  );
});

UsersHeader.displayName = "UsersHeader";

export default UsersHeader;
