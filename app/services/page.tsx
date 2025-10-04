"use client";

import { ServicesPage } from "@/components/services";
import { Suspense } from "react";

export default function Services() {
  return (
    <Suspense fallback={<div>Chargement...</div>}>
      <ServicesPage />
    </Suspense>
  );
}
