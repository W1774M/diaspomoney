'use client';

import { Star, Quote, User, Building2 } from 'lucide-react';

const USER_TESTIMONIALS = [
  {
    id: 1,
    text: "Grâce à Diaspomoney, j'ai pu payer directement les analyses de ma mère à Douala. Plus besoin d'envoyer de l'argent et de stresser. Je vois tout sur mon dashboard!",
    name: "Sandrine",
    location: "Paris, France",
    role: "Utilisatrice",
    initial: "F",
    rating: 5,
  },
  {
    id: 2,
    text: "Service exceptionnel. Mon père a été hospitalisé en urgence, j'ai pu tout régler depuis la France en 10 minutes. Les confirmations en temps réel m'ont rassuré.",
    name: "Samuel",
    location: "Paris, France",
    role: "Utilisateur",
    initial: "M",
    rating: 5,
  },
  {
    id: 3,
    text: "Enfin une solution qui comprend nos besoins ! Je gère les soins de toute ma famille au Cameroun depuis mon téléphone. Simple, rapide, sécurisé.",
    name: "Sophie",
    location: "Paris, France",
    role: "Utilisatrice",
    initial: "A",
    rating: 5,
  },
];

const PROVIDER_TESTIMONIALS = [
  {
    id: 1,
    text: "En tant que professionnel de santé à Douala, j’ai toujours eu à cœur de faciliter l’accès à des soins de qualité, notamment pour les familles soutenues par la diaspora. Le partenariat avec DiaspoMoney s’est imposé comme une évidence.",
    name: "Dr. Foulefack",
    location: "Douala, Yaoundé, Cameroun",
    role: "Médecin partenaire",
    initial: "F",
    rating: 5,
  },
  {
    id: 2,
    text: "Le partenariat avec DiaspoMoney est un véritable modèle gagnant-gagnant. Il facilite l’accès aux soins pour les familles soutenues par la diaspora tout en valorisant le travail des professionnels de santé locaux. Une collaboration basée sur la confiance, l’efficacité et l’impact social.",
    name: "Dr. Téné",
    location: "Douala, Cameroun",
    role: "Médecin partenaire",
    initial: "T",
    rating: 5,
  },
  {
    id: 3,
    text: "C’est une collaboration gagnant-gagnant : DiaspoMoney permet aux membres de la diaspora de prendre en charge leurs proches à distance, tandis que nous, prestataires de santé, bénéficions d’un flux de patients mieux orientés, d’un cadre clair et d’une relation de confiance. C’est un modèle innovant, utile et durable, au service de la santé et du lien entre la diaspora et le Cameroun.",
    name: "Dr. Yotedje",
    location: "Douala, Cameroun",
    role: "Médecin partenaire",
    initial: "Y",
    rating: 5,
  },
];

