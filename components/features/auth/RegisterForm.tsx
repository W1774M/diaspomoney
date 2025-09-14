"use client";
import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function RegisterForm() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    countryOfResidence: "",
    targetCountry: "",
    targetCity: "",
    monthlyBudget: "",
    password: "",
    confirmPassword: "",
    securityQuestion: "",
    securityAnswer: "",
    termsAccepted: false,
    marketingConsent: false,
    kycConsent: false,
  });

  const totalSteps = 4;

  // Données des villes par pays
  const cities = {
    senegal: [
      "Dakar",
      "Thiès",
      "Kaolack",
      "Saint-Louis",
      "Ziguinchor",
      "Diourbel",
      "Tambacounda",
    ],
    "cote-ivoire": [
      "Abidjan",
      "Bouaké",
      "Daloa",
      "Yamoussoukro",
      "San-Pédro",
      "Korhogo",
      "Man",
    ],
    cameroon: [
      "Douala",
      "Yaoundé",
      "Bamenda",
      "Bafoussam",
      "Garoua",
      "Maroua",
      "Ngaoundéré",
    ],
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleServiceToggle = (service: string) => {
    setSelectedServices(prev =>
      prev.includes(service)
        ? prev.filter(s => s !== service)
        : [...prev, service]
    );
  };

  const validateCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return (
          formData.firstName &&
          formData.lastName &&
          formData.email &&
          formData.phone &&
          formData.dateOfBirth &&
          formData.countryOfResidence
        );
      case 2:
        return (
          formData.targetCountry &&
          formData.targetCity &&
          selectedServices.length > 0
        );
      case 3:
        return (
          formData.password &&
          formData.confirmPassword &&
          formData.password === formData.confirmPassword &&
          formData.securityQuestion &&
          formData.securityAnswer &&
          formData.termsAccepted &&
          formData.kycConsent
        );
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      if (currentStep < totalSteps - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        handleSubmit();
      }
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!validateCurrentStep()) return;

    setError(null);
    setIsLoading(true);

    try {
      const submitData = {
        ...formData,
        selectedServices: selectedServices.join(","),
      };

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData),
      });

      const result = await res.json();

      if (res.ok) {
        setCurrentStep(4); // Afficher l'étape de succès
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
          <div className="relative bg-gradient-to-r from-gray-800 to-blue-600 text-white p-8 text-center">
            <div className='absolute inset-0 bg-[url(&apos;data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="0.5"/></pattern></defs><rect width="100" height="100" fill="url(%23grid)"/></svg>&apos;)] opacity-30'></div>
            <div className="relative z-10">
              <h1 className="text-2xl font-bold mb-2">Rejoignez DiaspoMoney</h1>
              <p className="text-sm opacity-90">
                J'envoie un service et non l'argent
              </p>
            </div>
          </div>

          {/* Form Container */}
          <div className="p-10">
            {/* Step Indicator */}
            <div className="flex justify-center mb-8">
              {[1, 2, 3, 4].map(step => (
                <div key={step} className="flex items-center">
                  <div
                    className={`
                    w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-300
                    ${
                      step < currentStep
                        ? "bg-green-500 text-white"
                        : step === currentStep
                          ? "bg-blue-600 text-white scale-110"
                          : "bg-gray-200 text-gray-600"
                    }
                  `}
                  >
                    {step === 4 ? "✓" : step}
                  </div>
                  {step < 4 && (
                    <div
                      className={`
                      w-8 h-0.5 mx-2 transition-all duration-300
                      ${step < currentStep ? "bg-green-500" : "bg-gray-200"}
                    `}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Form Steps */}
            <div className="space-y-6">
              {/* Step 1: Informations personnelles */}
              {currentStep === 1 && (
                <div className="animate-fadeIn">
                  <h3 className="text-xl font-bold text-gray-800 mb-6">
                    Informations personnelles
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block mb-2 font-semibold text-gray-700">
                        Prénom <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={e =>
                          handleInputChange("firstName", e.target.value)
                        }
                        className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 bg-gray-50 transition-all duration-300"
                        placeholder="Votre prénom"
                      />
                    </div>
                    <div>
                      <label className="block mb-2 font-semibold text-gray-700">
                        Nom <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={e =>
                          handleInputChange("lastName", e.target.value)
                        }
                        className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 bg-gray-50 transition-all duration-300"
                        placeholder="Votre nom"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block mb-2 font-semibold text-gray-700">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={e => handleInputChange("email", e.target.value)}
                      className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 bg-gray-50 transition-all duration-300"
                      placeholder="exemple@email.com"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block mb-2 font-semibold text-gray-700">
                        Téléphone <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={e =>
                          handleInputChange("phone", e.target.value)
                        }
                        className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 bg-gray-50 transition-all duration-300"
                        placeholder="Votre numéro"
                      />
                    </div>
                    <div>
                      <label className="block mb-2 font-semibold text-gray-700">
                        Date de naissance{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={formData.dateOfBirth}
                        onChange={e =>
                          handleInputChange("dateOfBirth", e.target.value)
                        }
                        className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 bg-gray-50 transition-all duration-300"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block mb-2 font-semibold text-gray-700">
                      Pays de résidence <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.countryOfResidence}
                      onChange={e =>
                        handleInputChange("countryOfResidence", e.target.value)
                      }
                      className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 bg-gray-50 transition-all duration-300"
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
                </div>
              )}

              {/* Step 2: Destination et services */}
              {currentStep === 2 && (
                <div className="animate-fadeIn">
                  <h3 className="text-xl font-bold text-gray-800 mb-6">
                    Destination et services
                  </h3>

                  <div>
                    <label className="block mb-2 font-semibold text-gray-700">
                      Pays de destination{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.targetCountry}
                      onChange={e => {
                        handleInputChange("targetCountry", e.target.value);
                        handleInputChange("targetCity", "");
                      }}
                      className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 bg-gray-50 transition-all duration-300"
                    >
                      <option value="">Sélectionnez le pays</option>
                      <option value="senegal">Sénégal</option>
                      <option value="cote-ivoire">Côte d'Ivoire</option>
                      <option value="cameroon">Cameroun</option>
                    </select>
                  </div>

                  <div>
                    <label className="block mb-2 font-semibold text-gray-700">
                      Ville de destination{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.targetCity}
                      onChange={e =>
                        handleInputChange("targetCity", e.target.value)
                      }
                      className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 bg-gray-50 transition-all duration-300"
                      disabled={!formData.targetCountry}
                    >
                      <option value="">Sélectionnez d'abord un pays</option>
                      {formData.targetCountry &&
                        cities[
                          formData.targetCountry as keyof typeof cities
                        ]?.map(city => (
                          <option
                            key={city}
                            value={city.toLowerCase().replace(/\s+/g, "-")}
                          >
                            {city}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="block mb-2 font-semibold text-gray-700">
                      Services qui vous intéressent{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      {[
                        { id: "health", icon: "🏥", label: "Santé" },
                        { id: "education", icon: "🎓", label: "Éducation" },
                        {
                          id: "construction",
                          icon: "🏗️",
                          label: "BTP/Immobilier",
                        },
                      ].map(service => (
                        <div
                          key={service.id}
                          onClick={() => handleServiceToggle(service.id)}
                          className={`
                            border-2 rounded-xl p-4 text-center cursor-pointer transition-all duration-300 hover:border-blue-400 hover:transform hover:-translate-y-1
                            ${
                              selectedServices.includes(service.id)
                                ? "border-blue-500 bg-blue-50"
                                : "border-gray-200 bg-gray-50"
                            }
                          `}
                        >
                          <div className="text-2xl mb-2">{service.icon}</div>
                          <div className="font-medium">{service.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block mb-2 font-semibold text-gray-700">
                      Budget mensuel estimé
                    </label>
                    <select
                      value={formData.monthlyBudget}
                      onChange={e =>
                        handleInputChange("monthlyBudget", e.target.value)
                      }
                      className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 bg-gray-50 transition-all duration-300"
                    >
                      <option value="">Optionnel</option>
                      <option value="0-100">0 - 100€</option>
                      <option value="100-300">100 - 300€</option>
                      <option value="300-500">300 - 500€</option>
                      <option value="500-1000">500 - 1000€</option>
                      <option value="1000+">Plus de 1000€</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Step 3: Sécurité et conditions */}
              {currentStep === 3 && (
                <div className="animate-fadeIn">
                  <h3 className="text-xl font-bold text-gray-800 mb-6">
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
                      Question de sécurité{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <select
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
                      <option value="school">
                        Nom de votre école primaire ?
                      </option>
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
                        J'accepte les{" "}
                        <a href="#" className="text-blue-600 hover:underline">
                          conditions générales d'utilisation
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
                          handleInputChange(
                            "marketingConsent",
                            e.target.checked
                          )
                        }
                        className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">
                        Je souhaite recevoir des informations sur les nouveaux
                        services et promotions DiaspoMoney
                      </span>
                    </label>

                    <label className="flex items-start space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.kycConsent}
                        onChange={e =>
                          handleInputChange("kycConsent", e.target.checked)
                        }
                        className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">
                        J'autorise DiaspoMoney à vérifier mon identité dans le
                        cadre de la réglementation KYC (Know Your Customer){" "}
                        <span className="text-red-500">*</span>
                      </span>
                    </label>
                  </div>
                </div>
              )}

              {/* Step 4: Confirmation */}
              {currentStep === 4 && (
                <div className="text-center py-8 animate-fadeIn">
                  <div className="text-6xl mb-6">🎉</div>
                  <h3 className="text-2xl font-bold text-green-600 mb-4">
                    Compte créé avec succès !
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Bienvenue dans la famille DiaspoMoney ! Un email de
                    confirmation a été envoyé à votre adresse.
                  </p>
                  <div className="text-sm text-gray-500 mb-8 space-y-2">
                    <p>
                      <strong>Prochaines étapes :</strong>
                    </p>
                    <p>1. Vérifiez votre email</p>
                    <p>2. Complétez votre profil KYC</p>
                    <p>3. Commencez à envoyer des services</p>
                  </div>
                  <button
                    onClick={() => router.push("/dashboard")}
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white font-bold text-lg shadow-lg hover:from-blue-700 hover:to-indigo-800 transition-all duration-200 transform hover:-translate-y-1"
                  >
                    Accéder à mon compte
                  </button>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600 font-medium">{error}</p>
                </div>
              )}

              {/* Navigation Buttons */}
              {currentStep < 4 && (
                <div className="flex justify-between mt-8">
                  <button
                    onClick={handlePrev}
                    disabled={currentStep === 1}
                    className="px-6 py-3 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition-all duration-200 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span>←</span>
                    <span>Précédent</span>
                  </button>

                  <button
                    onClick={handleNext}
                    disabled={isLoading || !validateCurrentStep()}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white font-bold shadow-lg hover:from-blue-700 hover:to-indigo-800 transition-all duration-200 flex items-center space-x-2 transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span>
                      {currentStep === 3 ? "Créer mon compte" : "Suivant"}
                    </span>
                    <span>→</span>
                  </button>
                </div>
              )}
            </div>

            {/* Footer */}
            {currentStep === 1 && (
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
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
}
