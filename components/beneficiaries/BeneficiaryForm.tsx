"use client";

import { Beneficiary, BeneficiaryFormData, BeneficiaryRelationship } from "@/lib/types";
import { Loader2 } from "lucide-react";
import React, { useCallback } from "react";

interface BeneficiaryFormProps {
  beneficiary?: Beneficiary | null;
  onSubmit: (data: BeneficiaryFormData) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

const BeneficiaryForm = React.memo<BeneficiaryFormProps>(
  function BeneficiaryForm({ beneficiary, onSubmit, onCancel, isSubmitting }: BeneficiaryFormProps) {
    const handleSubmit = useCallback(
      (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        
        // Mapper les valeurs de relation aux valeurs de BeneficiaryRelationship
        const relationshipMap: Record<string, BeneficiaryRelationship> = {
          'Époux/Épouse': 'SPOUSE',
          'Enfant': 'CHILD',
          'Parent': 'PARENT',
          'Frère/Sœur': 'SIBLING',
          'Ami(e)': 'FRIEND',
          'Autre': 'OTHER',
        };
        
        const relationshipValue = formData.get("relationship") as string;
        const relationship = relationshipMap[relationshipValue] || 'OTHER';
        
        // Construire l'objet en n'incluant les propriétés optionnelles que si elles sont définies
        // (exactOptionalPropertyTypes: true)
        const data: BeneficiaryFormData = {
          firstName: (formData.get("firstName") as string) || "",
          lastName: (formData.get("lastName") as string) || "",
          country: (formData.get("country") as string) || "",
          relationship: relationship as BeneficiaryRelationship,
        };
        
        // Ajouter les propriétés optionnelles seulement si elles sont définies
        const email = (formData.get("email") as string)?.trim();
        if (email) {
          data.email = email;
        }
        
        const phone = (formData.get("phone") as string)?.trim();
        if (phone) {
          data.phone = phone;
        }
        
        const address = (formData.get("address") as string)?.trim();
        if (address) {
          data.address = address;
        }
        
        onSubmit(data);
      },
      [onSubmit],
    );

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {beneficiary
              ? "Modifier le bénéficiaire"
              : "Ajouter un bénéficiaire"}
          </h2>

          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prénom *
                  </label>
                  <input
                    title="Prénom"
                    type="text"
                    name="firstName"
                    required
                    defaultValue={beneficiary?.firstName || ""}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom *
                  </label>
                  <input
                    title="Nom"
                    type="text"
                    name="lastName"
                    required
                    defaultValue={beneficiary?.lastName || ""}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  title="Email"
                  type="email"
                  name="email"
                  defaultValue={beneficiary?.email || ""}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Téléphone
                </label>
                <input
                  title="Téléphone"
                  type="tel"
                  name="phone"
                  defaultValue={beneficiary?.phone || ""}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pays *
                </label>
                <input
                  title="Pays"
                  type="text"
                  name="country"
                  required
                  defaultValue={beneficiary?.country || ""}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Adresse
                </label>
                <input
                  title="Adresse"
                  type="text"
                  name="address"
                  defaultValue={beneficiary?.address || ""}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Relation *
                </label>
                <select
                  title="Relation"
                  name="relationship"
                  required
                  defaultValue={beneficiary?.relationship || ""}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent"
                >
                  <option value="">Sélectionner une relation</option>
                  <option value="Époux/Épouse">Époux/Épouse</option>
                  <option value="Enfant">Enfant</option>
                  <option value="Parent">Parent</option>
                  <option value="Frère/Sœur">Frère/Sœur</option>
                  <option value="Ami(e)">Ami(e)</option>
                  <option value="Autre">Autre</option>
                </select>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-[hsl(25,100%,53%)] text-white rounded-lg hover:bg-[hsl(25,100%,48%)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    {beneficiary ? "Modification..." : "Ajout..."}
                  </>
                ) : beneficiary ? (
                  "Modifier"
                ) : (
                  "Ajouter"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  },
);

BeneficiaryForm.displayName = "BeneficiaryForm";

export default BeneficiaryForm;
