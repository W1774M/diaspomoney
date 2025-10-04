"use client";

import { IUser } from "@/types";
import { ServiceStats } from "@/types/services";
import { useMemo } from "react";

export function useServiceStats(providers: IUser[]): ServiceStats {
  return useMemo(() => {
    const activeProviders = providers.filter(p => p.status === "ACTIVE");

    const specialties = [
      ...new Set(
        providers
          .map(p => p.specialty)
          .filter((specialty): specialty is string => Boolean(specialty))
      ),
    ].sort();

    const services = providers
      .flatMap(p =>
        p.selectedServices
          ? p.selectedServices.split(",").map(s => s.trim())
          : []
      )
      .filter((service, idx, arr) => arr.indexOf(service) === idx)
      .sort();

    return {
      totalProviders: providers.length,
      activeProviders: activeProviders.length,
      specialties,
      services,
    };
  }, [providers]);
}
