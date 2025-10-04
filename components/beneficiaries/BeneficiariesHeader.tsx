"use client";

import { BeneficiariesHeaderProps } from "@/types/beneficiaries";
import { UserPlus } from "lucide-react";
import React from "react";

const BeneficiariesHeader = React.memo<BeneficiariesHeaderProps>(
  function BeneficiariesHeader({ onAddBeneficiary }) {
    return (
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Mes bénéficiaires
          </h1>
          <p className="text-gray-600 mt-2">
            Gérez les personnes pour lesquelles vous souhaitez acheter des
            services
          </p>
        </div>
        <button
          onClick={onAddBeneficiary}
          className="bg-[hsl(25,100%,53%)] text-white px-4 py-2 rounded-lg hover:bg-[hsl(25,100%,48%)] transition-colors flex items-center"
        >
          <UserPlus className="h-5 w-5 mr-2" />
          Ajouter un bénéficiaire
        </button>
      </div>
    );
  }
);

BeneficiariesHeader.displayName = "BeneficiariesHeader";

export default BeneficiariesHeader;
