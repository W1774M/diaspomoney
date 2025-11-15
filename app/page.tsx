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
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 mb-8 md:mb-0">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Transférez des services, pas de l&apos;argent
              </h2>
              <p className="text-lg mb-6">
                Garantissez à vos proches en Afrique des services de qualité en
                santé, éducation et immobilier, sans risque de détournement ni
                surfacturation.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
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
            </div>
            <div className="md:w-1/2 flex justify-center">
              <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md text-gray-800">
                <h3 className="text-xl font-semibold mb-4">
                  Quel service souhaitez-vous transférer ?
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  <div
                    className="flex items-start p-4 border rounded-lg hover:bg-gray-50 transition-colors text-left cursor-pointer"
                    onClick={() => handleRedirect("health")}
                  >
                    <div className="mr-4">
                      <span className="text-blue-600 text-2xl">🏥</span>
                    </div>
                    <div>
                      <h4 className="font-semibold">Santé</h4>
                      <p className="text-sm text-gray-600">
                        Consultations, soins hospitaliers, médicaments
                      </p>
                    </div>
                  </div>
                  <div
                    className="flex items-start p-4 border rounded-lg hover:bg-gray-50 transition-colors text-left cursor-pointer"
                    onClick={() => handleRedirect("edu")}
                  >
                    <div className="mr-4">
                      <span className="text-blue-600 text-2xl">🎓</span>
                    </div>
                    <div>
                      <h4 className="font-semibold">Éducation</h4>
                      <p className="text-sm text-gray-600">
                        Frais de scolarité, fournitures, formations
                      </p>
                    </div>
                  </div>
                  <div
                    className="flex items-start p-4 border rounded-lg hover:bg-gray-50 transition-colors text-left cursor-pointer"
                    onClick={() => handleRedirect("immo")}
                  >
                    <div className="mr-4">
                      <span className="text-blue-600 text-2xl">🏠</span>
                    </div>
                    <div>
                      <h4 className="font-semibold">Immobilier</h4>
                      <p className="text-sm text-gray-600">
                        Achat, location, gestion immobilière
                      </p>
                    </div>
                  </div>
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

