"use client";

import { Search, SortAsc, SortDesc } from "lucide-react";

interface PaymentReceiptFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  sortBy: "date" | "amount" | "service";
  onSortByChange: (value: "date" | "amount" | "service") => void;
  sortOrder: "asc" | "desc";
  onSortOrderChange: (value: "asc" | "desc") => void;
}

export function PaymentReceiptFilters({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  sortBy,
  onSortByChange,
  sortOrder,
  onSortOrderChange,
}: PaymentReceiptFiltersProps) {
  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 mb-6">
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Recherche */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={e => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent"
            />
          </div>

          {/* Filtre par statut */}
          <div>
            <select
              value={statusFilter}
              onChange={e => onStatusFilterChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent"
              aria-label="Filtrer par statut"
            >
              <option value="all">Tous les statuts</option>
              <option value="paid">Payé</option>
              <option value="pending">En attente</option>
              <option value="failed">Échec</option>
              <option value="refunded">Remboursé</option>
            </select>
          </div>

          {/* Tri */}
          <div>
            <select
              value={sortBy}
              onChange={e =>
                onSortByChange(e.target.value as "date" | "amount" | "service")
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent"
              aria-label="Trier par"
            >
              <option value="date">Trier par date</option>
              <option value="amount">Trier par montant</option>
              <option value="service">Trier par service</option>
            </select>
          </div>

          {/* Ordre de tri */}
          <div>
            <button
              onClick={() =>
                onSortOrderChange(sortOrder === "asc" ? "desc" : "asc")
              }
              className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent"
            >
              {sortOrder === "asc" ? (
                <SortAsc className="h-4 w-4 mr-2" />
              ) : (
                <SortDesc className="h-4 w-4 mr-2" />
              )}
              {sortOrder === "asc" ? "Croissant" : "Décroissant"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
