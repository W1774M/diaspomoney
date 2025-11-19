"use client";

import type { UsersTableProps } from "@/lib/types";
import React from "react";
import UserCard from "./UserCard";

const UsersTable = React.memo<UsersTableProps>(function UsersTable({
  users,
  loading,
  onDelete,
  onEdit,
  onView,
  onSendEmail,
  onCall,
}) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse"
          >
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="flex space-x-2">
                  <div className="h-6 bg-gray-200 rounded w-16"></div>
                  <div className="h-6 bg-gray-200 rounded w-20"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">
          <svg
            className="w-12 h-12 mx-auto"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Aucun utilisateur trouvé
        </h3>
        <p className="text-gray-600">
          Essayez de modifier vos critères de recherche.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {users.map((user: any) => (
        <UserCard
          key={user._id}
          user={user}
          onDelete={onDelete}
          onEdit={onEdit}
          onView={onView}
          onSendEmail={onSendEmail}
          onCall={onCall}
        />
      ))}
    </div>
  );
});

UsersTable.displayName = "UsersTable";

export default UsersTable;
