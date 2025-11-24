"use client";

import { useRouter } from "next/navigation";
import {
  HeroSection,
  BenefitsSection,
  PartnersSection,
} from "@/components/features/home";

export default function HomePage() {
  const router = useRouter();

  const handleServiceClick = (serviceId: string) => {
    router.push(`/services/${serviceId}`);
  };

  const handleExploreClick = () => {
    router.push("/services");
  };

  return (
    <div className="flex flex-col">
      <HeroSection
        onServiceClick={handleServiceClick}
        onExploreClick={handleExploreClick}
      />
      <BenefitsSection />
      <PartnersSection />
    </div>
  );
}
