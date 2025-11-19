"use client";

import { BeneficiaryFormProps } from "@/types/beneficiaries";
import { Loader2 } from "lucide-react";
import React, { useCallback } from "react";

const BeneficiaryForm = React.memo<BeneficiaryFormProps>(
  function BeneficiaryForm({ beneficiary, onSubmit, onCancel, isSubmitting }) {
    const handleSubmit = useCallback(
      (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const data = {
          name: formData.get("name") as string,
          email: formData.get("email") as string,
          phone: formData.get("phone") as string,
          relationship: formData.get("relationship") as string,
        };
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom complet *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  defaultValue={beneficiary?.name || ""}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
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
                  type="tel"
                  name="phone"
                  defaultValue={beneficiary?.phone || ""}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Relation
                </label>
                <select
                  name="relationship"
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
