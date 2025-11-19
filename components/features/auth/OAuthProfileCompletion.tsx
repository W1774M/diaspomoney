"use client";

import { Button } from "@/components/ui/Button";
import { useNotificationManager } from "@/components/ui/Notification";
import { useState } from "react";

interface OAuthProfileCompletionProps {
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
  onComplete: () => void;
}

export function OAuthProfileCompletion({
  user,
  onComplete,
}: OAuthProfileCompletionProps) {
  const [formData, setFormData] = useState({
    phone: "",
    countryOfResidence: "",
    targetCountry: "",
    targetCity: "",
    monthlyBudget: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const { addError, addSuccess } = useNotificationManager();

  const countries = [
    "France",
    "Belgique",
    "Suisse",
    "Canada",
    "États-Unis",
    "Royaume-Uni",
    "Allemagne",
    "Espagne",
    "Italie",
    "Pays-Bas",
    "Suède",
    "Norvège",
  ];

  const targetCountries = [
    "Sénégal",
    "Côte d'Ivoire",
    "Cameroun",
    "Mali",
    "Burkina Faso",
    "Niger",
    "Tchad",
    "Guinée",
    "Sierra Leone",
    "Liberia",
  ];

  const cities = {
    Sénégal: ["Dakar", "Thiès", "Kaolack", "Saint-Louis", "Ziguinchor"],
    "Côte d'Ivoire": [
      "Abidjan",
      "Bouaké",
      "Daloa",
      "Yamoussoukro",
      "San-Pédro",
    ],
    Cameroun: ["Douala", "Yaoundé", "Bamenda", "Bafoussam", "Garoua"],
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/complete-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la mise à jour du profil");
      }

      addSuccess("Profil complété avec succès !");
      onComplete();
    } catch (error) {
      console.error("Erreur:", error);
      addError("Erreur lors de la mise à jour du profil");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    addSuccess(
      "Connexion réussie ! Vous pourrez compléter votre profil plus tard.",
    );
    onComplete();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-blue-50 py-8">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">✅</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Bienvenue {user.firstName} !
            </h1>
            <p className="text-gray-600">
              Votre compte a été créé avec succès. Complétez votre profil pour
              une meilleure expérience.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Téléphone (optionnel)
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={e =>
                  setFormData(prev => ({ ...prev, phone: e.target.value }))
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent"
                placeholder="+33 6 12 34 56 78"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pays de résidence
              </label>
              <select
                value={formData.countryOfResidence}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    countryOfResidence: e.target.value,
                  }))
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent"
                aria-label="Pays de résidence"
              >
                <option value="">Sélectionnez votre pays</option>
                {countries.map(country => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pays cible
              </label>
              <select
                value={formData.targetCountry}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    targetCountry: e.target.value,
                    targetCity: "", // Reset city when country changes
                  }))
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent"
                aria-label="Pays cible"
              >
                <option value="">Sélectionnez le pays cible</option>
                {targetCountries.map(country => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>
            </div>

            {formData.targetCountry &&
              cities[formData.targetCountry as keyof typeof cities] && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ville cible
                  </label>
                  <select
                    value={formData.targetCity}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        targetCity: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent"
                    aria-label="Ville cible"
                  >
                    <option value="">Sélectionnez la ville</option>
                    {cities[formData.targetCountry as keyof typeof cities].map(
                      city => (
                        <option key={city} value={city}>
                          {city}
                        </option>
                      ),
                    )}
                  </select>
                </div>
              )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Budget mensuel (optionnel)
              </label>
              <select
                value={formData.monthlyBudget}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    monthlyBudget: e.target.value,
                  }))
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent"
                aria-label="Budget mensuel"
              >
                <option value="">Sélectionnez votre budget</option>
                <option value="0-500">0 - 500€</option>
                <option value="500-1000">500 - 1000€</option>
                <option value="1000-2000">1000 - 2000€</option>
                <option value="2000+">2000€+</option>
              </select>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-[hsl(25,100%,53%)] hover:bg-[hsl(25,100%,45%)] text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                {isLoading ? "Mise à jour..." : "Compléter le profil"}
              </Button>

              <Button
                type="button"
                onClick={handleSkip}
                className="flex-1 bg-gray-100 text-gray-700 hover:bg-gray-200 font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                Plus tard
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
