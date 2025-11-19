"use client";

import {
  formatCreationDate,
  getAccountStatusColor,
  getAccountStatusDisplay,
  isRecentlyAdded,
} from "@/lib/beneficiaries/utils";
import { BeneficiaryCardProps } from "@/lib/types";
import { Edit, Mail, Phone, Trash2, User } from "lucide-react";
import React from "react";

const BeneficiaryCard = React.memo<BeneficiaryCardProps>(
  function BeneficiaryCard({ beneficiary, onEdit, onDelete }) {
    // const initials = getBeneficiaryInitials(beneficiary);
    const accountStatusDisplay = getAccountStatusDisplay(beneficiary);
    const accountStatusColor = getAccountStatusColor(beneficiary);
    const creationDate = formatCreationDate(beneficiary);
    const recentlyAdded = isRecentlyAdded(beneficiary);

    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-[hsl(25,100%,53%)]/10 rounded-full flex items-center justify-center mr-4">
                <User className="h-6 w-6 text-[hsl(25,100%,53%)]" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {beneficiary.firstName} {beneficiary.lastName}
                </h3>
                <p className="text-sm text-gray-600">
                  {beneficiary.relationship}
                </p>
                <div className="flex items-center mt-1">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${accountStatusColor}`}
                  >
                    {accountStatusDisplay}
                  </span>
                  {recentlyAdded && (
                    <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                      Nouveau
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {beneficiary.email && (
                <div className="flex items-center text-gray-600">
                  <Mail className="h-4 w-4 mr-2" />
                  <span>{beneficiary.email}</span>
                </div>
              )}

              {beneficiary.phone && (
                <div className="flex items-center text-gray-600">
                  <Phone className="h-4 w-4 mr-2" />
                  <span>{beneficiary.phone}</span>
                </div>
              )}
            </div>

            <div className="mt-4 text-sm text-gray-500">
              Ajouté le {creationDate}
            </div>
          </div>

          <div className="flex space-x-2 ml-4">
            <button
              onClick={() => onEdit(beneficiary)}
              className="px-3 py-1 text-sm text-[hsl(25,100%,53%)] hover:bg-[hsl(25,100%,53%)]/10 rounded-lg transition-colors flex items-center"
            >
              <Edit className="h-4 w-4 mr-1" />
              Modifier
            </button>
            <button
              onClick={() => {
                const beneficiaryId = beneficiary._id || beneficiary.id;
                if (beneficiaryId) onDelete(beneficiaryId);
              }}
              className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Supprimer
            </button>
          </div>
        </div>
      </div>
    );
  },
);

BeneficiaryCard.displayName = "BeneficiaryCard";

export default BeneficiaryCard;