export function TestimonialsSection() {
  return (
    <section id="testimonials" className="py-20 md:pt-12 md:pb-1 bg-gray-50 relative overflow-hidden">
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
            Témoignages
          </span>
        </div>

        {/* Title */}
        <div className="text-center mb-4">
          <h2
            className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4"
            style={{
              fontFamily: 'Plus Jakarta Sans, sans-serif',
            }}
          >
            <span style={{ color: '#1C1917' }}>Ils nous font </span>
            <span style={{ color: '#F97015' }}>confiance</span>
          </h2>
          <p
            className="text-lg text-gray-600 max-w-2xl mx-auto"
            style={{
              fontFamily: 'Plus Jakarta Sans, sans-serif',
            }}
          >
            Découvrez les retours de nos utilisateurs et de nos partenaires de santé en Afrique.
          </p>
        </div>

        {/* Section Header - Users */}
        <div className="mb-8 mt-12">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: '#F97015', opacity: 0.1 }}
            >
              <User
                size={20}
                style={{ color: '#F97015' }}
              />
            </div>
            <h3
              className="text-xl font-bold"
              style={{
                color: '#1C1917',
                fontFamily: 'Plus Jakarta Sans, sans-serif',
              }}
            >
              Nos utilisateurs
            </h3>
          </div>
        </div>

        {/* User Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 mb-16">
          {USER_TESTIMONIALS.map((testimonial) => (
            <div
              key={testimonial.id}
              className="bg-white rounded-lg shadow-md p-6 relative"
              style={{
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                borderRadius: '16px',
              }}
            >
              {/* Large Quote Icon */}
              <div className="absolute top-6 left-6 opacity-20">
                <Quote
                  size={64}
                  style={{ color: '#E5E5E5' }}
                  fill="#E5E5E5"
                />
              </div>

              {/* Testimonial Text */}
              <p
                className="text-gray-800 mb-6 mt-4 relative z-10 leading-relaxed"
                style={{
                  color: '#1C1917',
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                }}
              >
                {testimonial.text}
              </p>

              {/* Stars */}
              <div className="flex gap-1 mb-6">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star
                    key={i}
                    size={16}
                    style={{ color: '#F97015' }}
                    fill="#F97015"
                  />
                ))}
              </div>

              {/* User Info */}
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                  style={{ backgroundColor: '#F97015' }}
                >
                  {testimonial.initial}
                </div>

                {/* User Details */}
                <div className="flex-1">
                  <p
                    className="font-bold text-sm"
                    style={{
                      color: '#1C1917',
                      fontFamily: 'Plus Jakarta Sans, sans-serif',
                    }}
                  >
                    {testimonial.name}
                  </p>
                  <p
                    className="text-xs text-gray-600 mt-0.5"
                    style={{
                      fontFamily: 'Plus Jakarta Sans, sans-serif',
                    }}
                  >
                    {testimonial.location}
                  </p>
                  <p
                    className="text-xs text-gray-500 mt-0.5"
                    style={{
                      fontFamily: 'Plus Jakarta Sans, sans-serif',
                    }}
                  >
                    {testimonial.role}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Section Header - Providers */}
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: '#1C1917', opacity: 0.1 }}
            >
              <Building2
                size={20}
                style={{ color: '#1C1917' }}
              />
            </div>
            <h3
              className="text-xl font-bold"
              style={{
                color: '#1C1917',
                fontFamily: 'Plus Jakarta Sans, sans-serif',
              }}
            >
              Nos prestataires partenaires
            </h3>
          </div>
        </div>

        {/* Provider Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {PROVIDER_TESTIMONIALS.map((testimonial) => (
            <div
              key={testimonial.id}
              className="rounded-lg p-6 relative shadow-md"
              style={{
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                backgroundColor: '#1C1917',
                borderRadius: '16px',
              }}
            >
              {/* Large Quote Icon */}
              <div className="absolute top-6 left-6 opacity-20">
                <Quote
                  size={64}
                  style={{ color: '#FFFFFF' }}
                  fill="#FFFFFF"
                />
              </div>

              {/* Testimonial Text */}
              <p
                className="text-white mb-6 mt-4 relative z-10 leading-relaxed"
                style={{
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                }}
              >
                {testimonial.text}
              </p>

              {/* Stars */}
              <div className="flex gap-1 mb-6">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star
                    key={i}
                    size={16}
                    style={{ color: '#F97015' }}
                    fill="#F97015"
                  />
                ))}
              </div>

              {/* Provider Info */}
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                  style={{ backgroundColor: '#F97015' }}
                >
                  {testimonial.initial}
                </div>

                {/* Provider Details */}
                <div className="flex-1">
                  <p
                    className="font-bold text-sm text-white"
                    style={{
                      fontFamily: 'Plus Jakarta Sans, sans-serif',
                    }}
                  >
                    {testimonial.name}
                  </p>
                  <p
                    className="text-xs text-gray-300 mt-0.5"
                    style={{
                      fontFamily: 'Plus Jakarta Sans, sans-serif',
                    }}
                  >
                    {testimonial.location}
                  </p>
                  <p
                    className="text-xs text-gray-400 mt-0.5"
                    style={{
                      fontFamily: 'Plus Jakarta Sans, sans-serif',
                    }}
                  >
                    {testimonial.role}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
