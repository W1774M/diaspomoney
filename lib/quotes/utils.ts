/**
 * Get quote status color classes
 */
export function getQuoteStatusColor(status: string): string {
  switch (status) {
    case "PENDING":
      return "bg-yellow-100 text-yellow-800";
    case "APPROVED":
      return "bg-green-100 text-green-800";
    case "REJECTED":
      return "bg-red-100 text-red-800";
    case "EXPIRED":
      return "bg-gray-100 text-gray-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

/**
 * Get quote status display text
 */
export function getQuoteStatusText(status: string): string {
  switch (status) {
    case "PENDING":
      return "En attente";
    case "APPROVED":
      return "Approuvé";
    case "REJECTED":
      return "Rejeté";
    case "EXPIRED":
      return "Expiré";
    default:
      return status;
  }
}

/**
 * Format currency amount
 */
export function formatCurrency(
  amount: number,
  currency: string = "EUR",
): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: currency,
  }).format(amount);
}

/**
 * Format date
 */
export function formatDate(date: string | Date): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return dateObj.toLocaleDateString("fr-FR");
}

/**
 * Check if quote is expired
 */
export function isQuoteExpired(quote: any): boolean {
  const validUntil = new Date(quote.validUntil);
  const today = new Date();
  return validUntil < today;
}

/**
 * Get quote priority
 */
export function getQuotePriority(quote: any): "low" | "medium" | "high" {
  if (quote.status === "APPROVED" || quote.status === "REJECTED") {
    return "low";
  }

  if (isQuoteExpired(quote)) {
    return "high";
  }

  const validUntil = new Date(quote.validUntil);
  const today = new Date();
  const daysUntilExpiry = Math.ceil(
    (validUntil.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (daysUntilExpiry <= 3) {
    return "high";
  } else if (daysUntilExpiry <= 7) {
    return "medium";
  }

  return "low";
}
