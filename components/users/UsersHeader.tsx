"use client";

import type { UsersHeaderProps } from "@/lib/types";
import { Plus } from "lucide-react";
import React from "react";

const UsersHeader = React.memo<UsersHeaderProps>(function UsersHeader({
  onAddUser,
}) {
  return (
    <div className="mb-6">
      {/* Breadcrumb */}
      <div className="text-sm text-gray-600 mb-2">
        <span className="text-gray-400">Pages</span>
        <span className="mx-2">/</span>
        <span className="text-gray-900 font-medium">Users List</span>
      </div>
      
      {/* Title and Action */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Users List
          </h1>
        </div>
        <button
          onClick={onAddUser}
          className="flex items-center px-4 py-2 bg-[hsl(25,100%,53%)] text-white rounded-lg hover:bg-[hsl(25,90%,48%)] transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nouvel utilisateur
        </button>
      </div>
    </div>
  );
});

UsersHeader.displayName = "UsersHeader";

export default UsersHeader;
