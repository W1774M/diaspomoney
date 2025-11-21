"use client";

import { InfiniteCarousel } from "@/components/features/partners/InfiniteCarousel";
import { useRouter } from "next/navigation";

function Step({
  number,
  title,
  description,
}: {
  number: number;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="w-16 h-16 rounded-full bg-black text-white flex items-center justify-center mb-4 text-xl font-bold">
        {number}
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

// Composant de page d'accueil
export default function HomePage() {
  const router = useRouter();

  function handleRedirect(serviceType?: string) {
    if (serviceType) {
      router.push(`/services?t=${serviceType}`);
    } else {
      router.push("/services");
    }
  }

  return (
    <div className="flex flex-col">
      {/* Hero section */}
      <section className="bg-gradient-to-r from-[hsl(23,100%,53%)] to-[hsl(41,86%,46%)] text-white py-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="md:w-1/2 mb-8 md:mb-0">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 flex items-center">
                Transférez des services, pas de l&apos;argent
                <span className="ml-3 w-1 h-12 bg-white"></span>
              </h2>
              <p className="text-lg mb-6 text-white/95">
                La première plateforme tout-en-un qui révolutionne votre transfert
                de services vers l&apos;Afrique : santé, éducation, immobilier...
                tout réuni au même endroit.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <button
                  className="bg-white text-black px-6 py-3 rounded-md font-semibold hover:bg-gray-100 transition flex items-center justify-center hover:cursor-pointer"
                  onClick={() => handleRedirect()}
                >
                  Explorer les services →
                </button>
                <button
                  className="bg-transparent border border-white text-white px-6 py-3 rounded-md font-semibold hover:bg-white hover:text-black transition hover:cursor-pointer"
                  onClick={() => {
                    document.getElementById("how-it-works")?.scrollIntoView({
                      behavior: "smooth",
                    });
                  }}
                >
                  Voir comment ça marche
                </button>
              </div>
              <div className="flex flex-col sm:flex-row gap-6 mt-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <span className="text-xl">⏰</span>
                  </div>
                  <span className="text-white/95">Accompagnement personnalisé</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <span className="text-xl">🔥</span>
                  </div>
                  <span className="text-white/95">Suivi en temps réel</span>
                </div>
              </div>
            </div>
            <div className="md:w-1/2 flex justify-center">
              <div className="bg-white rounded-lg shadow-xl overflow-hidden w-full max-w-md text-gray-800">
                <div className="relative h-48 bg-gradient-to-br from-diaspomoney-500 to-diaspomoney-700 flex items-center justify-center">
                  <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                    <span>✓</span>
                    <span>Vérifié</span>
                  </div>
                  <div className="text-white text-center">
                    <span className="text-6xl">🏥</span>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-2">Service Santé - Abidjan</h3>
                  <div className="flex items-center gap-2 text-gray-600 mb-2">
                    <span className="text-sm">📍</span>
                    <span className="text-sm">Abidjan, Côte d&apos;Ivoire</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600 mb-4">
                    <span className="text-sm">🏥</span>
                    <span className="text-sm">Consultation • Soins hospitaliers</span>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="px-3 py-1 bg-gray-100 rounded-full text-xs text-gray-700 border border-gray-200">
                      Consultation
                    </span>
                    <span className="px-3 py-1 bg-gray-100 rounded-full text-xs text-gray-700 border border-gray-200">
                      Urgences
                    </span>
                    <span className="px-3 py-1 bg-gray-100 rounded-full text-xs text-gray-700 border border-gray-200">
                      Suivi médical
                    </span>
                  </div>
                  <div className="mb-4">
                    <span className="text-3xl font-bold text-diaspomoney-600">À partir de 25€</span>
                    <span className="text-sm text-gray-600 ml-2">par consultation</span>
                  </div>
                  <button
                    className="w-full bg-diaspomoney-600 text-white px-6 py-3 rounded-md font-semibold hover:bg-diaspomoney-700 transition hover:cursor-pointer"
                    onClick={() => handleRedirect("health")}
                  >
                    Réserver maintenant
                  </button>
                  <p className="text-xs text-gray-500 mt-3 text-center">
                    Protection « Garantie service » incluse
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section comment ça marche */}
      <section id="how-it-works" className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Comment ça marche
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Step
              number={1}
              title="Choisissez un service"
              description="Sélectionnez le type de service à transférer et trouvez le prestataire idéal parmi notre réseau certifié"
            />
            <Step
              number={2}
              title="Payez en toute sécurité"
              description="Réglez le montant du service via notre plateforme sécurisée avec des options de paiement variées."
            />
            <Step
              number={3}
              title="Suivez l'exécution"
              description="Recevez des mises à jour en temps réel et la confirmation de lexécution effective du service."
            />
          </div>
        </div>
      </section>

      {/* Section avantages */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Pourquoi choisir DiaspoMoney ?
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center mb-4">
                <span className="text-2xl">✅</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">
                Prestataires vérifiés
              </h3>
              <p className="text-gray-600">
                Tous nos prestataires sont rigoureusement sélectionnés et font
                l&apos;objet d&apos;un suivi continu.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-4">
                <span className="text-2xl">💳</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">
                Économies garanties
              </h3>
              <p className="text-gray-600">
                Économisez jusquà 15-30% par rapport aux transferts
                d&apos;argent traditionnels.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mb-4">
                <span className="text-2xl">⏰</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">
                Suivi en temps réel
              </h3>
              <p className="text-gray-600">
                Suivez l&apos;avancement du service et recevez des notifications
                à chaque étape.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center mb-4">
                <span className="text-2xl">📞</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Support local</h3>
              <p className="text-gray-600">
                Nos Country Sales Managers sur place assurent la qualité
                d&apos;exécution des services.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section partenaires */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Nos partenaires
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Découvrez nos partenaires de confiance qui partagent notre vision
              d'un service de qualité pour la diaspora africaine.
            </p>
          </div>

          <InfiniteCarousel />
        </div>
      </section>
    </div>
  );
}

