import { InfiniteCarousel } from "@/components/features/partners/InfiniteCarousel";

export function PartnersSection() {
  return (
    <section id="partners" className="py-20 md:pt-12 md:pb-1 bg-gradient-to-b from-white to-gray-50 relative overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Tag */}
        <div className="flex justify-center mb-6">
          <span
            className="inline-block px-4 py-1.5 rounded-full text-white text-sm font-medium"
            style={{
              backgroundColor: 'var(--brand-600)',
              fontFamily: 'var(--font-plus-jakarta-sans), sans-serif',
            }}
          >
            Partenaires
          </span>
        </div>

        {/* Title */}
        <div className="text-center mb-4">
          <h2
            className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4"
            style={{
              fontFamily: 'var(--font-plus-jakarta-sans), sans-serif',
              color: '#1C1917',
            }}
          >
            Nos partenaires
          </h2>
          <p
            className="text-lg text-gray-600 max-w-2xl mx-auto"
            style={{
              fontFamily: 'var(--font-plus-jakarta-sans), sans-serif',
            }}
          >
            Nous travaillons avec des partenaires de confiance pour vous offrir le meilleur service.
          </p>
        </div>

        <InfiniteCarousel />
      </div>
    </section>
  );
}

