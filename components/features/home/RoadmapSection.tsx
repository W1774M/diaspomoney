'use client';

import { useState } from 'react';
import { Smartphone, RefreshCw, Globe, Bell } from 'lucide-react';
import { RoadmapSubscribeModal } from './RoadmapSubscribeModal';
import { RoadmapBecomeProviderModal } from './RoadmapBecomeProviderModal';

interface RoadmapItem {
  icon: typeof Smartphone;
  title: string;
  description: string;
  status: string;
  statusColor?: string;
}

const ROADMAP_ITEMS: RoadmapItem[] = [
  {
    icon: Smartphone,
    title: 'Application Mobile',
    description: 'iOS & Android pour gérer vos paiements en déplacement',
    status: 'Bientôt',
  },
  {
    icon: RefreshCw,
    title: 'API Développeurs',
    description: 'Intégrez Diaspomoney dans vos propres applications',
    status: '2027',
  },
  {
    icon: Globe,
    title: 'Plus de pays',
    description: 'Extension vers de nouveaux pays africains',
    status: 'En cours',
  },
  {
    icon: Bell,
    title: 'Notifications avancées',
    description: 'Alertes personnalisées par SMS, email et push',
    status: 'Bientôt',
  },
];

export function RoadmapSection() {
  const [isSubscribeModalOpen, setIsSubscribeModalOpen] = useState(false);
  const [isBecomeProviderModalOpen, setIsBecomeProviderModalOpen] = useState(false);

  const handleGetNotified = () => {
    setIsSubscribeModalOpen(true);
  };

  const handleBecomeProvider = () => {
    setIsBecomeProviderModalOpen(true);
  };

  return (
    <section className="py-20 md:pt-12 md:pb-8 bg-black relative overflow-hidden">
      {/* Decorative element */}
      <div className="absolute top-20 left-10 w-64 h-64 bg-brand-600 opacity-5 rounded-full blur-3xl"></div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start max-w-6xl mx-auto">
          {/* Left Column */}
          <div className="flex flex-col">
            {/* Tag */}
            <div className="mb-6">
              <span
                className="inline-block px-4 py-1.5 rounded-full text-sm font-medium text-white"
                style={{
                  backgroundColor: 'var(--brand-600)',
                  fontFamily: 'var(--font-plus-jakarta-sans), sans-serif',
                }}
              >
                Roadmap
              </span>
            </div>

            {/* Title */}
            <h2
              className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 text-white"
              style={{
                fontFamily: 'var(--font-plus-jakarta-sans), sans-serif',
              }}
            >
              L’avenir de <span className='text-brand-600'>Diaspomoney</span>
            </h2>

            {/* Description */}
            <p
              className="text-lg text-gray-300 mb-8 leading-relaxed"
              style={{
                fontFamily: 'var(--font-plus-jakarta-sans), sans-serif',
              }}
            >
              Nous construisons la plateforme de demain. Application mobile, API pour les développeurs, expansion géographique... Votre avis compte dans notre évolution.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleGetNotified}
                className="bg-brand-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-brand-700 transition-all duration-300"
                style={{
                  fontFamily: 'var(--font-plus-jakarta-sans), sans-serif',
                }}
              >
                Être notifié des nouveautés
              </button>
              <button
                onClick={handleBecomeProvider}
                className="border-2 border-white text-white bg-transparent px-6 py-3 rounded-xl font-semibold hover:bg-white/10 transition-all duration-300"
                style={{
                  fontFamily: 'var(--font-plus-jakarta-sans), sans-serif',
                }}
              >
                Devenir Prestataire
              </button>
            </div>
          </div>

          {/* Right Column - Roadmap Cards Grid 2x2 */}
          <div className="grid grid-cols-2 gap-4">
            {ROADMAP_ITEMS.map((item, index) => {
              const IconComponent = item.icon;
              return (
                <div
                  key={index}
                  className="bg-gray-900 rounded-lg p-6 hover:bg-gray-800 transition-all duration-300 relative"
                  style={{
                    fontFamily: 'var(--font-plus-jakarta-sans), sans-serif',
                  }}
                >
                  {/* Status Tag */}
                  <div className="absolute top-4 right-4">
                    <span
                      className="inline-block px-2 py-1 rounded text-xs font-medium text-white"
                      style={{
                        backgroundColor: 'var(--brand-600)',
                        fontFamily: 'var(--font-plus-jakarta-sans), sans-serif',
                      }}
                    >
                      {item.status}
                    </span>
                  </div>

                  {/* Icon */}
                  <div className="mb-4">
                    <IconComponent
                      className="w-8 h-8"
                      style={{
                        color: 'var(--brand-700)',
                        strokeWidth: 1.5,
                      }}
                    />
                  </div>

                  {/* Title */}
                  <h3
                    className="text-lg font-bold mb-2 text-white"
                    style={{
                      fontFamily: 'var(--font-plus-jakarta-sans), sans-serif',
                    }}
                  >
                    {item.title}
                  </h3>

                  {/* Description */}
                  <p
                    className="text-sm text-gray-300"
                    style={{
                      fontFamily: 'var(--font-plus-jakarta-sans), sans-serif',
                    }}
                  >
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modal d'inscription */}
      <RoadmapSubscribeModal
        isOpen={isSubscribeModalOpen}
        onClose={() => setIsSubscribeModalOpen(false)}
      />
      {/* Modal Devenir Prestataire (Nom, Email, Tél) */}
      <RoadmapBecomeProviderModal
        isOpen={isBecomeProviderModalOpen}
        onClose={() => setIsBecomeProviderModalOpen(false)}
      />
    </section>
  );
}
