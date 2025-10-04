"use client";

import { Check, Download, Edit, Eye, Trash2, X } from "lucide-react";
import React from "react";

interface QuoteActionsProps {
  quote: any;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onDownload: () => void;
  onApprove: () => void;
  onReject: () => void;
}

const QuoteActions = React.memo<QuoteActionsProps>(function QuoteActions({
  quote,
  onView,
  onEdit,
  onDelete,
  onDownload,
  onApprove,
  onReject,
}) {
  return (
    <div className="flex flex-col space-y-2">
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
          onClick={onDownload}
          className="p-2 text-gray-400 hover:text-green-600 transition-colors"
          title="Télécharger"
        >
          <Download className="h-4 w-4" />
        </button>

        <button
          onClick={onDelete}
          className="p-2 text-gray-400 hover:text-red-600 transition-colors"
          title="Supprimer"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {quote.status === "PENDING" && (
        <div className="flex items-center space-x-2">
          <button
            onClick={onApprove}
            className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded hover:bg-green-200 transition-colors"
            title="Approuver"
          >
            <Check className="h-3 w-3 mr-1 inline" />
            Approuver
          </button>

          <button
            onClick={onReject}
            className="px-3 py-1 bg-red-100 text-red-800 text-xs font-medium rounded hover:bg-red-200 transition-colors"
            title="Rejeter"
          >
            <X className="h-3 w-3 mr-1 inline" />
            Rejeter
          </button>
        </div>
      )}
    </div>
  );
});

QuoteActions.displayName = "QuoteActions";

export default QuoteActions;
