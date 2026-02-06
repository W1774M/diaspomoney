'use client';

import { CheckCircle2, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

const BENEFITS = [
  'Inscription gratuite en 2 minutes',
  'Aucun frais caché',
  'Support disponible 7j/7',
  'Annulation possible à tout moment',
];

export function CareForLovedOnesSection() {
  const router = useRouter();

  const handleCreateAccount = () => {
    router.push('/register');
  };

  const handleContactTeam = () => {
    window.open('mailto:contact@diaspomoney.fr', '_blank');
  };

  return (
    <section className="py-20 md:py-24 relative overflow-hidden" style={{ backgroundColor: '#FDF8F3' }}>
      {/* Background glow effect */}
      <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full opacity-30 blur-3xl" style={{ backgroundColor: '#FBE3CC' }}></div>
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Main Card */}
        <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-lg p-8 md:p-12 relative">
          {/* Title */}
          <div className="text-center mb-6">
            <h2
              className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4"
              style={{
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                color: '#1C1917',
              }}
            >
              Prêt à prendre soin de vos{' '}
              <span style={{ color: '#F97015' }}>proches</span> ?
            </h2>
            
            {/* Description */}
            <p
              className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed"
              style={{
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                color: '#555555',
              }}
            >
              Rejoignez des milliers de membres de la diaspora qui font confiance à Diaspomoney pour accompagner leur famille en Afrique.
            </p>
          </div>

          {/* Benefits List */}
          <div className="flex flex-col items-center gap-4 mb-8 mt-8">
            {/* First row - 3 items */}
            <div className="flex flex-wrap justify-center gap-6 md:gap-8">
              {BENEFITS.slice(0, 3).map((benefit, index) => (
                <div key={index} className="flex items-center gap-2">
                  <CheckCircle2
                    size={20}
                    style={{ color: '#F97015' }}
                    fill="#F97015"
                    className="flex-shrink-0"
                  />
                  <span
                    className="text-base md:text-lg"
                    style={{
                      fontFamily: 'Plus Jakarta Sans, sans-serif',
                      color: '#555555',
                    }}
                  >
                    {benefit}
                  </span>
                </div>
              ))}
            </div>
            
            {/* Second row - 1 item centered */}
            <div className="flex items-center gap-2">
              <CheckCircle2
                size={20}
                style={{ color: '#F97015' }}
                fill="#F97015"
                className="flex-shrink-0"
              />
              <span
                className="text-base md:text-lg"
                style={{
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                  color: '#555555',
                }}
              >
                {BENEFITS[3]}
              </span>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-10">
            {/* Primary Button */}
            <button
              onClick={handleCreateAccount}
              className="bg-[#F97015] text-white px-8 py-4 rounded-xl font-semibold hover:bg-[#E85F0A] transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 group focus:outline-none focus:ring-4 focus:ring-[#F97015]/50"
              style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
              aria-label="Créer mon compte gratuitement"
            >
              <span>Créer mon compte gratuitement</span>
              <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
            </button>

            {/* Secondary Button */}
            <button
              onClick={handleContactTeam}
              className="border-2 border-[#F97015] text-[#F97015] bg-white px-8 py-4 rounded-xl font-semibold hover:bg-[#F97015]/10 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-[#F97015]/50"
              style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
              aria-label="Contacter l'équipe"
            >
              Contacter l'équipe
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
