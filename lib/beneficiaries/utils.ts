import type { Beneficiary } from "@/lib/types";

/**
 * Format beneficiary name with relationship
 */
export function formatBeneficiaryName(beneficiary: Beneficiary): string {
  const name = beneficiary.name || 
               `${beneficiary.firstName || ''} ${beneficiary.lastName || ''}`.trim() ||
               beneficiary.email ||
               'Unknown';
  return `${name} (${beneficiary.relationship})`;
}

/**
 * Get beneficiary account status
 */
export function getAccountStatus(beneficiary: Beneficiary): "with" | "without" {
  return beneficiary.hasAccount ? "with" : "without";
}

/**
 * Get beneficiary account status display
 */
export function getAccountStatusDisplay(beneficiary: Beneficiary): string {
  return beneficiary.hasAccount ? "Compte actif" : "Sans compte";
}

/**
 * Get beneficiary account status color
 */
export function getAccountStatusColor(beneficiary: Beneficiary): string {
  return beneficiary.hasAccount
    ? "bg-green-100 text-green-800"
    : "bg-orange-100 text-orange-800";
}

/**
 * Check if beneficiary has contact information
 */
export function hasContactInfo(beneficiary: Beneficiary): boolean {
  return Boolean(beneficiary.email || beneficiary.phone);
}

/**
 * Get beneficiary contact methods
 */
export function getContactMethods(beneficiary: Beneficiary): string[] {
  const methods: string[] = [];
  if (beneficiary.email) methods.push("email");
  if (beneficiary.phone) methods.push("phone");
  return methods;
}

/**
 * Format beneficiary creation date
 */
export function formatCreationDate(beneficiary: Beneficiary): string {
  return new Date(beneficiary.createdAt).toLocaleDateString("fr-FR");
}

/**
 * Get beneficiary initials
 */
export function getBeneficiaryInitials(beneficiary: Beneficiary): string {
  const name = beneficiary.name || 
               `${beneficiary.firstName || ''} ${beneficiary.lastName || ''}`.trim() ||
               beneficiary.email ||
               'Unknown';
  return name
    .split(" ")
    .filter((word: string) => word && word.length > 0)
    .map((word: string) => word.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?";
}

/**
 * Check if beneficiary is recently added (within last 7 days)
 */
export function isRecentlyAdded(beneficiary: Beneficiary): boolean {
  const createdAt = new Date(beneficiary.createdAt);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - createdAt.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays <= 7;
}
