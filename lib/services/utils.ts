import { getProviderRatingStats } from "@/mocks";
import { IUser } from "@/types";

/**
 * Extract unique specialties from providers
 */
export function getUniqueSpecialties(providers: IUser[]): string[] {
  return [
    ...new Set(
      providers
        .map(p => p.specialty)
        .filter((specialty): specialty is string => Boolean(specialty))
    ),
  ].sort();
}

/**
 * Extract unique services from providers
 */
export function getAvailableServices(providers: IUser[]): string[] {
  return providers
    .flatMap(p =>
      p.selectedServices ? p.selectedServices.split(",").map(s => s.trim()) : []
    )
    .filter((service, idx, arr) => arr.indexOf(service) === idx)
    .sort();
}

/**
 * Extract unique cities from providers
 */
export function getAvailableCities(providers: IUser[]): string[] {
  return [
    ...new Set(
      providers
        .map(p => p.address)
        .filter((address): address is string => Boolean(address))
    ),
  ].sort();
}

/**
 * Format provider name with company
 */
export function formatProviderName(provider: IUser): string {
  return provider.company
    ? `${provider.name} (${provider.company})`
    : provider.name;
}

/**
 * Get provider rating display
 */

export function getProviderRating(provider: IUser): number {
  const stats = getProviderRatingStats(provider._id);
  return stats?.averageRating || 0;
}

/**
 * Check if provider is available
 */
export function isProviderAvailable(provider: IUser): boolean {
  return (
    provider.status === "ACTIVE" &&
    Array.isArray(provider.availabilities) &&
    provider.availabilities.length > 0
  );
}

/**
 * Get provider's primary service
 */
export function getPrimaryService(provider: IUser): string {
  if (!provider.selectedServices) return "Service non spécifié";

  const services = provider.selectedServices.split(",").map(s => s.trim());
  return services[0] || "Service non spécifié";
}

/**
 * Get provider's availability status
 */
export function getAvailabilityStatus(
  provider: IUser
): "available" | "busy" | "offline" {
  if (provider.status !== "ACTIVE") return "offline";
  if (!provider.availabilities || provider.availabilities.length === 0)
    return "offline";
  return "available";
}

/**
 * Calculate price with DiaspoMoney commission
 */
export function calculatePriceWithCommission(
  basePrice: number,
  commissionRate: number = 0.15
): number {
  return Math.round(basePrice * (1 + commissionRate));
}

/**
 * Get commission amount
 */
export function getCommissionAmount(
  basePrice: number,
  commissionRate: number = 0.15
): number {
  return Math.round(basePrice * commissionRate);
}

/**
 * Get service price by service name
 */
export function getServicePrice(provider: IUser, serviceName: string): number {
  if (!provider.services || !Array.isArray(provider.services)) {
    return (provider as any).price || 0; // Fallback to provider base price
  }

  const service = provider.services.find(
    s =>
      s.name.toLowerCase().includes(serviceName.toLowerCase()) ||
      serviceName.toLowerCase().includes(s.name.toLowerCase())
  );

  return service?.price || (provider as any).price || 0;
}

/**
 * Get consultation price (for video consultation)
 */
export function getConsultationPrice(provider: IUser): number {
  return getServicePrice(provider, "consultation");
}
