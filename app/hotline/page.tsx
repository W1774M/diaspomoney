"use client";


import { Phone, Mail, MessageCircle, Clock, MapPin, User, AlertTriangle, CheckCircle, Star, Headphones, Zap, Shield, Users } from "lucide-react";
import { useNotificationStore } from "@/store/notifications";

export default function HotlinePage() {
  const { addNotification } = useNotificationStore();

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
    const body = "Bonjour,\n\nJe vous contacte concernant :\n\n[Décrivez votre demande]\n\nCordialement,";
    window.open(`mailto:support@diaspomoney.fr?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  };

  return (
    <div className="min-h-dvh bg-gradient-to-br from-gray-50 via-white to-blue-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-brand-600 via-brand-700 to-brand-800 text-white py-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-white/15 px-4 py-2 rounded-full text-sm mb-6 border border-white/20">
              <Headphones className="w-4 h-4" />
              <span>Hotline DiaspoMoney</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Hotline DiaspoMoney
            </h1>
            <p className="text-xl opacity-90 max-w-3xl mx-auto mb-12">
              Assistance téléphonique directe et personnalisée pour tous vos besoins de transfert de services
            </p>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 text-center">
                <div className="text-3xl font-bold mb-2">24/7</div>
                <div className="text-sm opacity-90">Disponibilité</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 text-center">
                <div className="text-3xl font-bold mb-2">&lt; 30s</div>
                <div className="text-sm opacity-90">Temps d'attente</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 text-center">
                <div className="text-3xl font-bold mb-2">98%</div>
                <div className="text-sm opacity-90">Satisfaction</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 text-center">
                <div className="text-3xl font-bold mb-2">15</div>
                <div className="text-sm opacity-90">Conseillers</div>
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
            <h3 className="text-lg font-bold">Urgence ou problème critique ?</h3>
          </div>
          <p className="mb-4">
            Notre équipe d'urgence est disponible 24h/24 pour les situations critiques nécessitant une intervention immédiate
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

        {/* Contact Methods Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {/* Phone Support */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-brand-600 to-brand-700 text-white p-6">
              <div className="flex items-center gap-3">
                <Phone className="w-8 h-8" />
                <div>
                  <h2 className="text-xl font-bold">Support Téléphonique</h2>
                  <p className="text-sm opacity-90">Assistance directe par téléphone</p>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-brand-700 mb-2">+33 6 51 27 65 70</div>
                  <p className="text-sm text-gray-600">Numéro principal</p>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-brand-700" />
                    <span>Lundi - Vendredi : 9h - 18h (UTC+1)</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-brand-700" />
                    <span>Samedi : 10h - 16h (UTC+1)</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Zap className="w-4 h-4 text-brand-700" />
                    <span>Urgences : 24h/24</span>
                  </div>
                </div>

                <button 
                  onClick={callPhone}
                  className="w-full bg-gradient-to-r from-brand-600 to-brand-700 text-white py-3 px-6 rounded-lg font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <Phone className="w-4 h-4" />
                  Appeler maintenant
                </button>
              </div>
            </div>
          </div>

          {/* Chat Support */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-green-600 to-green-500 text-white p-6">
              <div className="flex items-center gap-3">
                <MessageCircle className="w-8 h-8" />
                <div>
                  <h2 className="text-xl font-bold">Chat en Direct</h2>
                  <p className="text-sm opacity-90">Assistance instantanée</p>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">En ligne</div>
                  <p className="text-sm text-gray-600">Conseillers disponibles</p>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="w-4 h-4 text-brand-700" />
                    <span>8 conseillers en ligne</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-brand-700" />
                    <span>Temps de réponse : &lt; 2 min</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Star className="w-4 h-4 text-brand-700" />
                    <span>Note moyenne : 4.8/5</span>
                  </div>
                </div>

                <button 
                  onClick={openChat}
                  className="w-full bg-gradient-to-r from-green-600 to-green-500 text-white py-3 px-6 rounded-lg font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  Démarrer le chat
                </button>
              </div>
            </div>
          </div>

          {/* Email Support */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-brand-600 to-brand-700 text-white p-6">
              <div className="flex items-center gap-3">
                <Mail className="w-8 h-8" />
                <div>
                  <h2 className="text-xl font-bold">Support Email</h2>
                  <p className="text-sm opacity-90">Assistance par email</p>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-brand-700 mb-2">support@diaspomoney.fr</div>
                  <p className="text-sm text-gray-600">Email principal</p>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-brand-700" />
                    <span>Réponse garantie sous 24h</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Shield className="w-4 h-4 text-brand-700" />
                    <span>Confidentialité garantie</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-brand-700" />
                    <span>Suivi de ticket</span>
                  </div>
                </div>

                <button 
                  onClick={openEmail}
                  className="w-full bg-gradient-to-r from-brand-600 to-brand-700 text-white py-3 px-6 rounded-lg font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <Mail className="w-4 h-4" />
                  Envoyer un email
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Services Offered */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-12">
          <div className="bg-gradient-to-r from-gray-800 to-gray-700 text-white p-6">
            <h2 className="text-xl font-bold mb-2">Services de la Hotline</h2>
            <p className="text-sm opacity-80">Notre équipe vous accompagne sur tous vos besoins</p>
          </div>
          
          <div className="p-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Phone className="w-5 h-5 text-brand-700" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Assistance technique</h3>
                  <p className="text-sm text-gray-600">Aide pour l'utilisation de la plateforme</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Suivi de commande</h3>
                  <p className="text-sm text-gray-600">Statut et localisation de vos services</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Shield className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Sécurité & Paiements</h3>
                  <p className="text-sm text-gray-600">Questions sur la sécurité et les paiements</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Gestion de compte</h3>
                  <p className="text-sm text-gray-600">Modification de profil et paramètres</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Résolution de problèmes</h3>
                  <p className="text-sm text-gray-600">Gestion des litiges et réclamations</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Star className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Conseils personnalisés</h3>
                  <p className="text-sm text-gray-600">Recommandations et optimisations</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Countries Section */}
        <div className="mb-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Nos Bureaux & Agences</h2>
            <p className="text-lg text-gray-600">Présents en France et en Afrique pour vous servir au plus près</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* France */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border-t-4 border-brand-600 hover:shadow-xl transition-all">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">🇫🇷</span>
                <div>
                  <h3 className="font-bold text-gray-900">France - Siège Social</h3>
                  <p className="text-sm text-gray-600">36 conseillers disponibles • 5 villes</p>
                </div>
              </div>
              <div className="space-y-3 text-sm text-gray-700">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-brand-700 mt-0.5 flex-shrink-0" />
                  <span>Seine Innopolis, 72 Rue de la République<br />76140 Le Petit-Quevilly</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-brand-700 flex-shrink-0" />
                  <span>+33 (0) 6 51 27 65 70 • +33 (0) 7 58 32 05 74</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-brand-700 flex-shrink-0" />
                  <span>contact@diaspomoney.fr</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-brand-700 flex-shrink-0" />
                  <span>Lun-Ven: 9h-18h • Sam: 10h-16h</span>
                </div>
              </div>
            </div>

            {/* Sénégal */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border-t-4 border-green-600 hover:shadow-xl transition-all">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">🇸🇳</span>
                <div>
                  <h3 className="font-bold text-gray-900">Sénégal - Dakar</h3>
                  <p className="text-sm text-gray-600">Country Sales Manager • 446M€/an</p>
                </div>
              </div>
              <div className="space-y-3 text-sm text-gray-700">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-brand-700 mt-0.5 flex-shrink-0" />
                  <span>Centre-ville, Dakar<br />Plateau des affaires</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-brand-700 flex-shrink-0" />
                  <span>Contact local disponible</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-brand-700 flex-shrink-0" />
                  <span>dakar@diaspomoney.fr</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-brand-700 flex-shrink-0" />
                  <span>9,4% contribution au PIB national</span>
                </div>
              </div>
            </div>

            {/* Côte d'Ivoire */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border-t-4 border-brand-600 hover:shadow-xl transition-all">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">🇨🇮</span>
                <div>
                  <h3 className="font-bold text-gray-900">Côte d'Ivoire - Abidjan</h3>
                  <p className="text-sm text-gray-600">Country Sales Manager • 375M€/an</p>
                </div>
              </div>
              <div className="space-y-3 text-sm text-gray-700">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-brand-700 mt-0.5 flex-shrink-0" />
                  <span>Plateau, Abidjan<br />District autonome</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-brand-700 flex-shrink-0" />
                  <span>Contact local disponible</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-brand-700 flex-shrink-0" />
                  <span>abidjan@diaspomoney.fr</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-brand-700 flex-shrink-0" />
                  <span>5,4% contribution au PIB national</span>
                </div>
              </div>
            </div>

            {/* Cameroun */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border-t-4 border-red-600 hover:shadow-xl transition-all">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">🇨🇲</span>
                <div>
                  <h3 className="font-bold text-gray-900">Cameroun - Douala</h3>
                  <p className="text-sm text-gray-600">Country Sales Manager • 153M€/an</p>
                </div>
              </div>
              <div className="space-y-3 text-sm text-gray-700">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-brand-700 mt-0.5 flex-shrink-0" />
                  <span>Centre-ville, Douala<br />Capital économique</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-brand-700 flex-shrink-0" />
                  <span>Contact local disponible</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-brand-700 flex-shrink-0" />
                  <span>douala@diaspomoney.fr</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-brand-700 flex-shrink-0" />
                  <span>1% contribution au PIB national</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Quick Access */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-gray-800 to-gray-700 text-white p-6">
            <h2 className="text-xl font-bold mb-2">Questions Fréquentes</h2>
            <p className="text-sm opacity-80">Trouvez rapidement des réponses à vos questions</p>
          </div>

          <div className="p-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div 
                onClick={() => window.location.href = '/faq#inscription'}
                className="text-center p-6 border-2 border-gray-300 rounded-lg hover:border-brand-600 hover:bg-brand-500/5 cursor-pointer transition-all"
              >
                <User className="w-8 h-8 text-brand-700 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 mb-1">Inscription</h3>
                <p className="text-sm text-gray-600">Créer un compte</p>
              </div>

              <div 
                onClick={() => window.location.href = '/faq#services'}
                className="text-center p-6 border-2 border-gray-300 rounded-lg hover:border-brand-600 hover:bg-brand-500/5 cursor-pointer transition-all"
              >
                <CheckCircle className="w-8 h-8 text-brand-700 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 mb-1">Services</h3>
                <p className="text-sm text-gray-600">Commander & suivre</p>
              </div>

              <div 
                onClick={() => window.location.href = '/faq#paiements'}
                className="text-center p-6 border-2 border-gray-300 rounded-lg hover:border-brand-600 hover:bg-brand-500/5 cursor-pointer transition-all"
              >
                <Shield className="w-8 h-8 text-brand-700 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 mb-1">Paiements</h3>
                <p className="text-sm text-gray-600">Moyens & sécurité</p>
              </div>

              <div 
                onClick={() => window.location.href = '/faq#prestataires'}
                className="text-center p-6 border-2 border-gray-300 rounded-lg hover:border-brand-600 hover:bg-brand-500/5 cursor-pointer transition-all"
              >
                <Star className="w-8 h-8 text-brand-700 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 mb-1">Prestataires</h3>
                <p className="text-sm text-gray-600">Qualité & garanties</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Chat Widget */}
      <div 
        onClick={openChat}
        className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-r from-brand-600 to-brand-700 rounded-full flex items-center justify-center text-white cursor-pointer shadow-xl hover:scale-110 transition-all z-50"
        title="Chat en direct avec DiaspoMoney"
      >
        <MessageCircle className="w-6 h-6" />
      </div>
    </div>
  );
}
