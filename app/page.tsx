import Link from "next/link";
import HowItWorks from "@/components/common/HowItWorks";
import {
  BenefitsSection,
  CareForLovedOnesSection,
  ClinicsCarouselSection,
  HeroSection,
  HomeAnnouncementBannerButton,
  HomeAnnouncementDialog,
  PartnersSection,
  PhotoTestimonialsSection,
  RoadmapSection,
  TestimonialsSection,
} from "@/components/features/home";

/** Partie d'un message de bannière : texte simple ou lien */
type BannerPart =
  | { type: "text"; value: string }
  | { type: "link"; href: string; label: string }
  | { type: "dialog-link"; label: string };

interface BannerMessage {
  id: string;
  parts: BannerPart[];
}

const BANNER_MESSAGES: BannerMessage[] = [
  {
    id: "1",
    parts: [
      { type: "text", value: "🎉 Nouvelle offre santé : " },
      { type: "dialog-link", label: "voir l'offre" },
      { type: "text", value: " à partir de 10€." },
    ],
  },
  {
    id: "2",
    parts: [
      { type: "text", value: "🎒 Paiement des frais de scolarité sécurisé — " },
      { type: "link", href: "/services/edu", label: "en savoir plus" },
      { type: "text", value: "." },
    ],
  },
  {
    id: "3",
    parts: [
      { type: "text", value: "🏠 Travaux en Afrique ? " },
      { type: "link", href: "/services/immo", label: "demandez un devis" },
      { type: "text", value: "." },
    ],
  },
  {
    id: "4",
    parts: [
      { type: "text", value: "🎉 Promo santé à 2 euros" },
      { type: "link", href: "/services/health", label: "voir l'offre" },
      { type: "text", value: " à partir de 2€." },
    ],
  },
];

export default function HomePage() {
  return (
    <div className="flex flex-col">
      <HomeAnnouncementDialog />
      {/* Bannière défilante */}
      <div className="relative w-full overflow-hidden bg-[hsl(25,100%,53%)] text-white py-3 text-sm font-medium">
        <div className="flex animate-marquee whitespace-nowrap w-max">
          {[...BANNER_MESSAGES, ...BANNER_MESSAGES].map((msg, index) => (
            <span key={`${msg.id}-${index}`} className="inline-flex items-center gap-1 mx-8">
              {msg.parts.map((part, i) =>
                part.type === "text" ? (
                  <span key={i}>{part.value}</span>
                ) : part.type === "dialog-link" ? (
                  <HomeAnnouncementBannerButton key={i} />
                ) : (
                  <Link
                    key={i}
                    href={part.href}
                    className="underline underline-offset-2 hover:opacity-90 font-semibold"
                  >
                    {part.label}
                  </Link>
                ),
              )}
              <span className="text-white/70 mx-2" aria-hidden>•</span>
            </span>
          ))}
        </div>
      </div>
      <HeroSection />
      <ClinicsCarouselSection />
      <HowItWorks className="py-20 md:pt-12 md:pb-1 bg-white relative overflow-hidden" />
      <BenefitsSection />
      <TestimonialsSection />
      <PhotoTestimonialsSection />
      <PartnersSection />
      <CareForLovedOnesSection />
      <RoadmapSection />
    </div>
  );
}
