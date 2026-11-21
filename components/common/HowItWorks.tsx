'use client';

import { CreditCard, Building2, Heart, ArrowRight } from "lucide-react";
import Image from "next/image";

export default function HowItWorks({ className }: { className?: string }) {
  const steps = [
    {
      number: "01",
      title: "Vous payez depuis la France",
      description:
        "Sélectionnez le service de santé et payez en toute sécurité depuis notre plateforme. Cartes, virements, tout est accepté.",
      icon: CreditCard,
      image: "/img/diaspo/step-01.jpeg",
      width: 528,
      height: 528,
      showNextStep: true,
    },
    {
      number: "02",
      title: "Le prestataire est payé directement",
      description:
        "L'argent est versé directement à la clinique ou au médecin. Aucun intermédiaire, aucun détournement possible.",
      icon: Building2,
      image: "/img/diaspo/step-02.jpeg",
      width: 406,
      height: 409,
      showNextStep: true,
    },
    {
      number: "03",
      title: "Votre proche reçoit les soins",
      description:
        "Suivez le service en temps réel depuis votre dashboard. Recevez des confirmations à chaque étape.",
      icon: Heart,
      image: "/img/diaspo/step-03.jpeg",
      width: 528,
      height: 396,
      showNextStep: false,
    },
  ];

  return (
    <section
      id="how-it-works"
      className={`${className || "py-20 md:pt-12 md:pb-0 bg-white relative overflow-hidden"}`}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Tag */}
        <div className="flex justify-center mb-6">
          <span
            className="inline-block px-4 py-1.5 rounded-full text-white text-sm font-medium"
            style={{
              backgroundColor: '#F97015',
              fontFamily: 'Plus Jakarta Sans, sans-serif',
            }}
          >
            Comment ça marche
          </span>
        </div>

        {/* Title */}
        <div className="text-center mb-12">
          <h2
            className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4"
            style={{
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              color: '#1C1917',
            }}
          >
            Un parcours simple, transparent et{' '}
            <span style={{ color: '#F97015' }}>sécurisé</span>
          </h2>
          <p
            className="text-lg text-gray-600 max-w-2xl mx-auto"
            style={{
              fontFamily: 'Plus Jakarta Sans, sans-serif',
            }}
          >
            De votre paiement en France jusqu&apos;aux soins de votre proche en Afrique, suivez chaque étape en temps réel.
          </p>
        </div>

        {/* Steps - Zig-zag layout */}
        <div className="space-y-16 md:space-y-24 mt-12 max-w-6xl mx-auto">
          {steps.map((step, idx) => {
            const IconComponent = step.icon;
            const isEven = idx % 2 == 1; // Step 2 is even index (1)
            
            return (
              <div
                key={idx}
                data-step={idx + 1}
                className={`flex flex-col ${isEven ? 'md:flex-row-reverse' : 'md:flex-row'} gap-8 lg:gap-12 items-center`}
                style={{
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                }}
              >
                {/* Illustration : gauche (étape 1,3) / droite (étape 2) via flex-row vs flex-row-reverse */}
                <div className="flex-shrink-0 w-full md:w-1/2">
                  <div className="relative w-full h-56 md:h-64 lg:h-72 rounded-lg overflow-hidden border border-gray-200 bg-black/5">
                    <Image
                      src={step.image}
                      alt=""
                      width={step.width}
                      height={step.height}
                      className="w-full h-full object-contain rounded-lg"
                      sizes="(min-width: 1024px) 288px, (min-width: 768px) 256px, 222px"
                    />
                  </div>
                </div>

                {/* Contenu : droite (étape 1,3) / gauche (étape 2) */}
                <div className="flex-1 w-full md:w-1/2">
                  <div className="flex items-center gap-4 mb-4">
                    {/* Large Number */}
                    <span
                      className="text-6xl md:text-7xl font-bold"
                      style={{
                        color: '#E5E5E5',
                        fontFamily: 'Plus Jakarta Sans, sans-serif',
                      }}
                    >
                      {step.number}
                    </span>
                    
                    {/* Icon Square */}
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: '#F97015' }}
                    >
                      <IconComponent className="w-6 h-6 text-white" />
                    </div>
                  </div>

                  {/* Title */}
                  <h3
                    className="text-2xl md:text-3xl font-bold mb-4"
                    style={{
                      color: '#1C1917',
                      fontFamily: 'Plus Jakarta Sans, sans-serif',
                    }}
                  >
                    {step.title}
                  </h3>

                  {/* Description */}
                  <p
                    className="text-gray-600 mb-6 leading-relaxed"
                    style={{
                      fontFamily: 'Plus Jakarta Sans, sans-serif',
                    }}
                  >
                    {step.description}
                  </p>

                  {/* Next Step Link */}
                  {step.showNextStep && (
                    <a
                      href="#"
                      className="inline-flex items-center text-[#F97015] font-medium hover:underline"
                      style={{
                        fontFamily: 'Plus Jakarta Sans, sans-serif',
                      }}
                      onClick={(e) => {
                        e.preventDefault();
                        // Scroll to next step
                        const nextStep = document.querySelector(`[data-step="${idx + 2}"]`);
                        if (nextStep) {
                          nextStep.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                      }}
                    >
                      Étape suivante <ArrowRight className="w-4 h-4 ml-2" />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}