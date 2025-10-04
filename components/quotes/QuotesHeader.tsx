"use client";

import { QuotesHeaderProps } from "@/types/quotes";
import { Plus } from "lucide-react";
import React from "react";

const QuotesHeader = React.memo<QuotesHeaderProps>(function QuotesHeader({
  totalQuotes,
  onAddQuote,
}) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Gestion des devis</h1>
        <p className="text-gray-600 mt-1">{totalQuotes} devis au total</p>
      </div>
      <button
        onClick={onAddQuote}
        className="flex items-center px-4 py-2 bg-[hsl(25,100%,53%)] text-white rounded-lg hover:bg-[hsl(25,100%,48%)] transition-colors"
      >
        <Plus className="h-4 w-4 mr-2" />
        Nouveau devis
      </button>
    </div>
  );
});

QuotesHeader.displayName = "QuotesHeader";

export default QuotesHeader;
