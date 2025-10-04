"use client";

import { MOCK_USERS } from "@/mocks";
import { Calendar, MapPin, User } from "lucide-react";

export default function UpcomingServicesPage() {
  // Filter providers from mock data for upcoming services
  const mockServices = MOCK_USERS.filter(
    user => user.roles.includes("PROVIDER") && user.status === "ACTIVE"
  )
    .slice(0, 3)
    .map((provider, index) => ({
      id: provider._id,
      title: provider.selectedServices || "Service professionnel",
      provider: provider.name,
      date: new Date(Date.now() + (index + 1) * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0], // Next few days
      time: provider.availabilities?.[0]?.split("-")[0] || "09:00",
      location: provider.address || "En ligne",
      status: index === 0 ? "confirmed" : "pending",
      type: provider.specialty?.toLowerCase() || "professional",
      rating: 4.5,
      specialty: provider.specialty,
      company: provider.company,
    }));

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "confirmed":
        return "Confirmé";
      case "pending":
        return "En attente";
      case "cancelled":
        return "Annulé";
      default:
        return "Inconnu";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Services à venir</h2>
          <p className="text-gray-600 mt-1">
            Services programmés et en attente de réalisation
          </p>
        </div>
        <button className="bg-[hsl(25,100%,53%)] text-white px-4 py-2 rounded-lg hover:bg-[hsl(25,100%,48%)] transition-colors">
          Nouveau service
        </button>
      </div>

      {/* Services List */}
      <div className="grid gap-4">
        {mockServices.map(service => (
          <div
            key={service.id}
            className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {service.title}
                  </h3>
                  <span
                    className={`ml-3 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                      service.status
                    )}`}
                  >
                    {getStatusText(service.status)}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="flex items-center text-gray-600">
                    <User className="h-4 w-4 mr-2" />
                    <span>{service.provider}</span>
                    {service.company && (
                      <span className="ml-2 text-sm text-gray-500">
                        ({service.company})
                      </span>
                    )}
                  </div>

                  <div className="flex items-center text-gray-600">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>
                      {service.date} à {service.time}
                    </span>
                  </div>

                  <div className="flex items-center text-gray-600">
                    <MapPin className="h-4 w-4 mr-2" />
                    <span>{service.location}</span>
                  </div>

                  {service.specialty && (
                    <div className="flex items-center text-gray-600">
                      <span className="text-sm bg-gray-100 px-2 py-1 rounded">
                        {service.specialty}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex space-x-2 ml-4">
                <button className="px-3 py-1 text-sm text-[hsl(25,100%,53%)] hover:bg-[hsl(25,100%,53%)]/10 rounded-lg transition-colors">
                  Modifier
                </button>
                <button className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                  Annuler
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {mockServices.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Aucun service à venir
          </h3>
          <p className="text-gray-500 mb-4">
            Vous n&apos;avez aucun service programmé pour le moment.
          </p>
          <button className="bg-[hsl(25,100%,53%)] text-white px-4 py-2 rounded-lg hover:bg-[hsl(25,100%,48%)] transition-colors">
            Planifier un service
          </button>
        </div>
      )}
    </div>
  );
}
