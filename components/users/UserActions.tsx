"use client";

import { Edit, Eye, Trash2 } from "lucide-react";
import React from "react";

interface UserActionsProps {
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const UserActions = React.memo<UserActionsProps>(function UserActions({
  onView,
  onEdit,
  onDelete,
}) {
  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={onView}
        className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
        title="Voir les détails"
      >
        <Eye className="h-4 w-4" />
      </button>

      <button
        onClick={onEdit}
        className="p-2 text-gray-400 hover:text-yellow-600 transition-colors"
        title="Modifier"
      >
        <Edit className="h-4 w-4" />
      </button>

      <button
        onClick={onDelete}
        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
        title="Supprimer"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
});

UserActions.displayName = "UserActions";

export default UserActions;
