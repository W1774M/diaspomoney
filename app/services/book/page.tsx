"use client";

import { ServiceBookingWizard } from "@/components/services/ServiceBookingWizard";
import { useSearchParams } from "next/navigation";
import type { ServiceType } from "@/lib/types/service-booking.types";

export default function BookServicePage() {
  const searchParams = useSearchParams();
  const serviceType = searchParams.get("type") as ServiceType | null;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <ServiceBookingWizard
          initialServiceType={serviceType as ServiceType}
          onComplete={() => {}}
          onCancel={() => {}}
        />
      </div>
    </div>
  );
}

