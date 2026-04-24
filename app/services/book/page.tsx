"use client";

import { ServiceBookingWizard } from "@/components/services/ServiceBookingWizard";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import type { ServiceType } from "@/lib/types/service-booking.types";

function BookServiceContent() {
  const searchParams = useSearchParams();
  const serviceType = searchParams.get("type") as ServiceType | null;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <ServiceBookingWizard
          {...(serviceType ? { initialServiceType: serviceType } : {})}
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

