"use client";

import { QuotesTableProps } from "@/types/quotes";
import React from "react";
import QuoteCard from "./QuoteCard";

const QuotesTable = React.memo<QuotesTableProps>(function QuotesTable({
  quotes,
  loading,
  onView,
  onEdit,
  onDelete,
  onDownload,
  onApprove,
  onReject,
}) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-9 h-9 bg-gray-200 rounded-lg"></div>
                  <div className="h-4 bg-gray-200 rounded w-32"></div>
                  <div className="h-6 bg-gray-200 rounded w-20"></div>
                </div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
              <div className="flex flex-col space-y-2">
                <div className="flex space-x-2">
                  <div className="w-8 h-8 bg-gray-200 rounded"></div>
                  <div className="w-8 h-8 bg-gray-200 rounded"></div>
                  <div className="w-8 h-8 bg-gray-200 rounded"></div>
                </div>
                <div className="flex space-x-2">
                  <div className="w-16 h-6 bg-gray-200 rounded"></div>
                  <div className="w-16 h-6 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (quotes.length === 0) {
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
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Aucun devis trouvé
        </h3>
        <p className="text-gray-600">
          Essayez de modifier vos critères de recherche.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {quotes.map(quote => (
        <QuoteCard
          key={quote.id}
          quote={quote}
          onView={onView}
          onEdit={onEdit}
          onDelete={onDelete}
          onDownload={onDownload}
          onApprove={onApprove}
          onReject={onReject}
        />
      ))}
    </div>
  );
});

QuotesTable.displayName = "QuotesTable";

export default QuotesTable;
