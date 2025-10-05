"use client";
import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
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

interface SimplifiedRegisterFormProps {
  onSuccess?: () => void;
}

export function SimplifiedRegisterForm({
  onSuccess,
}: SimplifiedRegisterFormProps) {
  const router = useRouter();
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
        // Normaliser le pays pour correspondre aux options du select
        const normalizedCountry = parsedData.country || "";
        setFormData(prev => ({
          ...prev,
          firstName: parsedData.requester.firstName,
          lastName: parsedData.requester.lastName,
          email: parsedData.requester.email,
          phone: parsedData.requester.phone,
          countryOfResidence: normalizedCountry,
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
        clearBookingData: true,
      };

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData),
      });

      const result = await res.json();

      if (res.ok) {
        localStorage.removeItem("bookingData");

        // Si on est dans une popup, notifier la fenêtre parent
        if (window.opener) {
          // Envoyer un message à la fenêtre parent pour indiquer que l'inscription a réussi
          window.opener.postMessage({ type: "REGISTRATION_SUCCESS" }, "*");
        }

        if (onSuccess) {
          onSuccess();
        } else {
          router.push("/dashboard");
        }
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-blue-50 py-8 px-4">
      <div className="w-full max-w-2xl mx-auto">
        <div className="backdrop-blur-md bg-white/70 border-0 shadow-xl rounded-3xl overflow-hidden">
          {/* Header */}
          <div className="relative bg-gradient-to-r from-[hsl(23,100%,53%)] to-[hsl(41,86%,46%)] text-white p-8 text-center">
            <div className="relative z-10">
              <h1 className="text-2xl font-bold mb-2">
                Finalisez votre inscription
              </h1>
              <p className="text-sm opacity-90">
                Complétez votre profil pour accéder à votre compte
              </p>
            </div>
          </div>

          {/* Form Container */}
          <div className="p-10">
            {/* Success Message */}
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center">
                <div className="text-green-600 text-2xl mr-3">✅</div>
                <div>
                  <h3 className="text-green-800 font-semibold">
                    Paiement réussi !
                  </h3>
                  <p className="text-green-700 text-sm">
                    Votre réservation a été confirmée. Finalisez votre
                    inscription pour accéder à votre compte.
                  </p>
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-gray-800 mb-6">
                Sécurité du compte
              </h3>

              <h3 className="text-xl font-bold text-gray-800 mb-6 mt-8">
                Sécurité et conditions
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2 font-semibold text-gray-700">
                    Mot de passe <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={e =>
                        handleInputChange("password", e.target.value)
                      }
                      className="w-full p-3 pr-12 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 bg-gray-50 transition-all duration-300"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block mb-2 font-semibold text-gray-700">
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
                      className="w-full p-3 pr-12 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 bg-gray-50 transition-all duration-300"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block mb-2 font-semibold text-gray-700">
                  Question de sécurité <span className="text-red-500">*</span>
                </label>
                <select
                  title="Question de sécurité"
                  value={formData.securityQuestion}
                  onChange={e =>
                    handleInputChange("securityQuestion", e.target.value)
                  }
                  className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 bg-gray-50 transition-all duration-300"
                >
                  <option value="">Choisissez une question</option>
                  <option value="pet">
                    Nom de votre premier animal de compagnie ?
                  </option>
                  <option value="school">Nom de votre école primaire ?</option>
                  <option value="mother">
                    Nom de jeune fille de votre mère ?
                  </option>
                  <option value="city">
                    Ville de naissance de votre père ?
                  </option>
                </select>
              </div>

              <div>
                <label className="block mb-2 font-semibold text-gray-700">
                  Réponse <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.securityAnswer}
                  onChange={e =>
                    handleInputChange("securityAnswer", e.target.value)
                  }
                  className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 bg-gray-50 transition-all duration-300"
                  placeholder="Votre réponse"
                />
              </div>

              <div className="space-y-4">
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.termsAccepted}
                    onChange={e =>
                      handleInputChange("termsAccepted", e.target.checked)
                    }
                    className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">
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

                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.marketingConsent}
                    onChange={e =>
                      handleInputChange("marketingConsent", e.target.checked)
                    }
                    className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">
                    Je souhaite recevoir des informations sur les nouveaux
                    services et promotions DiaspoMoney
                  </span>
                </label>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600 font-medium">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex justify-center mt-8">
                <button
                  onClick={handleSubmit}
                  disabled={isLoading || !validateForm()}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-[hsl(23,100%,53%)] to-[hsl(41,86%,46%)] text-white font-bold text-lg shadow-lg hover:from-blue-700 hover:to-indigo-800 transition-all duration-200 transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Création du compte..." : "Créer mon compte"}
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center mt-8">
              <p className="text-sm text-blue-700">
                Déjà un compte ?{" "}
                <a
                  href="/login"
                  className="font-semibold underline hover:text-indigo-700 transition-colors duration-200"
                >
                  Se connecter
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
