import HowItWorks from "@/components/common/HowItWorks";
import {
  BenefitsSection,
  CareForLovedOnesSection,
  ClinicsCarouselSection,
  HeroSection,
  HomeAnnouncementDialog,
  HomeBanner,
  HomeCountryFilterProvider,
  OffersSection,
  PartnersSection,
  PhotoTestimonialsSection,
  RoadmapSection,
  TestimonialsSection,
} from "@/components/features/home";
import { getPublicHomeContent } from "@/lib/home-content.server";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  path: "/",
  title: "DiaspoMoney – Services pour la diaspora",
  description:
    "Réservez et payez des services pour vos proches en Afrique : santé, éducation, immobilier. Paiement sécurisé, prestataires vérifiés.",
});

/**
 * Page régénérée au plus toutes les 60 s (bandeau et annonce gérés par l'admin,
 * dates de diffusion) ; une modification admin l'invalide immédiatement.
 */
export const revalidate = 60;

export default async function HomePage() {
  const { bannerMessages, announcement } = await getPublicHomeContent();

  return (
    <div className="flex flex-col">
      <HomeAnnouncementDialog announcement={announcement} />
      <HomeBanner messages={bannerMessages} />
      <HomeCountryFilterProvider>
        <HeroSection />
        <ClinicsCarouselSection />
      </HomeCountryFilterProvider>
      <OffersSection />
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
