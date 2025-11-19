"use client";

import { BookingsSearchProps } from "@/types/bookings";
import { Search } from "lucide-react";
import React, { useCallback } from "react";

const BookingsSearch = React.memo<BookingsSearchProps>(function BookingsSearch({
  searchTerm,
  setSearchTerm,
}) {
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchTerm(e.target.value);
    },
    [setSearchTerm],
  );

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
      <input
        type="text"
        placeholder="Rechercher..."
        value={searchTerm}
        onChange={handleSearchChange}
        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
    </div>
  );
});

BookingsSearch.displayName = "BookingsSearch";

export default BookingsSearch;
