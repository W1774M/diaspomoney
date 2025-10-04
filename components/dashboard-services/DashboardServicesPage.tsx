"use client";

import { DashboardServiceTab } from "@/types/dashboard-services";
import { Calendar, Clock, History } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useCallback, useEffect, useState } from "react";
import DashboardServicesContent from "./DashboardServicesContent";
import DashboardServicesHeader from "./DashboardServicesHeader";
import DashboardServicesTabs from "./DashboardServicesTabs";

const DashboardServicesPage = React.memo(function DashboardServicesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState("upcoming");

  const tabs: DashboardServiceTab[] = [
    {
      id: "upcoming",
      name: "À venir",
      icon: Calendar as any,
      description: "Services programmés",
    },
    {
      id: "tracking",
      name: "Suivi",
      icon: Clock as any,
      description: "Services en cours",
    },
    {
      id: "history",
      name: "Historiques",
      icon: History as any,
      description: "Services terminés",
    },
  ];

  // Récupérer l'onglet actif depuis l'URL
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab && ["upcoming", "tracking", "history"].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const handleTabChange = useCallback(
    (tabId: string) => {
      setActiveTab(tabId);
      router.push(`/dashboard/services?tab=${tabId}`);
    },
    [router],
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case "upcoming":
        return (
          <div className="p-6">
            <div className="flex items-center mb-4">
              <Calendar className="h-6 w-6 text-[hsl(25,100%,53%)] mr-3" />
              <h2 className="text-xl font-semibold text-gray-900">
                Services à venir
              </h2>
            </div>
            <p className="text-gray-600 mb-4">
              Services programmés et en attente de réalisation
            </p>
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Aucun service à venir</p>
            </div>
          </div>
        );

      case "tracking":
        return (
          <div className="p-6">
            <div className="flex items-center mb-4">
              <Clock className="h-6 w-6 text-[hsl(25,100%,53%)] mr-3" />
              <h2 className="text-xl font-semibold text-gray-900">
                Suivi des services
              </h2>
            </div>
            <p className="text-gray-600 mb-4">
              Services en cours de réalisation
            </p>
            <div className="text-center py-12">
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Aucun service en cours</p>
            </div>
          </div>
        );

      case "history":
        return (
          <div className="p-6">
            <div className="flex items-center mb-4">
              <History className="h-6 w-6 text-[hsl(25,100%,53%)] mr-3" />
              <h2 className="text-xl font-semibold text-gray-900">
                Historique des services
              </h2>
            </div>
            <p className="text-gray-600 mb-4">Services terminés et archivés</p>
            <div className="text-center py-12">
              <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                Aucun service dans l&apos;historique
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <DashboardServicesHeader
        title="Services"
        description="Gérez vos services et suivez leur progression"
      />

      {/* Navigation Tabs */}
      <DashboardServicesTabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />

      {/* Content Area */}
      <DashboardServicesContent activeTab={activeTab}>
        {renderTabContent()}
      </DashboardServicesContent>
    </div>
  );
});

DashboardServicesPage.displayName = "DashboardServicesPage";

export default DashboardServicesPage;
