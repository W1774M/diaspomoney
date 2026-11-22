"use client";

import { Beneficiary, BeneficiaryFormData, BeneficiaryRelationship } from "@/lib/types";
import { Loader2 } from "lucide-react";
import React, { useCallback, useState } from "react";
import { PhoneInput } from "react-international-phone";

interface BeneficiaryFormProps {
  beneficiary?: Beneficiary | null;
  onSubmit: (data: BeneficiaryFormData) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

const BeneficiaryForm = React.memo<BeneficiaryFormProps>(
  function BeneficiaryForm({ beneficiary, onSubmit, onCancel, isSubmitting }: BeneficiaryFormProps) {
    const [phone, setPhone] = useState(beneficiary?.phone || "");

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
        const postalCodeValue = (formData.get("postalCode") as string)?.trim();
        const location: BeneficiaryFormData['location'] = {
          address: (formData.get("address") as string) || "",
          city: (formData.get("city") as string) || "",
          country: (formData.get("country") as string) || "",
        };
        
        // Ajouter postalCode seulement s'il est défini et non vide
        if (postalCodeValue) {
          location.postalCode = postalCodeValue;
        }
        
        const data: BeneficiaryFormData = {
          firstName: (formData.get("firstName") as string) || "",
          lastName: (formData.get("lastName") as string) || "",
          relationship: relationship as BeneficiaryRelationship,
          location,
        };
        
        // Ajouter les propriétés optionnelles seulement si elles sont définies
        const email = (formData.get("email") as string)?.trim();
        if (email) {
          data.email = email;
        }
        
        const phoneValue = phone?.trim();
        if (phoneValue) {
          data.phone = phoneValue;
        }
        
        onSubmit(data);
      },
      [onSubmit, phone],
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
                  <label htmlFor='beneficiary-form-first-name' className="block text-sm font-medium text-gray-700 mb-1">
                    Prénom *
                  </label>
                  <input id='beneficiary-form-first-name'
                    title="Prénom"
                    type="text"
                    name="firstName"
                    required
                    defaultValue={beneficiary?.firstName || ""}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus-visible:ring-2 focus-visible:ring-brand-600 focus:border-transparent"
                  />
                </div>
                <div>
                  <label htmlFor='beneficiary-form-last-name' className="block text-sm font-medium text-gray-700 mb-1">
                    Nom *
                  </label>
                  <input id='beneficiary-form-last-name'
                    title="Nom"
                    type="text"
                    name="lastName"
                    required
                    defaultValue={beneficiary?.lastName || ""}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus-visible:ring-2 focus-visible:ring-brand-600 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label htmlFor='beneficiary-form-email' className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input id='beneficiary-form-email'
                  title="Email"
                  type="email"
                  name="email"
                  defaultValue={beneficiary?.email || ""}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus-visible:ring-2 focus-visible:ring-brand-600 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Téléphone
                </label>
                <PhoneInput
                  defaultCountry="fr"
                  value={phone}
                  onChange={(phoneValue) => setPhone(phoneValue)}
                  className="w-full"
                  inputClassName="w-full px-3 py-2 border border-gray-300 rounded-lg focus-visible:ring-2 focus-visible:ring-brand-600 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor='beneficiary-form-address' className="block text-sm font-medium text-gray-700 mb-1">
                  Adresse *
                </label>
                <input id='beneficiary-form-address'
                  title="Adresse"
                  type="text"
                  name="address"
                  required
                  defaultValue={beneficiary?.location?.address || ""}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus-visible:ring-2 focus-visible:ring-brand-600 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor='beneficiary-form-city' className="block text-sm font-medium text-gray-700 mb-1">
                    Ville *
                  </label>
                  <input id='beneficiary-form-city'
                    title="Ville"
                    type="text"
                    name="city"
                    required
                    defaultValue={beneficiary?.location?.city || ""}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus-visible:ring-2 focus-visible:ring-brand-600 focus:border-transparent"
                  />
                </div>
                <div>
                  <label htmlFor='beneficiary-form-postal-code' className="block text-sm font-medium text-gray-700 mb-1">
                    Code postal
                  </label>
                  <input id='beneficiary-form-postal-code'
                    title="Code postal"
                    type="text"
                    name="postalCode"
                    defaultValue={beneficiary?.location?.postalCode || ""}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus-visible:ring-2 focus-visible:ring-brand-600 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label htmlFor='beneficiary-form-country' className="block text-sm font-medium text-gray-700 mb-1">
                  Pays *
                </label>
                <input id='beneficiary-form-country'
                  title="Pays"
                  type="text"
                  name="country"
                  required
                  defaultValue={beneficiary?.location?.country || ""}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus-visible:ring-2 focus-visible:ring-brand-600 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor='beneficiary-form-relationship' className="block text-sm font-medium text-gray-700 mb-1">
                  Relation *
                </label>
                <select id='beneficiary-form-relationship'
                  title="Relation"
                  name="relationship"
                  required
                  defaultValue={beneficiary?.relationship || ""}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus-visible:ring-2 focus-visible:ring-brand-600 focus:border-transparent"
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
                className="flex-1 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
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
