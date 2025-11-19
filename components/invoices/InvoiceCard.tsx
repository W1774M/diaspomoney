"use client";

import {
  formatCurrency,
  formatDate,
  getInvoiceStatusColor,
  getInvoiceStatusText,
} from "@/lib/invoices/utils";
import type { InvoiceCardProps } from "@/lib/types";
import { Calendar, FileText } from "lucide-react";
import React from "react";
import InvoiceActions from "./InvoiceActions";

const InvoiceCard = React.memo<InvoiceCardProps>(function InvoiceCard({
  invoice,
  onView,
  onEdit,
  onDelete,
  onDownload,
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
                {invoice.invoiceNumber}
              </h3>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${getInvoiceStatusColor(invoice.status)}`}
              >
                {getInvoiceStatusText(invoice.status)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="flex items-center text-gray-600">
              <Calendar className="h-4 w-4 mr-2" />
              <span className="text-sm">
                Émise le {formatDate(invoice.issueDate)}
              </span>
            </div>

            <div className="flex items-center text-gray-600">
              <Calendar className="h-4 w-4 mr-2" />
              <span className="text-sm">
                Échéance le {formatDate(invoice.dueDate)}
              </span>
            </div>

            <div className="flex items-center text-gray-600">
              <span className="text-sm">Client: {invoice.customerId}</span>
            </div>

            <div className="flex items-center text-gray-600">
              <span className="text-sm">Prestataire: {invoice.providerId}</span>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Montant total:</span>
              <span className="text-lg font-bold text-gray-900">
                {formatCurrency(invoice.amount, invoice.currency)}
              </span>
            </div>
          </div>

          {invoice.paidDate && (
            <div className="mt-2">
              <span className="text-sm text-green-600">
                Payée le {formatDate(invoice.paidDate)}
              </span>
            </div>
          )}
        </div>

        <InvoiceActions
          onView={() => onView(invoice._id)}
          onEdit={() => onEdit(invoice._id)}
          onDelete={() => onDelete(invoice._id)}
          onDownload={() => onDownload(invoice._id)}
        />
      </div>
    </div>
  );
});

InvoiceCard.displayName = "InvoiceCard";

export default InvoiceCard;
