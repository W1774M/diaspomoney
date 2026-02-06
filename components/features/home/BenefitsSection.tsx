'use client';

import { CheckCircle2, Wallet, Shield, Eye, Zap, Heart } from 'lucide-react';

const BENEFITS = [
  {
    icon: CheckCircle2,
    title: "Partenaires vérifiés & certifiés",
    description:
      "Tous nos prestataires de santé sont rigoureusement sélectionnés et certifiés. Cliniques, médecins, pharmacies : que du sérieux.",
  },
  {
    icon: Wallet,
    title: "Paiement direct au prestataire",
    description:
      "L'argent va directement à l'établissement de santé. Plus de transfert d'argent, plus de risque de détournement.",
  },
  {
    icon: Shield,
    title: "Transactions 100% sécurisées",
    description:
      "Paiement crypté et sécurisé sur notre plateforme. Vos données et votre argent sont protégés.",
  },
  {
    icon: Eye,
    title: "Suivi en temps réel",
    description:
      "Votre dashboard vous permet de suivre chaque service : paiement, prise en charge, résultats. Tout est visible.",
  },
  {
    icon: Zap,
    title: "Rapidité d'exécution",
    description:
      "De votre paiement à la prise en charge de votre proche, tout se fait en quelques heures seulement.",
  },
  {
    icon: Heart,
    title: "Support dédié",
    description:
      "Notre équipe vous accompagne à chaque étape. En français, disponible et à l'écoute de vos besoins.",
  },
];

export function BenefitsSection() {
  return (
    <section className="py-20 md:py-24 bg-gray-50 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-[#F97015] opacity-10 rounded-full blur-3xl"></div>
      <div className="absolute top-20 right-10 w-32 h-32 bg-[#F97015] opacity-10 rounded-full blur-3xl"></div>
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Tag */}
        <div className="flex justify-center mb-6">
          <span
            className="inline-block px-4 py-1.5 rounded-full text-sm font-medium"
            style={{
              backgroundColor: '#F97015',
              color: '#1C1917',
              fontFamily: 'Plus Jakarta Sans, sans-serif',
            }}
          >
            Pourquoi Diaspomoney
          </span>
        </div>

        {/* Title */}
        <div className="text-center mb-4">
          <h2
            className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4"
            style={{
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              color: '#1C1917',
            }}
          >
            <span style={{ color: '#1C1917' }}>Des avantages qui font la </span>
            <span style={{ color: '#F97015' }}>différence</span>
          </h2>
          <p
            className="text-lg text-gray-600 max-w-2xl mx-auto"
            style={{
              fontFamily: 'Plus Jakarta Sans, sans-serif',
            }}
          >
            Une solution pensée par et pour la diaspora africaine, pour prendre soin de vos proches en toute sérénité.
          </p>
        </div>

        {/* Benefits Grid 2x3 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 mt-12 max-w-6xl mx-auto">
          {BENEFITS.map((benefit, index) => {
            const IconComponent = benefit.icon;
            return (
              <div
                key={index}
                className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-all duration-300"
                style={{
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                  borderRadius: '16px',
                }}
              >
                {/* Icon */}
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
                  style={{ backgroundColor: '#F97015' }}
                >
                  <IconComponent className="w-6 h-6 text-white" />
                </div>

                {/* Title */}
                <h3
                  className="text-lg font-bold mb-3"
                  style={{
                    color: '#1C1917',
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                  }}
                >
                  {benefit.title}
                </h3>

                {/* Description */}
                <p
                  className="text-gray-600 leading-relaxed text-sm"
                  style={{
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                  }}
                >
                  {benefit.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

