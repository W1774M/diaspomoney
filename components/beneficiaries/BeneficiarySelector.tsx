"use client";

import { useBeneficiaries } from "@/hooks/beneficiaries/useBeneficiaries";
import { AlertCircle, Check, Loader2, User, UserPlus } from "lucide-react";
import { useState } from "react";

interface BeneficiarySelectorProps {
  selectedBeneficiaries: string[];
  onSelectionChange: (beneficiaryIds: string[]) => void;
  onAddNew?: (beneficiaryData: any) => void;
}

export default function BeneficiarySelector({
  selectedBeneficiaries,
  onSelectionChange,
  onAddNew,
}: BeneficiarySelectorProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { beneficiaries, loading, error, createBeneficiary } =
    useBeneficiaries();

  const handleBeneficiaryToggle = (beneficiaryId: string) => {
    const isSelected = selectedBeneficiaries.includes(beneficiaryId);
    if (isSelected) {
      onSelectionChange(
        selectedBeneficiaries.filter(id => id !== beneficiaryId),
      );
    } else {
      onSelectionChange([...selectedBeneficiaries, beneficiaryId]);
    }
  };

  const handleAddBeneficiary = async (formData: any) => {
    setIsSubmitting(true);
    try {
      const result = await createBeneficiary({
        name: formData.name,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        relationship: formData.relationship,
      });

      if (result) {
        // Ajouter automatiquement à la sélection
        const beneficiaryId = result._id || result.id;
        if (beneficiaryId) {
          onSelectionChange([...selectedBeneficiaries, beneficiaryId]);
        }
        if (onAddNew) onAddNew(result);
        setShowAddForm(false);
        // Reset form
        const form = document.querySelector("form") as HTMLFormElement;
        if (form) form.reset();
      }
    } catch (error) {
      console.error("Erreur lors de l'ajout:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Affichage de l'erreur
  if (error) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
        <p className="text-sm text-gray-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Sélectionner les bénéficiaires
        </h3>
        <button
          onClick={() => setShowAddForm(true)}
          className="text-[hsl(25,100%,53%)] hover:text-[hsl(25,100%,48%)] flex items-center text-sm"
        >
          <UserPlus className="h-4 w-4 mr-1" />
          Ajouter un nouveau
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-[hsl(25,100%,53%)]" />
          <span className="ml-2 text-sm text-gray-600">Chargement...</span>
        </div>
      )}

      {/* Beneficiaries List */}
      {!loading && (
        <div className="space-y-2">
          {beneficiaries.map(beneficiary => {
            const beneficiaryId = beneficiary._id || beneficiary.id || '';
            const isSelected = beneficiaryId && selectedBeneficiaries.includes(beneficiaryId);

            return (
              <div
                key={beneficiaryId}
                onClick={() => beneficiaryId && handleBeneficiaryToggle(beneficiaryId)}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  isSelected
                    ? "border-[hsl(25,100%,53%)] bg-[hsl(25,100%,53%)]/5"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center">
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center mr-3 ${
                      isSelected
                        ? "border-[hsl(25,100%,53%)] bg-[hsl(25,100%,53%)]"
                        : "border-gray-300"
                    }`}
                  >
                    {isSelected && <Check className="h-3 w-3 text-white" />}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center">
                      <User className="h-5 w-5 text-gray-400 mr-2" />
                      <span className="font-medium text-gray-900">
                        {beneficiary.name}
                      </span>
                      <span className="ml-2 text-sm text-gray-500">
                        ({beneficiary.relationship})
                      </span>
                    </div>

                    <div className="mt-1 text-sm text-gray-600">
                      {beneficiary.email && <span>{beneficiary.email}</span>}
                      {beneficiary.phone && <span>{beneficiary.phone}</span>}
                    </div>

                    <div className="mt-1">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          beneficiary.hasAccount
                            ? "bg-green-100 text-green-800"
                            : "bg-orange-100 text-orange-800"
                        }`}
                      >
                        {beneficiary.hasAccount
                          ? "Compte actif"
                          : "Sans compte"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {!loading && beneficiaries.length === 0 && (
        <div className="text-center py-8">
          <User className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500 mb-4">
            Aucun bénéficiaire trouvé
          </p>
          <button
            onClick={() => setShowAddForm(true)}
            className="text-[hsl(25,100%,53%)] hover:text-[hsl(25,100%,48%)] text-sm"
          >
            Ajouter votre premier bénéficiaire
          </button>
        </div>
      )}

      {/* Add New Beneficiary Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Ajouter un nouveau bénéficiaire
            </h2>

            <form
              onSubmit={e => {
                e.preventDefault();
                const formData = new FormData(e.target as HTMLFormElement);
                handleAddBeneficiary(Object.fromEntries(formData));
              }}
            >
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom complet *
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Relation
                  </label>
                  <select
                    name="relationship"
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
                  onClick={() => setShowAddForm(false)}
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
                      Ajout...
                    </>
                  ) : (
                    "Ajouter et sélectionner"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
