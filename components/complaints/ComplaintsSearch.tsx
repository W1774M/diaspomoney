"use client";

import { ComplaintsSearchProps } from "@/types/complaints";
import { Search } from "lucide-react";
import React, { useCallback } from "react";

const ComplaintsSearch = React.memo<ComplaintsSearchProps>(
  function ComplaintsSearch({ searchTerm, setSearchTerm }) {
    const handleSearchChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
      },
      [setSearchTerm],
    );

    return (
      <div className="flex-1">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Rechercher une réclamation..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent"
          />
        </div>
      </div>
    );
  },
);

ComplaintsSearch.displayName = "ComplaintsSearch";

export default ComplaintsSearch;
