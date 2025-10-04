"use client";

import { InvoicesHeaderProps } from "@/types/invoices";
import { Plus } from "lucide-react";
import React from "react";

const InvoicesHeader = React.memo<InvoicesHeaderProps>(function InvoicesHeader({
  totalInvoices,
  onAddInvoice,
}) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Gestion des factures
        </h1>
        <p className="text-gray-600 mt-1">
          {totalInvoices} facture{totalInvoices !== 1 ? "s" : ""} au total
        </p>
      </div>
      <button
        onClick={onAddInvoice}
        className="flex items-center px-4 py-2 bg-[hsl(25,100%,53%)] text-white rounded-lg hover:bg-[hsl(25,100%,48%)] transition-colors"
      >
        <Plus className="h-4 w-4 mr-2" />
        Nouvelle facture
      </button>
    </div>
  );
});

InvoicesHeader.displayName = "InvoicesHeader";

export default InvoicesHeader;
