"use client";

import { useRouter } from "next/navigation";
import { Check, Heart, GraduationCap, Home } from "lucide-react";
import HowItWorks from "@/components/common/HowItWorks";

interface ServiceOffer {
  id: string;
  title: string;
  description: string;
  price: string;
  delivery: string;
  features: string[];
  cta: string;
}

export default function ServicesPage() {
  const router = useRouter();

  // const servicePacks: ServicePack[] = [
  //   {
  //     id: "standard",
  //     name: "Pack Standard",
  //     description: "Services essentiels pour vos proches en Afrique",
  //     price: 0,
  //     duration: "À la carte",
  //     color: "from-blue-500 to-blue-600",
  //     icon: <Shield className="w-8 h-8" />,
  //     features: [
  //       "Consultation médicale à distance",
  //       "Paiement des frais de scolarité",
  //       "Recherche de logement",
  //       "Suivi de transaction en temps réel",
  //       "Support client multilingue",
  //     ],
  //     cta: "Choisir le Pack Standard",
  //   },
  //   {
  //     id: "premium",
  //     name: "Pack Premium",
  //     description: "Accompagnement complet avec garanties et suivi personnalisé",
  //     price: 0,
  //     duration: "Accompagnement complet",
  //     color: "from-[hsl(25,100%,53%)] to-[hsl(41,86%,46%)]",
  //     icon: <Users className="w-8 h-8" />,
  //     popular: true,
  //     features: [
  //       "Tous les services du Pack Standard",
  //       "Accompagnement par un Country Sales Manager",
  //       "Garantie de remboursement si service non exécuté",
  //       "Assurance santé et habitation",
  //       "Suivi post-service et assistance 24/7",
  //       "Rapports détaillés d'exécution",
  //     ],
  //     cta: "Choisir le Pack Premium",
  //   },
  // ];

  const serviceOffers: ServiceOffer[] = [
    {
      id: "consultation-general",
      title: "Santé",
      description: "Accès à un réseau de professionnels de santé certifiés",
      price: "À partir de 30€",
      delivery: "Rendez-vous sous 24-48h",
      features: [
        "Réseau de médecins vérifiés",
        "Consultation en présentiel ou téléconsultation",
        "Paiement sécurisé",
        "Rapport médical inclus",
      ],
      cta: "Prendre rendez-vous",
    },
    {
      id: "school-fees",
      title: "Éducation",
      description: "Paiement direct et sécurisé des frais d'éducation",
      price: "Selon établissement",
      delivery: "Paiement sous 48h",
      features: [
        "Paiement direct à l'établissement",
        "Reçu officiel garanti",
        "Suivi de paiement en temps réel",
        "Support pour les démarches administratives",
      ],
      cta: "Payer les frais de scolarité",
    },
    {
      id: "housing-search",
      title: "Immobilier",
      description: "Accompagnement dans la recherche, la location et la construction de biens immobiliers",
      price: "À partir de 100€",
      delivery: "Proposition sous 7 jours",
      features: [
        "Recherche personnalisée selon vos critères",
        "Faire déplacer un professionnel pour un devis",
        "Visites guidées",
        "Support jusqu'à la signature du contrat",
      ],
      cta: "Demander un devis",
    },
  ];


  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-[hsl(25,100%,53%)] to-[hsl(41,86%,46%)] text-white py-16 md:py-24">
       
      </section>

      {/* Service Offers Section */}
      <section id="offers" className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Nos offres
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Maximisez votre impact avec nos services complets, conçus pour
              vous accompagner à chaque étape du soutien à vos proches.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            {serviceOffers.map((offer) => (
              <div
                key={offer.id}
                className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
              >
                <div className="mb-4">
                  {offer.id === "health" && (
                    <Heart className="w-10 h-10 text-red-500 mb-3" />
                  )}
                  {offer.id === "education" && (
                    <GraduationCap className="w-10 h-10 text-blue-500 mb-3" />
                  )}
                  {offer.id === "housing" && (
                    <Home className="w-10 h-10 text-green-500 mb-3" />
                  )}
                </div>
                <h3 className="text-xl font-bold mb-2">{offer.title}</h3>
                <p className="text-gray-600 mb-4 h-10">{offer.description}</p>
                <div className="mb-4">
                  <span className="text-2xl font-bold text-[hsl(25,100%,53%)]">
                    {offer.price}
                  </span>
                  <p className="text-sm text-gray-500 mt-1">
                    {offer.delivery}
                  </p>
                </div>
                <ul className="space-y-2 mb-6">
                  {offer.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => {
                    // Mapper les IDs vers les nouveaux paramètres
                    const serviceMap: Record<string, string> = {
                      'consultation-general': 'health',
                      'school-fees': 'edu',
                      'housing-search': 'immo',
                    };
                    const serviceId = serviceMap[offer.id] || offer.id;
                    router.push(`/services/${serviceId}`);
                  }}
                  className="w-full bg-[hsl(25,100%,53%)] text-white py-3 rounded-lg font-semibold hover:bg-[hsl(25,100%,48%)] transition"
                  type="button"
                >
                  {offer.cta}
                </button>
              </div>
            ))}
          </div>

          {/* Service Packs */}
          {/* <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Nos packs complets
            </h3>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Choisissez un pack adapté à vos besoins et bénéficiez d'un
              accompagnement personnalisé.
            </p>
          </div> */}

          {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {servicePacks.map((pack) => (
              <div
                key={pack.id}
                className={`bg-white rounded-xl shadow-lg p-8 relative ${
                  pack.popular ? "ring-4 ring-[hsl(25,100%,53%)] ring-offset-4" : ""
                }`}
              >
                {pack.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-[hsl(25,100%,53%)] text-white px-4 py-1 rounded-full text-sm font-semibold">
                      Le plus populaire
                    </span>
                  </div>
                )}
                <div
                  className={`w-16 h-16 rounded-full bg-gradient-to-r ${pack.color} text-white flex items-center justify-center mb-4`}
                >
                  {pack.icon}
                </div>
                <h3 className="text-2xl font-bold mb-2">{pack.name}</h3>
                <p className="text-gray-600 mb-4">{pack.description}</p>
                <div className="mb-6">
                  <span className="text-3xl font-bold text-gray-900">
                    {pack.price === 0 ? "Sur devis" : `${pack.price}€`}
                  </span>
                  <p className="text-sm text-gray-500 mt-1">{pack.duration}</p>
                </div>
                <ul className="space-y-3 mb-8">
                  {pack.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => handlePackSelection(pack.id)}
                  className={`w-full py-3 rounded-lg font-semibold transition ${
                    pack.popular
                      ? "bg-[hsl(25,100%,53%)] text-white hover:bg-[hsl(25,100%,48%)]"
                      : "bg-gray-100 text-gray-900 hover:bg-gray-200"
                  }`}
                >
                  {pack.cta}
                </button>
              </div>
            ))}
          </div> */}
        </div>
      </section>

      <HowItWorks className="bg-gradient-to-r from-[hsl(25,100%,53%)] to-[hsl(41,86%,46%)] text-white py-16 md:py-24" bgColor="bg-white" textColor="text-white"/>
      {/* CTA Section */}
      <section className="py-16 bg-white text-black">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Prêt à démarrer ?
          </h2>
          <p className="text-xl mb-8 ">
            On vous conseille gratuitement sur le pack le plus adapté.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => router.push("/register")}
                className="bg-gradient-to-r from-[hsl(25,100%,53%)] to-[hsl(41,86%,46%)] text-white px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition"
                >
              Créer un compte
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

