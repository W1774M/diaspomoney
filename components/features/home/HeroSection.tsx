"use client";

import { CM, CG, CI, SN, CD, RW } from "country-flag-icons/react/3x2";
import { Shield, Clock, Tag, ArrowRight } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";

const FEATURES = [
  {
    icon: Shield,
    text: "Paiements sécurisés",
  },
  {
    icon: Clock,
    text: "Suivi temps réel",
  },
  {
    icon: Tag,
    text: "0% de frais cachés",
  },
];

/**
 * Pays couverts — drapeaux en SVG (les emojis drapeaux ne s’affichent pas sous Windows
 * sur Chrome/Edge : lettres « CM », « CI », etc. à la place).
 */
const PRESENCE_COUNTRIES: { Flag: typeof CM; iso: string; label: string }[] = [
  { Flag: CM, iso: "CM", label: "Présent au Cameroun" },
  { Flag: CG, iso: "CG", label: "Présent au Congo" },
  { Flag: CI, iso: "CI", label: "Bientôt en Côte d’Ivoire" },
  { Flag: SN, iso: "SN", label: "Bientôt au Sénégal" },
  { Flag: CD, iso: "CD", label: "Bientôt en RDC" },
  { Flag: RW, iso: "RW", label: "Bientôt au Rwanda" },
];

export function HeroSection() {
  const router = useRouter();

  const handleGetStarted = () => {
    router.push("/#services");
  };

  const handleCreateAccount = () => {
    router.push("/register");
  };


  return (
    <section className="relative bg-[#FDF8F3] overflow-hidden">
      {/* Curved bottom border */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg
          viewBox="0 0 1440 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-auto"
          preserveAspectRatio="none"
        >
          <path
            d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
            fill="white"
          />
        </svg>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 pt-16 pb-24 md:pt-4 md:pb-0">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          {/* Left Content */}
          <div className="lg:w-1/2 w-full space-y-6">
            {/* Alert Banner */}
            <div className="flex items-center gap-2 mb-4">
              <div
                className="flex items-center gap-2 px-4 py-2 rounded-full"
                style={{
                  backgroundColor: '#FDF8F3',
                  fontFamily: "Plus Jakarta Sans, sans-serif",
                }}
              >
                <div className="w-2 h-2 rounded-full bg-[#F97015]"></div>
                <span
                  className="text-sm font-medium"
                  style={{
                    color: '#F97015',
                    fontFamily: "Plus Jakarta Sans, sans-serif",
                  }}
                >
                  Nouveau : Application mobile bientôt disponible
                </span>
              </div>
            </div>

            {/* Main Title */}
            <h1
              className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight tracking-tight mb-6"
              style={{
                fontFamily: "Plus Jakarta Sans, sans-serif",
                color: "#1C1917",
              }}
            >
              Prenez soin de vos proches{" "}
              <span style={{ color: "#F97015" }}>en Afrique</span>, depuis la
              France
            </h1>

            {/* Pays couverts */}
            <ul
              className="flex flex-wrap gap-2 sm:gap-3 mb-2 list-none p-0 m-0"
              style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}
              aria-label="Pays où DiaspoMoney est présent"
            >
              {PRESENCE_COUNTRIES.map(({ Flag, iso, label }) => (
                <li
                  key={iso}
                  className="inline-flex items-center gap-2 rounded-full border border-stone-200/80 bg-white/80 px-3 py-1.5 text-sm text-stone-700 shadow-sm"
                >
                  <span
                    className="relative h-[14px] w-[21px] shrink-0 overflow-hidden rounded-[2px] shadow-sm ring-1 ring-black/10"
                    aria-hidden
                  >
                    <Flag
                      title=""
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  </span>
                  <span>{label}</span>
                </li>
              ))}
            </ul>

            {/* Description */}
            <p
              className="text-lg md:text-xl text-gray-600 leading-relaxed mb-8 max-w-2xl"
              style={{
                fontFamily: "Plus Jakarta Sans, sans-serif",
                color: "#555555",
              }}
            >
              Payez directement les services essentiels pour vos proches : <a href="/services/health" className="text-[#F97015]">santé</a>, <a href="/services/edu" className="text-[#F97015]">éducation</a>, <a href="/services/immo" className="text-[#F97015]">immobilier</a>.
              Fini les transferts d’argent et les détournements.
              Suivez chaque dépense en temps réel depuis votre tableau de bord, en toute transparence.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <button
                onClick={handleGetStarted}
                className="bg-[#F97015] text-white px-8 py-4 rounded-xl font-semibold hover:bg-[#E85F0A] transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 group focus:outline-none focus:ring-4 focus:ring-[#F97015]/50"
                style={{
                  fontFamily: "Plus Jakarta Sans, sans-serif",
                }}
                aria-label="Commencer maintenant"
              >
                <span>Commencer maintenant</span>
                <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
              </button>
              <button
                onClick={handleCreateAccount}
                className="border-2 border-[#F97015] text-[#F97015] bg-white px-8 py-4 rounded-xl font-semibold hover:bg-[#F97015]/10 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-[#F97015]/50"
                style={{
                  fontFamily: "Plus Jakarta Sans, sans-serif",
                }}
                aria-label="Je crée mon compte gratuitement"
              >
                Je crée mon compte gratuitement
              </button>
            </div>

            {/* Feature Highlights */}
            <div className="flex flex-wrap gap-6">
              {FEATURES.map((feature, index) => {
                const IconComponent = feature.icon;
                return (
                  <div
                    key={index}
                    className="flex items-center gap-2"
                    style={{
                      fontFamily: "Plus Jakarta Sans, sans-serif",
                    }}
                  >
                    <IconComponent className="w-5 h-5 text-gray-600" />
                    <span className="text-sm text-gray-600">{feature.text}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Content - Illustration */}
          <div className="lg:w-1/2 w-full flex items-center justify-center">
            <div className="relative w-full max-w-md">
              {/* Circular background behind illustration */}
              <div className="absolute inset-0 rounded-full bg-[#FBE3CC] blur-2xl opacity-80 -z-10"></div>
              
              {/* Illustration placeholder - sera remplacé par l'image réelle */}
              <div className="relative w-full aspect-square flex items-center justify-center">
                <div className="w-full h-full bg-gradient-to-br from-[#FBE3CC] to-[#FDF8F3] rounded-full flex items-center justify-center overflow-hidden">
                  <Image
                    src="/img/diaspo/diaspomoney_hero_image.jpg"
                    alt=""
                    width={512}
                    height={683}
                    className="object-contain w-full h-full rounded-full"
                    sizes="(min-width: 1024px) 380px, (min-width: 768px) 320px, 280px"
                    // Image LCP : préchargée et prioritaire sur le réseau.
                    preload
                    fetchPriority="high"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

