"use client";

import { ServiceCarousel } from "./ServiceCarousel";

interface HeroSectionProps {
  onServiceClick: (serviceId: string) => void;
  onExploreClick: () => void;
}

const CAROUSEL_SERVICES = [
  {
    id: "health",
    type: "health",
    image: "/img/diaspo/services/Copilot_20250904_104936-e1756983521170.png",
    title: "Santé",
    description:
      "Offrez à vos proches un accès direct aux soins : consultation médicale, analyses de laboratoire, soins d'urgence, hospitalisation, et bien plus encore.",
    serviceType: "Santé",
  },
  {
    id: "edu",
    type: "edu",
    image: "/img/diaspo/services/ChatGPT-Image-4-sept.-2025-11_43_39-e1756983550906.png",
    title: "Éducation",
    description:
      "Facilitez l'accès à l'éducation pour vos proches : frais de scolarité, fournitures scolaires, formations professionnelles, et accompagnement éducatif.",
    serviceType: "Éducation",
  },
  {
    id: "immo",
    type: "immo",
    image: "/img/diaspo/services/Copilot_20250904_123953-e1756983476403.png",
    title: "Immobilier & BTP",
    description:
      "Soutenez vos proches dans leurs projets immobiliers : achat, location, rénovation, construction, et gestion immobilière avec des prestataires vérifiés.",
    serviceType: "Immobilier",
  },
];

export function HeroSection({
  onServiceClick,
  onExploreClick,
}: HeroSectionProps) {
  return (
    <section className="bg-gradient-to-r from-[hsl(23,100%,53%)] to-[hsl(41,86%,46%)] py-20 md:py-24 relative overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-5 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')]" />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          {/* Left Content */}
          <div className="lg:w-1/2 w-full space-y-6">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight tracking-tight">
              Transférez des <span className="italic text-white">services</span>,<br className="hidden md:block" /> pas de&nbsp;<span className="italic text-white">l&apos;argent</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 leading-relaxed font-light max-w-2xl text-white/95">
              Garantissez à vos proches en Afrique des services de qualité en
              santé, éducation et immobilier, sans risque de détournement ni
              surfacturation.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                className="bg-white text-gray-900 px-8 py-4 rounded-xl font-semibold hover:bg-gray-50 transition-all duration-300 flex items-center justify-center gap-2 shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 group focus:outline-none focus:ring-4 focus:ring-white/50"
                onClick={onExploreClick}
                aria-label="Explorer tous les services disponibles"
              >
                <span>Explorer les services</span>
                <svg
                  className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </button>
            </div>
          </div>
          
          {/* Right Content - Carousel */}
          <div className="lg:w-1/2 w-full">
            <ServiceCarousel
              services={CAROUSEL_SERVICES}
              onServiceClick={onServiceClick}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

