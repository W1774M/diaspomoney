"use client";

import { BeneficiariesSearchProps } from "@/types/beneficiaries";
import { Search } from "lucide-react";
import React, { useCallback } from "react";

const BeneficiariesSearch = React.memo<BeneficiariesSearchProps>(
  function BeneficiariesSearch({ searchTerm, setSearchTerm }) {
    const handleSearchChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
      },
      [setSearchTerm]
    );

    return (
      <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un bénéficiaire..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent"
          />
        </div>
      </div>
    );
  }
);

BeneficiariesSearch.displayName = "BeneficiariesSearch";

export default BeneficiariesSearch;
