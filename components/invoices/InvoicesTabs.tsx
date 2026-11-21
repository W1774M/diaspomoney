"use client";

import type { InvoicesTabsProps } from "@/lib/types";
import React from "react";

const InvoicesTabs = React.memo<InvoicesTabsProps>(function InvoicesTabs({
  activeTab,
  setActiveTab,
  isAdmin,
  isProvider,
  isCustomer,
}) {
  const tabs = [
    ...(isAdmin ? [{ id: "all" as const, name: "Toutes les factures" }] : []),
    ...(isProvider
      ? [{ id: "as-provider" as const, name: "Mes factures (prestataire)" }]
      : []),
    ...(isCustomer
      ? [{ id: "as-customer" as const, name: "Mes factures (client)" }]
      : []),
  ];

  if (tabs.length <= 1) {
    return null;
  }

  return (
    <div className="mb-6">
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? "border-[hsl(25,100%,53%)] text-[hsl(25,100%,53%)]"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab.name}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
});

InvoicesTabs.displayName = "InvoicesTabs";

export default InvoicesTabs;
