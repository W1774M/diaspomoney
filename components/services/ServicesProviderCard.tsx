"use client";

import {
  formatProviderName,
  getPrimaryService,
  getProviderRating,
} from "@/lib/services/utils";
import { ServiceCardProps } from "@/types/services";
import { Clock, MapPin, Star } from "lucide-react";
import Image from "next/image";
import React from "react";

const ServicesProviderCard = React.memo<ServiceCardProps>(
  function ServicesProviderCard({ provider, onDetails }) {
    const providerName = formatProviderName(provider);
    const rating = getProviderRating(provider);
    const primaryService = getPrimaryService(provider);

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
        <div className="flex items-start space-x-4">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
              {provider["avatar"]?.image ? (
                <Image
                  src={provider["avatar"].image}
                  alt={provider["avatar"].name}
                  width={64}
                  height={64}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-2xl font-bold text-gray-600">
                  {provider.firstName.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 truncate">
                  {providerName}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {provider.specialties?.[0] || "Spécialité non spécifiée"}
                </p>

                {/* Rating */}
                {rating > 0 && (
                  <div className="flex items-center mt-2">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < Math.floor(rating)
                              ? "text-yellow-400 fill-current"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="ml-2 text-sm text-gray-600">
                      {rating.toFixed(1)}
                    </span>
                  </div>
                )}

                {/* Services */}
                <div className="mt-3">
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Services:</span>{" "}
                    {primaryService}
                  </p>
                </div>

                {/* Location and Availability */}
                <div className="mt-3 space-y-1">
                  {provider.address && (
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="h-4 w-4 mr-1" />
                      <span className="truncate">{provider.address}</span>
                    </div>
                  )}

                  {provider["availabilities"] &&
                    provider["availabilities"].length > 0 && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="h-4 w-4 mr-1" />
                        <span>Disponible</span>
                      </div>
                    )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col space-y-2 ml-4">
                <button
                  onClick={onDetails}
                  className="px-4 py-2 bg-[hsl(25,100%,53%)] text-white text-sm font-medium rounded-md hover:bg-[hsl(25,100%,48%)] transition-colors"
                >
                  Voir détails
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  },
);

ServicesProviderCard.displayName = "ServicesProviderCard";

export default ServicesProviderCard;
