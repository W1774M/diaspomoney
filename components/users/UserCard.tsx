"use client";

import {
  formatUserName,
  getRoleColor,
  getRoleText,
  getStatusColor,
  getStatusText,
  getUserInitials,
} from "@/lib/users/utils";
import type { UserCardProps } from "@/lib/types";
import { Mail, Phone } from "lucide-react";
import Image from "next/image";
import React from "react";
import UserActions from "./UserActions";

const UserCard = React.memo<UserCardProps>(function UserCard({
  user,
  onDelete,
  onEdit,
  onView,
  onSendEmail,
  onCall,
}) {
  const userName = formatUserName(user);
  const initials = getUserInitials(user);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start space-x-4">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
            {user.avatar?.image ? (
              <Image
                src={user.avatar.image}
                alt={user.avatar.name}
                width={48}
                height={48}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-lg font-bold text-gray-600">
                {initials}
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {userName}
              </h3>
              <p className="text-sm text-gray-600 truncate">{user.email}</p>

              {user.company && (
                <p className="text-sm text-gray-500 truncate mt-1">
                  {user.company}
                </p>
              )}

              {/* Roles and Status */}
              <div className="flex flex-wrap gap-2 mt-3">
                {user.roles?.map((role: string, index: number) => (
                  <span
                    key={index}
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(role as any)}`}
                  >
                    {getRoleText(role as any)}
                  </span>
                ))}

                {user.status && (
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(user.status as any)}`}
                  >
                    {getStatusText(user.status as any)}
                  </span>
                )}
              </div>

              {/* Contact Info */}
              <div className="flex items-center space-x-4 mt-3">
                {user.email && (
                  <button
                    onClick={() => onSendEmail(user)}
                    className="flex items-center text-sm text-gray-600 hover:text-blue-600 transition-colors"
                  >
                    <Mail className="h-4 w-4 mr-1" />
                    Email
                  </button>
                )}

                {user.phone && (
                  <button
                    onClick={() => onCall(user)}
                    className="flex items-center text-sm text-gray-600 hover:text-green-600 transition-colors"
                  >
                    <Phone className="h-4 w-4 mr-1" />
                    Appeler
                  </button>
                )}
              </div>
            </div>

            {/* Actions */}
            <UserActions
              onView={() => onView(user._id)}
              onEdit={() => onEdit(user._id)}
              onDelete={() => onDelete(user._id)}
            />
          </div>
        </div>
      </div>
    </div>
  );
});

UserCard.displayName = "UserCard";

export default UserCard;
