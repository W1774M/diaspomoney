import React from "react";
import { Filter, X } from "lucide-react";
import { USER_STATUSES } from "@/lib/constants";

interface AdvancedFiltersProps {
  showAdvancedFilters: boolean;
  setShowAdvancedFilters: (show: boolean) => void;
  selectedStatus: string[];
  setSelectedStatus: (status: string[]) => void;
  selectedRating: number | null;
  setSelectedRating: (rating: number | null) => void;
  selectedPriceRange: string[];
  setSelectedPriceRange: (range: string[]) => void;
}

export const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({
  showAdvancedFilters,
  setShowAdvancedFilters,
  selectedStatus,
  setSelectedStatus,
  selectedRating,
  setSelectedRating,
  selectedPriceRange,
  setSelectedPriceRange,
}) => {
  const statusOptions = [
    { value: USER_STATUSES.ACTIVE, label: "Actif", color: "text-green-600" },
    { value: USER_STATUSES.INACTIVE, label: "Inactif", color: "text-gray-600" },
    { value: USER_STATUSES.PENDING, label: "En attente", color: "text-yellow-600" },
    { value: USER_STATUSES.SUSPENDED, label: "Suspendu", color: "text-red-600" },
  ];

  const ratingOptions = [
    { value: 5, label: "5 étoiles" },
    { value: 4, label: "4+ étoiles" },
    { value: 3, label: "3+ étoiles" },
  ];

  const priceRanges = [
    { value: "0-50", label: "0€ - 50€" },
    { value: "50-100", label: "50€ - 100€" },
    { value: "100-200", label: "100€ - 200€" },
    { value: "200+", label: "200€+" },
  ];

  const handleStatusChange = (status: string) => {
    if (selectedStatus.includes(status)) {
      setSelectedStatus(selectedStatus.filter(s => s !== status));
    } else {
      setSelectedStatus([...selectedStatus, status]);
    }
  };

  const handleRatingChange = (rating: number) => {
    setSelectedRating(selectedRating === rating ? null : rating);
  };

  const handlePriceRangeChange = (range: string) => {
    if (selectedPriceRange.includes(range)) {
      setSelectedPriceRange(selectedPriceRange.filter(r => r !== range));
    } else {
      setSelectedPriceRange([...selectedPriceRange, range]);
    }
  };

  const clearAllFilters = () => {
    setSelectedStatus([]);
    setSelectedRating(null);
    setSelectedPriceRange([]);
  };

  const hasActiveFilters = selectedStatus.length > 0 || selectedRating !== null || selectedPriceRange.length > 0;

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          className="flex items-center text-gray-700 hover:text-blue-600 transition-colors"
        >
          <Filter className="w-4 h-4 mr-2" />
          Filtres avancés
          {hasActiveFilters && (
            <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {selectedStatus.length + (selectedRating ? 1 : 0) + selectedPriceRange.length}
            </span>
          )}
        </button>
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="text-sm text-red-600 hover:text-red-800 transition-colors"
          >
            <X className="w-4 h-4 inline mr-1" />
            Effacer tous les filtres
          </button>
        )}
      </div>

      {showAdvancedFilters && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Filtre par statut */}
            <div>
              <h4 className="font-medium text-gray-700 mb-3">Statut</h4>
              <div className="space-y-2">
                {statusOptions.map((status) => (
                  <label key={status.value} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedStatus.includes(status.value)}
                      onChange={() => handleStatusChange(status.value)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className={`ml-2 text-sm ${status.color}`}>
                      {status.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Filtre par évaluation */}
            <div>
              <h4 className="font-medium text-gray-700 mb-3">Évaluation minimale</h4>
              <div className="space-y-2">
                {ratingOptions.map((rating) => (
                  <label key={rating.value} className="flex items-center">
                    <input
                      type="radio"
                      name="rating"
                      checked={selectedRating === rating.value}
                      onChange={() => handleRatingChange(rating.value)}
                      className="rounded-full border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      {rating.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Filtre par fourchette de prix */}
            <div>
              <h4 className="font-medium text-gray-700 mb-3">Fourchette de prix</h4>
              <div className="space-y-2">
                {priceRanges.map((range) => (
                  <label key={range.value} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedPriceRange.includes(range.value)}
                      onChange={() => handlePriceRangeChange(range.value)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      {range.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
