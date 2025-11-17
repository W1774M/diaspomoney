"use client";

import { BeneficiariesTableProps } from "@/types/beneficiaries";
import { AlertCircle, Loader2, User } from "lucide-react";
import React from "react";
import BeneficiaryCard from "./BeneficiaryCard";

const BeneficiariesTable = React.memo<BeneficiariesTableProps>(
  function BeneficiariesTable({
    beneficiaries,
    loading,
    error,
    onEdit,
    onDelete,
  }) {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[hsl(25,100%,53%)]" />
          <span className="ml-2 text-gray-600">
            Chargement des bénéficiaires...
          </span>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Erreur</h3>
            <p className="text-gray-500 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-[hsl(25,100%,53%)] text-white px-4 py-2 rounded-lg hover:bg-[hsl(25,100%,48%)] transition-colors"
            >
              Réessayer
            </button>
          </div>
        </div>
      );
    }

    if (beneficiaries.length === 0) {
      return (
        <div className="text-center py-12">
          <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Aucun bénéficiaire
          </h3>
          <p className="text-gray-500 mb-4">
            Ajoutez des personnes pour lesquelles vous souhaitez acheter des
            services
          </p>
        </div>
      );
    }

    return (
      <div className="grid gap-4">
        {beneficiaries.map(beneficiary => (
          <BeneficiaryCard
            key={beneficiary._id}
            beneficiary={beneficiary}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    );
  },
);

BeneficiariesTable.displayName = "BeneficiariesTable";

export default BeneficiariesTable;
