"use client";

import { ArrowLeft, CreditCard, Eye, EyeOff, Shield } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface CardFormData {
  cardNumber: string;
  cardholderName: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  isDefault: boolean;
}

export default function NewCardPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<CardFormData>({
    cardNumber: "",
    cardholderName: "",
    expiryMonth: "",
    expiryYear: "",
    cvv: "",
    isDefault: false,
  });
  const [saving, setSaving] = useState(false);
  const [showCvv, setShowCvv] = useState(false);

  const handleInputChange = (
    field: keyof CardFormData,
    value: string | boolean
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(" ");
    } else {
      return v;
    }
  };

  const handleCardNumberChange = (value: string) => {
    const formatted = formatCardNumber(value);
    handleInputChange("cardNumber", formatted);
  };

  const getCardBrand = (cardNumber: string) => {
    const number = cardNumber.replace(/\s/g, "");
    if (number.startsWith("4")) return "Visa";
    if (number.startsWith("5")) return "Mastercard";
    if (number.startsWith("34") || number.startsWith("37"))
      return "American Express";
    if (number.startsWith("6")) return "Discover";
    return "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Simulation d'une requête API
      await new Promise(resolve => setTimeout(resolve, 1000));

      console.log("Carte ajoutée:", formData);
      alert("Carte bancaire ajoutée avec succès !");
      router.push("/dashboard/payments");
    } catch (error) {
      console.error("Erreur lors de l'ajout:", error);
      alert("Erreur lors de l'ajout de la carte");
    } finally {
      setSaving(false);
    }
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear + i);
  const months = Array.from({ length: 12 }, (_, i) =>
    String(i + 1).padStart(2, "0")
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link
                href="/dashboard/payments"
                className="flex items-center text-gray-500 hover:text-gray-700 mr-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour aux moyens de paiement
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">
                Ajouter une carte bancaire
              </h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow border border-gray-200">
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Informations de la carte */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Informations de la carte
                </h2>

                <div className="space-y-4">
                  {/* Numéro de carte */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Numéro de carte *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formData.cardNumber}
                        onChange={e => handleCardNumberChange(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent pr-12"
                        placeholder="1234 5678 9012 3456"
                        maxLength={19}
                        required
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <CreditCard className="h-5 w-5 text-gray-400" />
                      </div>
                    </div>
                    {formData.cardNumber && (
                      <p className="text-sm text-gray-500 mt-1">
                        Type: {getCardBrand(formData.cardNumber)}
                      </p>
                    )}
                  </div>

                  {/* Nom du titulaire */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nom du titulaire *
                    </label>
                    <input
                      type="text"
                      value={formData.cardholderName}
                      onChange={e =>
                        handleInputChange("cardholderName", e.target.value)
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent"
                      placeholder="Jean Dupont"
                      required
                    />
                  </div>

                  {/* Date d'expiration et CVV */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Date d'expiration *
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <select
                          value={formData.expiryMonth}
                          onChange={e =>
                            handleInputChange("expiryMonth", e.target.value)
                          }
                          className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent"
                          required
                        >
                          <option value="">Mois</option>
                          {months.map(month => (
                            <option key={month} value={month}>
                              {month}
                            </option>
                          ))}
                        </select>
                        <select
                          value={formData.expiryYear}
                          onChange={e =>
                            handleInputChange("expiryYear", e.target.value)
                          }
                          className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent"
                          required
                        >
                          <option value="">Année</option>
                          {years.map(year => (
                            <option key={year} value={year}>
                              {year}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Code de sécurité (CVV) *
                      </label>
                      <div className="relative">
                        <input
                          type={showCvv ? "text" : "password"}
                          value={formData.cvv}
                          onChange={e =>
                            handleInputChange("cvv", e.target.value)
                          }
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent pr-12"
                          placeholder="123"
                          maxLength={4}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowCvv(!showCvv)}
                          className="absolute inset-y-0 right-0 flex items-center pr-3"
                        >
                          {showCvv ? (
                            <EyeOff className="h-5 w-5 text-gray-400" />
                          ) : (
                            <Eye className="h-5 w-5 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Carte par défaut */}
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isDefault"
                      checked={formData.isDefault}
                      onChange={e =>
                        handleInputChange("isDefault", e.target.checked)
                      }
                      className="h-4 w-4 text-[hsl(25,100%,53%)] focus:ring-[hsl(25,100%,53%)] border-gray-300 rounded"
                    />
                    <label
                      htmlFor="isDefault"
                      className="ml-2 text-sm text-gray-700"
                    >
                      Définir comme carte par défaut
                    </label>
                  </div>
                </div>
              </div>

              {/* Aperçu de la carte */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
                <div className="flex items-center justify-between mb-4">
                  <CreditCard className="h-8 w-8" />
                  <span className="text-sm opacity-75">
                    {getCardBrand(formData.cardNumber) || "Carte"}
                  </span>
                </div>
                <div className="mb-4">
                  <div className="text-lg font-mono mb-2">
                    {formData.cardNumber || "•••• •••• •••• ••••"}
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div>
                      <div className="opacity-75">Titulaire</div>
                      <div className="font-medium">
                        {formData.cardholderName || "NOM PRÉNOM"}
                      </div>
                    </div>
                    <div>
                      <div className="opacity-75">Expire</div>
                      <div className="font-medium">
                        {formData.expiryMonth && formData.expiryYear
                          ? `${formData.expiryMonth}/${formData.expiryYear}`
                          : "MM/AA"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sécurité */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <Shield className="h-5 w-5 text-blue-600 mt-0.5 mr-3" />
                  <div>
                    <h3 className="text-sm font-medium text-blue-900">
                      Sécurité garantie
                    </h3>
                    <p className="text-sm text-blue-700 mt-1">
                      Vos informations de carte sont chiffrées et sécurisées.
                      Nous ne stockons jamais votre numéro de carte complet.
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                <Link
                  href="/dashboard/payments"
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </Link>
                <button
                  type="submit"
                  disabled={
                    saving ||
                    !formData.cardNumber ||
                    !formData.cardholderName ||
                    !formData.expiryMonth ||
                    !formData.expiryYear ||
                    !formData.cvv
                  }
                  className="px-6 py-2 bg-[hsl(25,100%,53%)] text-white rounded-lg hover:bg-[hsl(25,90%,48%)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? "Ajout en cours..." : "Ajouter la carte"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
