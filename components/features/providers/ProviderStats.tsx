import { Clock, MapPin, Star, Users } from "lucide-react";
import React from "react";

interface ProviderStatsProps {
  activeProviders: number;
  totalSpecialties: number;
  totalCountries: number;
}

export const ProviderStats: React.FC<ProviderStatsProps> = ({
  activeProviders,
  totalSpecialties,
  totalCountries,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Users className="w-6 h-6 text-blue-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">
              Prestataires actifs
            </p>
            <p className="text-2xl font-bold text-gray-900">
              {activeProviders}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center">
          <div className="p-2 bg-green-100 rounded-lg">
            <Star className="w-6 h-6 text-green-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Spécialités</p>
            <p className="text-2xl font-bold text-gray-900">
              {totalSpecialties}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center">
          <div className="p-2 bg-purple-100 rounded-lg">
            <MapPin className="w-6 h-6 text-purple-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Pays couverts</p>
            <p className="text-2xl font-bold text-gray-900">{totalCountries}</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center">
          <div className="p-2 bg-orange-100 rounded-lg">
            <Clock className="w-6 h-6 text-orange-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Disponibilité</p>
            <p className="text-2xl font-bold text-gray-900">24/7</p>
          </div>
        </div>
      </div>
    </div>
  );
};
