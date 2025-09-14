"use client";

import { useNotificationStore } from "@/store/notifications";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  HelpCircle,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Send,
  User,
} from "lucide-react";
import { useState } from "react";

export default function SupportPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addNotification } = useNotificationStore();

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (isSubmitting) return;

    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData);

    // Validation
    if (!validateSupportForm(data)) {
      return;
    }

    try {
      setIsSubmitting(true);

      // Simuler l'envoi
      await new Promise(resolve => setTimeout(resolve, 2000));

      addNotification({
        type: "success",
        message: "Demande envoyée avec succès ! Nous vous répondrons sous 24h.",
        duration: 5000,
      });

      e.currentTarget.reset();
    } catch (error) {
      addNotification({
        type: "error",
        message: "Erreur lors de l'envoi. Veuillez réessayer.",
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const validateSupportForm = (data: any) => {
    const required = ["urgency", "category", "userEmail", "message"];

    for (const field of required) {
      if (!data[field] || data[field].trim() === "") {
        addNotification({
          type: "error",
          message: "Veuillez remplir tous les champs obligatoires.",
          duration: 4000,
        });
        return false;
      }
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.userEmail)) {
      addNotification({
        type: "error",
        message: "Veuillez entrer une adresse email valide.",
        duration: 4000,
      });
      return false;
    }

    return true;
  };

  const openChat = () => {
    addNotification({
      type: "info",
      message: "Connexion au chat DiaspoMoney...",
      duration: 2000,
    });

    setTimeout(() => {
      addNotification({
        type: "success",
        message: "Chat en direct activé ! Un conseiller va vous répondre.",
        duration: 4000,
      });
    }, 1500);
  };

  const callPhone = () => {
    window.open("tel:+33651276570");
  };

  const openEmail = () => {
    const subject = "Demande de support DiaspoMoney";
    const body =
      "Bonjour,\n\nJe vous contacte concernant :\n\n[Décrivez votre demande]\n\nCordialement,";
    window.open(
      `mailto:support@diaspomoney.fr?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[hsl(25,100%,53%)] via-[hsl(25,100%,45%)] to-[hsl(25,100%,35%)] text-white py-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-white/15 px-4 py-2 rounded-full text-sm mb-6 border border-white/20">
              <MessageCircle className="w-4 h-4" />
              <span>Support Client Professionnel</span>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Centre de Support DiaspoMoney
            </h1>
            <p className="text-xl opacity-90 max-w-3xl mx-auto mb-12">
              Notre équipe dédiée vous accompagne dans tous vos transferts de
              services vers l'Afrique avec expertise et bienveillance
            </p>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 text-center">
                <div className="text-3xl font-bold mb-2">&lt; 2h</div>
                <div className="text-sm opacity-90">Temps de réponse moyen</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 text-center">
                <div className="text-3xl font-bold mb-2">4.8/5</div>
                <div className="text-sm opacity-90">Satisfaction client</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 text-center">
                <div className="text-3xl font-bold mb-2">36</div>
                <div className="text-sm opacity-90">Conseillers experts</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 text-center">
                <div className="text-3xl font-bold mb-2">24/7</div>
                <div className="text-sm opacity-90">Assistance urgence</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Slogan */}
      <section className="bg-white py-8 border-b border-gray-200">
        <div className="container mx-auto px-4 text-center">
          <p className="text-2xl font-semibold text-gray-800 italic">
            "J'envoie un service, et non l'argent !"
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        {/* Emergency Alert */}
        <div className="bg-gradient-to-r from-red-600 to-red-500 text-white p-6 rounded-2xl mb-8 text-center shadow-lg">
          <div className="flex items-center justify-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5" />
            <h3 className="text-lg font-bold">
              Urgence ou problème critique ?
            </h3>
          </div>
          <p className="mb-4">
            Notre équipe d'urgence est disponible 24h/24 pour les situations
            critiques nécessitant une intervention immédiate
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <a
              href="tel:+33651276570"
              className="bg-white/20 border border-white/30 px-6 py-3 rounded-lg font-semibold hover:bg-white/30 transition-all flex items-center gap-2"
            >
              <Phone className="w-4 h-4" />
              Appeler +33 6 51 27 65 70
            </a>
            <button
              onClick={openChat}
              className="bg-white/20 border border-white/30 px-6 py-3 rounded-lg font-semibold hover:bg-white/30 transition-all flex items-center gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              Chat Urgence
            </button>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid lg:grid-cols-3 gap-8 mb-12">
          {/* Support Methods */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-gray-800 to-gray-700 text-white p-6">
              <h2 className="text-xl font-bold mb-2">Contactez-nous</h2>
              <p className="text-sm opacity-80">
                Choisissez le canal de communication qui vous convient
              </p>
            </div>

            <div className="p-6 space-y-4">
              <div
                onClick={openChat}
                className="flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 cursor-pointer transition-all"
              >
                <div className="w-12 h-12 bg-gradient-to-r from-green-600 to-green-500 rounded-lg flex items-center justify-center text-white">
                  <MessageCircle className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">
                    Chat en direct
                  </h3>
                  <p className="text-sm text-gray-600">
                    Assistance immédiate avec nos conseillers experts
                    DiaspoMoney
                  </p>
                </div>
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-semibold">
                  En ligne
                </span>
              </div>

              <div
                onClick={callPhone}
                className="flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 cursor-pointer transition-all"
              >
                <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-blue-500 rounded-lg flex items-center justify-center text-white">
                  <Phone className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">
                    Hotline Téléphonique
                  </h3>
                  <p className="text-sm text-gray-600">
                    +33 (0) 6 51 27 65 70 • Lundi-Vendredi 9h-18h (UTC+1)
                  </p>
                </div>
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-semibold">
                  Disponible
                </span>
              </div>

              <div
                onClick={openEmail}
                className="flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 cursor-pointer transition-all"
              >
                <div className="w-12 h-12 bg-gradient-to-r from-[hsl(25,100%,53%)] to-[hsl(25,100%,45%)] rounded-lg flex items-center justify-center text-white">
                  <Mail className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">Support Email</h3>
                  <p className="text-sm text-gray-600">
                    support@diaspomoney.fr • Réponse garantie sous 24h
                  </p>
                </div>
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-semibold">
                  Disponible
                </span>
              </div>

              <div
                onClick={() => (window.location.href = "/faq")}
                className="flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 cursor-pointer transition-all"
              >
                <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-purple-500 rounded-lg flex items-center justify-center text-white">
                  <HelpCircle className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">
                    FAQ & Centre d'aide
                  </h3>
                  <p className="text-sm text-gray-600">
                    Réponses instantanées aux questions fréquentes
                  </p>
                </div>
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-semibold">
                  Disponible
                </span>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-gray-800 to-gray-700 text-white p-6">
              <h3 className="text-lg font-bold mb-2">Demande de Support</h3>
              <p className="text-sm opacity-80">
                Décrivez votre besoin, nous vous recontactons
              </p>
            </div>

            <div className="p-6">
              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Niveau d'urgence
                  </label>
                  <select
                    name="urgency"
                    className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-[hsl(25,100%,53%)] focus:ring-2 focus:ring-[hsl(25,100%,53%)]/20 transition-all"
                    required
                  >
                    <option value="">Sélectionnez...</option>
                    <option value="low">🟢 Normale (48h)</option>
                    <option value="medium">🟡 Urgente (24h)</option>
                    <option value="high">🔴 Critique (2h)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Catégorie
                  </label>
                  <select
                    name="category"
                    className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-[hsl(25,100%,53%)] focus:ring-2 focus:ring-[hsl(25,100%,53%)]/20 transition-all"
                    required
                  >
                    <option value="">Choisir une catégorie...</option>
                    <option value="service_tracking">
                      📍 Suivi de service
                    </option>
                    <option value="payment_issue">
                      💳 Problème de paiement
                    </option>
                    <option value="provider_quality">
                      ⭐ Qualité du prestataire
                    </option>
                    <option value="account_issue">👤 Problème de compte</option>
                    <option value="technical_issue">
                      🔧 Problème technique
                    </option>
                    <option value="partnership">🤝 Devenir partenaire</option>
                    <option value="other">📝 Autre demande</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Votre email
                  </label>
                  <input
                    type="email"
                    name="userEmail"
                    className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-[hsl(25,100%,53%)] focus:ring-2 focus:ring-[hsl(25,100%,53%)]/20 transition-all"
                    placeholder="votre.email@exemple.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Téléphone (optionnel)
                  </label>
                  <input
                    type="tel"
                    name="userPhone"
                    className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-[hsl(25,100%,53%)] focus:ring-2 focus:ring-[hsl(25,100%,53%)]/20 transition-all"
                    placeholder="+33 6 XX XX XX XX"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Description détaillée
                  </label>
                  <textarea
                    name="message"
                    rows={4}
                    className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-[hsl(25,100%,53%)] focus:ring-2 focus:ring-[hsl(25,100%,53%)]/20 transition-all resize-vertical"
                    placeholder="Décrivez votre demande en détail. Plus vous êtes précis, plus nous pourrons vous aider efficacement..."
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-[hsl(25,100%,53%)] to-[hsl(25,100%,45%)] text-white py-3 px-6 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Envoi en cours...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Envoyer ma demande
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Countries Section */}
        <div className="mb-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Nos Bureaux & Agences
            </h2>
            <p className="text-lg text-gray-600">
              Présents en France et en Afrique pour vous servir au plus près
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 justify-items-center">
            {/* France */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border-t-4 border-blue-600 hover:shadow-xl transition-all">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">🇫🇷</span>
                <div>
                  <h3 className="font-bold text-gray-900">
                    France - Siège Social
                  </h3>
                  <p className="text-sm text-gray-600">
                    36 conseillers disponibles • 5 villes
                  </p>
                </div>
              </div>
              <div className="space-y-3 text-sm text-gray-700">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-[hsl(25,100%,53%)] mt-0.5 flex-shrink-0" />
                  <span>
                    Seine Innopolis, 72 Rue de la République
                    <br />
                    76140 Le Petit-Quevilly
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-[hsl(25,100%,53%)] flex-shrink-0" />
                  <span>+33 (0) 6 51 27 65 70 • +33 (0) 7 58 32 05 74</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-[hsl(25,100%,53%)] flex-shrink-0" />
                  <span>contact@diaspomoney.fr</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[hsl(25,100%,53%)] flex-shrink-0" />
                  <span>Lun-Ven: 9h-18h • Sam: 10h-16h</span>
                </div>
              </div>
            </div>

            {/* Cameroun */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border-t-4 border-red-600 hover:shadow-xl transition-all">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">🇨🇲</span>
                <div>
                  <h3 className="font-bold text-gray-900">Cameroun - Douala</h3>
                  <p className="text-sm text-gray-600">
                    Country Sales Manager • 153M€/an
                  </p>
                </div>
              </div>
              <div className="space-y-3 text-sm text-gray-700">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-[hsl(25,100%,53%)] mt-0.5 flex-shrink-0" />
                  <span>
                    Centre-ville, Douala
                    <br />
                    Capital économique
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-[hsl(25,100%,53%)] flex-shrink-0" />
                  <span>Contact local disponible</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-[hsl(25,100%,53%)] flex-shrink-0" />
                  <span>douala@diaspomoney.fr</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-[hsl(25,100%,53%)] flex-shrink-0" />
                  <span>1% contribution au PIB national</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sénégal */}
        {/* <div className="bg-white rounded-2xl p-6 shadow-lg border-t-4 border-green-600 hover:shadow-xl transition-all">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">🇸🇳</span>
                <div>
                  <h3 className="font-bold text-gray-900">Sénégal - Dakar</h3>
                  <p className="text-sm text-gray-600">Country Sales Manager • 446M€/an</p>
                </div>
              </div>
              <div className="space-y-3 text-sm text-gray-700">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-[hsl(25,100%,53%)] mt-0.5 flex-shrink-0" />
                  <span>Centre-ville, Dakar<br />Plateau des affaires</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-[hsl(25,100%,53%)] flex-shrink-0" />
                  <span>Contact local disponible</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-[hsl(25,100%,53%)] flex-shrink-0" />
                  <span>dakar@diaspomoney.fr</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-[hsl(25,100%,53%)] flex-shrink-0" />
                  <span>9,4% contribution au PIB national</span>
                </div>
              </div>
            </div> */}

        {/* Côte d'Ivoire */}
        {/* <div className="bg-white rounded-2xl p-6 shadow-lg border-t-4 border-[hsl(25,100%,53%)] hover:shadow-xl transition-all">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">🇨🇮</span>
                <div>
                  <h3 className="font-bold text-gray-900">
                    Côte d'Ivoire - Abidjan
                  </h3>
                  <p className="text-sm text-gray-600">
                    Country Sales Manager • 375M€/an
                  </p>
                </div>
              </div>
              <div className="space-y-3 text-sm text-gray-700">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-[hsl(25,100%,53%)] mt-0.5 flex-shrink-0" />
                  <span>
                    Plateau, Abidjan
                    <br />
                    District autonome
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-[hsl(25,100%,53%)] flex-shrink-0" />
                  <span>Contact local disponible</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-[hsl(25,100%,53%)] flex-shrink-0" />
                  <span>abidjan@diaspomoney.fr</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-[hsl(25,100%,53%)] flex-shrink-0" />
                  <span>5,4% contribution au PIB national</span>
                </div>
              </div>
            </div> */}

        {/* FAQ Section */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-gray-800 to-gray-700 text-white p-6">
            <h2 className="text-xl font-bold mb-2">
              Centre d'aide DiaspoMoney
            </h2>
            <p className="text-sm opacity-80">
              Trouvez rapidement des réponses à vos questions
            </p>
          </div>

          <div className="p-6">
            <div className="relative mb-6">
              <input
                type="text"
                placeholder="Tapez votre question..."
                className="w-full p-4 pl-12 border-2 border-gray-300 rounded-lg focus:border-[hsl(25,100%,53%)] focus:ring-2 focus:ring-[hsl(25,100%,53%)]/20 transition-all"
              />
              <HelpCircle className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div
                onClick={() => (window.location.href = "/faq#inscription")}
                className="text-center p-6 border-2 border-gray-300 rounded-lg hover:border-[hsl(25,100%,53%)] hover:bg-[hsl(25,100%,53%)]/5 cursor-pointer transition-all"
              >
                <User className="w-8 h-8 text-[hsl(25,100%,53%)] mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 mb-1">
                  Inscription
                </h3>
                <p className="text-sm text-gray-600">Créer un compte</p>
              </div>

              <div
                onClick={() => (window.location.href = "/faq#services")}
                className="text-center p-6 border-2 border-gray-300 rounded-lg hover:border-[hsl(25,100%,53%)] hover:bg-[hsl(25,100%,53%)]/5 cursor-pointer transition-all"
              >
                <HelpCircle className="w-8 h-8 text-[hsl(25,100%,53%)] mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 mb-1">Services</h3>
                <p className="text-sm text-gray-600">Commander & suivre</p>
              </div>

              <div
                onClick={() => (window.location.href = "/faq#paiements")}
                className="text-center p-6 border-2 border-gray-300 rounded-lg hover:border-[hsl(25,100%,53%)] hover:bg-[hsl(25,100%,53%)]/5 cursor-pointer transition-all"
              >
                <CheckCircle className="w-8 h-8 text-[hsl(25,100%,53%)] mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 mb-1">Paiements</h3>
                <p className="text-sm text-gray-600">Moyens & sécurité</p>
              </div>

              <div
                onClick={() => (window.location.href = "/faq#prestataires")}
                className="text-center p-6 border-2 border-gray-300 rounded-lg hover:border-[hsl(25,100%,53%)] hover:bg-[hsl(25,100%,53%)]/5 cursor-pointer transition-all"
              >
                <User className="w-8 h-8 text-[hsl(25,100%,53%)] mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 mb-1">
                  Prestataires
                </h3>
                <p className="text-sm text-gray-600">Qualité & garanties</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Chat Widget */}
      <div
        onClick={openChat}
        className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-r from-[hsl(25,100%,53%)] to-[hsl(25,100%,45%)] rounded-full flex items-center justify-center text-white cursor-pointer shadow-xl hover:scale-110 transition-all z-50"
        title="Chat en direct avec DiaspoMoney"
      >
        <MessageCircle className="w-6 h-6" />
      </div>
    </div>
  );
}
