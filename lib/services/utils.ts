import { Provider } from '@/hooks/useProviders';
import { getProviderRatingStats } from '@/mocks';
import { USER_STATUSES } from '../constants';

/**
 * Extract unique specialties from providers
 */
export function getUniqueSpecialties(providers: Provider[]): string[] {
  return [
    ...new Set(
      providers
        .flatMap(p => p.specialties || [])
        .filter((specialty): specialty is string => Boolean(specialty)),
    ),
  ].sort();
}

/**
 * Extract unique services from providers
 */
export function getAvailableServices(providers: Provider[]): string[] {
  return providers
    .flatMap(p => {
      if (!p['selectedServices']) return [];
      // Gérer le cas où selectedServices est une chaîne ou un tableau
      if (Array.isArray(p['selectedServices'])) {
        return p['selectedServices'].map((s: string) => String(s).trim());
      }
      const servicesValue = p['selectedServices'] as unknown;
      if (typeof servicesValue === 'string' && servicesValue.length > 0) {
        return servicesValue.split(',').map((s: string) => s.trim());
      }
      return [];
    })
    .filter((service, idx, arr) => arr.indexOf(service) === idx)
    .sort();
}

/**
 * Extract unique cities from providers
 */
export function getAvailableCities(providers: Provider[]): string[] {
  return [
    ...new Set(
      providers
        .map(p => p.address)
        .filter((address): address is string => Boolean(address)),
    ),
  ].sort();
}

/**
 * Format provider name with company
 * Utilise name comme fallback si firstName et lastName ne sont pas disponibles
 */
export function formatProviderName(provider: Provider): string {
  // Si firstName et lastName sont disponibles, les utiliser
  if (provider.firstName && provider.lastName) {
    const name = `${provider.firstName} ${provider.lastName}`;
    return provider['company'] ? `${name} (${provider['company']})` : name;
  }
  
  // Sinon, utiliser le champ name s'il existe
  if (provider['name']) {
    return provider['company'] 
      ? `${provider['name']} (${provider['company']})` 
      : provider['name'];
  }
  
  // Fallback final : utiliser firstName seul, lastName seul, ou email
  const fallbackName = provider.firstName || provider.lastName || provider.email || 'Prestataire';
  return provider['company'] 
    ? `${fallbackName} (${provider['company']})` 
    : fallbackName;
}

/**
 * Get provider rating display
 */

export function getProviderRating(provider: Provider): number {
  const stats = getProviderRatingStats(provider._id.toString());
  return (stats as any)?.averageRating || provider.rating || 0;
}

/**
 * Check if provider is available
 */
export function isProviderAvailable(provider: Provider): boolean {
  return (
    provider.status === USER_STATUSES.ACTIVE &&
    Array.isArray(provider['availabilities']) &&
    provider['availabilities'].length > 0
  );
}

/**
 * Get provider's primary service
 */
export function getPrimaryService(provider: Provider): string {
  if (!provider['selectedServices']) return 'Service non spécifié';

  let services: string[] = [];
  if (Array.isArray(provider['selectedServices'])) {
    services = provider['selectedServices'].map((s: string) => String(s).trim());
  } else {
    const servicesValue = provider['selectedServices'] as unknown;
    if (typeof servicesValue === 'string' && servicesValue.length > 0) {
      services = servicesValue.split(',').map((s: string) => s.trim());
    }
  }
  return services[0] || 'Service non spécifié';
}

/**
 * Get provider's availability status
 */
export function getAvailabilityStatus(
  provider: Provider,
): 'available' | 'busy' | 'offline' {
  if (provider.status !== USER_STATUSES.ACTIVE) return 'offline';
  if (!provider['availabilities'] || provider['availabilities'].length === 0)
    return 'offline';
  return 'available';
}

/**
 * Calculate price with DiaspoMoney commission
 */
export function calculatePriceWithCommission(
  basePrice: number,
  commissionRate: number = 0.2,
): number {
  return Math.round(basePrice * (1 + commissionRate));
}

/**
 * Get commission amount
 */
export function getCommissionAmount(
  basePrice: number,
  commissionRate: number = 0.2,
): number {
  return Math.round(basePrice * commissionRate);
}

/**
 * Get service price by service name
 */
export function getServicePrice(
  provider: Provider,
  serviceName: string,
): number {
  if (!provider['services'] || !Array.isArray(provider['services'])) {
    return (provider as any).price || 0; // Fallback to provider base price
  }

  const service = provider['services'].find(
    s =>
      s.name.toLowerCase().includes(serviceName.toLowerCase()) ||
      serviceName.toLowerCase().includes(s.name.toLowerCase()),
  );

  return service?.price || (provider as any).price || 0;
}

/**
 * Get consultation price (for video consultation)
 */
export function getConsultationPrice(provider: Provider): number {
  return getServicePrice(provider, 'consultation');
}
