"use client";
import { Eye, EyeOff } from "lucide-react";
import { useEffect, useState } from "react";

interface BookingData {
  requester: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  recipient: {
    firstName: string;
    lastName: string;
    phone: string;
  };
  country: string;
  address1: string;
  address2?: string;
  postalCode: string;
  city: string;
}

interface PopupRegisterFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function PopupRegisterForm({
  onClose,
  onSuccess,
}: PopupRegisterFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    countryOfResidence: "",
    address1: "",
    address2: "",
    postalCode: "",
    city: "",
    password: "",
    confirmPassword: "",
    securityQuestion: "",
    securityAnswer: "",
    termsAccepted: false,
    marketingConsent: false,
  });

  // Récupérer les données de booking depuis localStorage
  useEffect(() => {
    const bookingData = localStorage.getItem("bookingData");
    if (bookingData) {
      try {
        const parsedData: BookingData = JSON.parse(bookingData);
        setFormData(prev => ({
          ...prev,
          firstName: parsedData.requester.firstName,
          lastName: parsedData.requester.lastName,
          email: parsedData.requester.email,
          phone: parsedData.requester.phone,
          countryOfResidence: parsedData.country,
          address1: parsedData.address1,
          address2: parsedData.address2 || "",
          postalCode: parsedData.postalCode,
          city: parsedData.city,
        }));
      } catch (error) {
        console.error("Error parsing booking data:", error);
      }
    }
  }, []);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    return (
      formData.firstName &&
      formData.lastName &&
      formData.email &&
      formData.phone &&
      formData.countryOfResidence &&
      formData.address1 &&
      formData.postalCode &&
      formData.city &&
      formData.password &&
      formData.confirmPassword &&
      formData.password === formData.confirmPassword &&
      formData.securityQuestion &&
      formData.securityAnswer &&
      formData.termsAccepted
    );
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setError(null);
    setIsLoading(true);

    try {
      const submitData = {
        ...formData,
        isSimplifiedRegistration: true,
      };

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData),
      });

      const result = await res.json();

      if (res.ok) {
        // Nettoyer les données de booking du localStorage
        localStorage.removeItem("bookingData");
        // Appeler le callback de succès
        onSuccess();
        // Fermer la popup
        onClose();
      } else {
        setError(result.error || "Erreur lors de l'inscription");
      }
    } catch {
      setError("Erreur réseau ou serveur");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-[hsl(23,100%,53%)] to-[hsl(41,86%,46%)] text-white p-6 text-center rounded-t-2xl">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white hover:text-gray-200 transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
          <h1 className="text-xl font-bold mb-2">
            Finalisez votre inscription
          </h1>
          <p className="text-sm opacity-90">
            Complétez votre profil pour continuer votre réservation
          </p>
        </div>

        {/* Form Container */}
        <div className="p-6">
          {/* Success Message */}
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <div className="text-green-600 text-lg mr-2">✅</div>
              <div>
                <h3 className="text-green-800 font-semibold text-sm">
                  Paiement réussi !
                </h3>
                <p className="text-green-700 text-xs">
                  Votre réservation a été confirmée. Finalisez votre inscription
                  pour continuer.
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 font-semibold text-gray-700 text-sm">
                  Prénom <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={e => handleInputChange("firstName", e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-sm"
                  placeholder="Votre prénom"
                />
              </div>
              <div>
                <label className="block mb-1 font-semibold text-gray-700 text-sm">
                  Nom <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={e => handleInputChange("lastName", e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-sm"
                  placeholder="Votre nom"
                />
              </div>
            </div>

            <div>
              <label className="block mb-1 font-semibold text-gray-700 text-sm">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={e => handleInputChange("email", e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-sm"
                placeholder="exemple@email.com"
              />
            </div>

            <div>
              <label className="block mb-1 font-semibold text-gray-700 text-sm">
                Téléphone <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={e => handleInputChange("phone", e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-sm"
                placeholder="Votre numéro"
              />
            </div>

            <div>
              <label className="block mb-1 font-semibold text-gray-700 text-sm">
                Pays de résidence <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.countryOfResidence}
                onChange={e =>
                  handleInputChange("countryOfResidence", e.target.value)
                }
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-sm"
              >
                <option value="">Sélectionnez votre pays</option>
                <option value="france">France</option>
                <option value="germany">Allemagne</option>
                <option value="italy">Italie</option>
                <option value="spain">Espagne</option>
                <option value="uk">Royaume-Uni</option>
                <option value="other">Autre</option>
              </select>
            </div>

            <div>
              <label className="block mb-1 font-semibold text-gray-700 text-sm">
                Adresse 1 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.address1}
                onChange={e => handleInputChange("address1", e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-sm"
                placeholder="Votre adresse principale"
              />
            </div>

            <div>
              <label className="block mb-1 font-semibold text-gray-700 text-sm">
                Adresse 2 (optionnel)
              </label>
              <input
                type="text"
                value={formData.address2}
                onChange={e => handleInputChange("address2", e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-sm"
                placeholder="Complément d'adresse"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 font-semibold text-gray-700 text-sm">
                  Code postal <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.postalCode}
                  onChange={e =>
                    handleInputChange("postalCode", e.target.value)
                  }
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-sm"
                  placeholder="Code postal"
                />
              </div>
              <div>
                <label className="block mb-1 font-semibold text-gray-700 text-sm">
                  Ville <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={e => handleInputChange("city", e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-sm"
                  placeholder="Votre ville"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 font-semibold text-gray-700 text-sm">
                  Mot de passe <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={e =>
                      handleInputChange("password", e.target.value)
                    }
                    className="w-full p-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-sm"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
              <div>
                <label className="block mb-1 font-semibold text-gray-700 text-sm">
                  Confirmer le mot de passe{" "}
                  <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={e =>
                      handleInputChange("confirmPassword", e.target.value)
                    }
                    className="w-full p-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-sm"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="block mb-1 font-semibold text-gray-700 text-sm">
                Question de sécurité <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.securityQuestion}
                onChange={e =>
                  handleInputChange("securityQuestion", e.target.value)
                }
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-sm"
              >
                <option value="">Choisissez une question</option>
                <option value="pet">
                  Nom de votre premier animal de compagnie ?
                </option>
                <option value="school">Nom de votre école primaire ?</option>
                <option value="mother">
                  Nom de jeune fille de votre mère ?
                </option>
                <option value="city">Ville de naissance de votre père ?</option>
              </select>
            </div>

            <div>
              <label className="block mb-1 font-semibold text-gray-700 text-sm">
                Réponse <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.securityAnswer}
                onChange={e =>
                  handleInputChange("securityAnswer", e.target.value)
                }
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-sm"
                placeholder="Votre réponse"
              />
            </div>

            <div className="space-y-3">
              <label className="flex items-start space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.termsAccepted}
                  onChange={e =>
                    handleInputChange("termsAccepted", e.target.checked)
                  }
                  className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-xs text-gray-700">
                  J&apos;accepte les{" "}
                  <a href="#" className="text-blue-600 hover:underline">
                    conditions générales d&apos;utilisation
                  </a>{" "}
                  et la{" "}
                  <a href="#" className="text-blue-600 hover:underline">
                    politique de confidentialité
                  </a>{" "}
                  de DiaspoMoney <span className="text-red-500">*</span>
                </span>
              </label>

              <label className="flex items-start space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.marketingConsent}
                  onChange={e =>
                    handleInputChange("marketingConsent", e.target.checked)
                  }
                  className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-xs text-gray-700">
                  Je souhaite recevoir des informations sur les nouveaux
                  services et promotions DiaspoMoney
                </span>
              </label>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-2 bg-red-50 border border-red-200 rounded-md">
                <p className="text-xs text-red-600 font-medium">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-center pt-4">
              <button
                onClick={handleSubmit}
                disabled={isLoading || !validateForm()}
                className="w-full py-3 rounded-lg bg-gradient-to-r from-[hsl(23,100%,53%)] to-[hsl(41,86%,46%)] text-white font-bold shadow-lg hover:from-blue-700 hover:to-indigo-800 transition-all duration-200 transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Création du compte..." : "Créer mon compte"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
