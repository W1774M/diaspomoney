'use client';

import { CheckCircle2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const BENEFITS = [
  'Inscription gratuite en 2 minutes',
  'Aucun frais caché',
  'Support disponible 7j/7',
  'Annulation possible à tout moment',
];

export function CareForLovedOnesSection() {
  return (
    <section className="py-20 md:pt-12 md:pb-1 relative overflow-hidden" style={{ backgroundColor: '#FDF8F3' }}>
      {/* Background glow effect */}
      <div aria-hidden="true" className="absolute bottom-0 left-0 w-96 h-96 rounded-full opacity-30 blur-3xl" style={{ backgroundColor: '#FBE3CC' }}></div>
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Main Card */}
        <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-lg p-8 md:p-12 relative">
          {/* Title */}
          <div className="text-center mb-6">
            <h2
              className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4"
              style={{
                fontFamily: 'var(--font-plus-jakarta-sans), sans-serif',
                color: '#1C1917',
              }}
            >
              Prêt à prendre soin de vos{' '}
              <span className='text-brand-600'>proches</span> ?
            </h2>
            
            {/* Description */}
            <p
              className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed"
              style={{
                fontFamily: 'var(--font-plus-jakarta-sans), sans-serif',
                color: '#57534e',
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
                    style={{ color: 'var(--brand-700)' }}
                    fill="var(--brand-600)"
                    className="flex-shrink-0"
                  />
                  <span
                    className="text-base md:text-lg"
                    style={{
                      fontFamily: 'var(--font-plus-jakarta-sans), sans-serif',
                      color: '#57534e',
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
                style={{ color: 'var(--brand-700)' }}
                fill="var(--brand-600)"
                className="flex-shrink-0"
              />
              <span
                className="text-base md:text-lg"
                style={{
                  fontFamily: 'var(--font-plus-jakarta-sans), sans-serif',
                  color: '#57534e',
                }}
              >
                {BENEFITS[3]}
              </span>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-10">
            {/* Primary Button */}
            <Link
              href="/register"
              className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-brand-600 px-8 py-3 font-display font-semibold text-white shadow-lg transition-colors hover:bg-brand-700 active:bg-brand-800"
            >
              Créer mon compte gratuitement
              <ArrowRight className="size-5 transition-transform group-hover:translate-x-1 motion-reduce:transition-none" />
            </Link>

            {/* Secondary Button */}
            <a
              href="mailto:contact@diaspomoney.fr"
              className="inline-flex min-h-12 items-center justify-center rounded-xl border-2 border-brand-600 bg-white px-8 py-3 font-display font-semibold text-brand-700 transition-colors hover:bg-brand-50"
            >
              Contacter l&apos;équipe
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
