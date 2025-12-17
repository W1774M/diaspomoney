"use client";

import { useRouter } from "next/navigation";
import {
  HeroSection,
  BenefitsSection,
  PartnersSection,
  // ExpertsSection,
} from "@/components/features/home";
import HowItWorks from "@/components/common/HowItWorks";

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
      <HowItWorks className="py-20 md:py-24 bg-gradient-to-b from-white to-gray-50 relative overflow-hidden" bgColor="bg-[hsl(25,100%,53%)]" textColor="text-black"/>
      <BenefitsSection />
      {/* <ExpertsSection /> */}
      <PartnersSection />
    </div>
  );
}
