"use client";

import {
  formatCurrency,
  formatDate,
  getQuoteStatusColor,
  getQuoteStatusText,
} from "@/lib/quotes/utils";
import { QuoteCardProps } from "@/types/quotes";
import { Calendar, Clock, FileText } from "lucide-react";
import React from "react";
import QuoteActions from "./QuoteActions";

const QuoteCard = React.memo<QuoteCardProps>(function QuoteCard({
  quote,
  onView,
  onEdit,
  onDelete,
  onDownload,
  onApprove,
  onReject,
}) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {quote.number}
              </h3>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${getQuoteStatusColor(quote.status)}`}
              >
                {getQuoteStatusText(quote.status)}
              </span>
            </div>
          </div>

          <h4 className="text-md font-medium text-gray-800 mb-2">
            {quote.title}
          </h4>

          <p className="text-sm text-gray-600 mb-3">
            Prestataire: {quote.provider}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="flex items-center text-gray-600">
              <Calendar className="h-4 w-4 mr-2" />
              <span className="text-sm">
                Créé le {formatDate(quote.createdAt)}
              </span>
            </div>

            <div className="flex items-center text-gray-600">
              <Clock className="h-4 w-4 mr-2" />
              <span className="text-sm">
                Valide jusqu&apos;au {formatDate(quote.validUntil)}
              </span>
            </div>
          </div>

          <div className="mb-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Montant:</span>
              <span className="text-lg font-bold text-gray-900">
                {formatCurrency(quote.amount)}
              </span>
            </div>
          </div>

          <div className="mb-4">
            <p className="text-sm font-medium text-gray-700 mb-2">Services:</p>
            <div className="flex flex-wrap gap-2">
              {quote.services.map((service, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                >
                  {service}
                </span>
              ))}
            </div>
          </div>
        </div>

        <QuoteActions
          quote={quote}
          onView={() => onView(quote.id)}
          onEdit={() => onEdit(quote.id)}
          onDelete={() => onDelete(quote.id)}
          onDownload={() => onDownload(quote.id)}
          onApprove={() => onApprove(quote.id)}
          onReject={() => onReject(quote.id)}
        />
      </div>
    </div>
  );
});

QuoteCard.displayName = "QuoteCard";

export default QuoteCard;
