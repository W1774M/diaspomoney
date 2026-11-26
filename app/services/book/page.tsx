"use client";

import { ServiceBookingWizard } from "@/components/services/ServiceBookingWizard";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import type { ServiceType } from "@/lib/types/service-booking.types";
import { getHealthClinicById } from "@/lib/clinics";

function BookServiceContent() {
  const searchParams = useSearchParams();
  const serviceType = searchParams.get("type") as ServiceType | null;
  const selectedClinic = getHealthClinicById(searchParams.get("clinic"));

  return (
    <div className="min-h-dvh bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <ServiceBookingWizard
          {...(serviceType ? { initialServiceType: serviceType } : {})}
          initialClinic={selectedClinic}
          onComplete={() => {}}
          onCancel={() => {}}
        />
      </div>
    </div>
  );
}

export default function BookServicePage() {
  return (
    <Suspense fallback={null}>
      <BookServiceContent />
    </Suspense>
  );
}

