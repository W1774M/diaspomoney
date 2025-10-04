/**
 * Get invoice status color classes
 */
export function getInvoiceStatusColor(status: string): string {
  switch (status) {
    case "PAID":
      return "bg-green-100 text-green-800";
    case "PENDING":
      return "bg-yellow-100 text-yellow-800";
    case "OVERDUE":
      return "bg-red-100 text-red-800";
    case "CANCELLED":
      return "bg-gray-100 text-gray-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

/**
 * Get invoice status display text
 */
export function getInvoiceStatusText(status: string): string {
  switch (status) {
    case "PAID":
      return "Payée";
    case "PENDING":
      return "En attente";
    case "OVERDUE":
      return "En retard";
    case "CANCELLED":
      return "Annulée";
    default:
      return status;
  }
}

/**
 * Format currency amount
 */
export function formatCurrency(
  amount: number,
  currency: string = "EUR"
): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: currency,
  }).format(amount);
}

/**
 * Format date
 */
export function formatDate(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return dateObj.toLocaleDateString("fr-FR");
}

/**
 * Check if invoice is overdue
 */
export function isInvoiceOverdue(invoice: any): boolean {
  if (invoice.status === "PAID" || invoice.status === "CANCELLED") {
    return false;
  }

  const dueDate = new Date(invoice.dueDate);
  const today = new Date();
  return dueDate < today;
}

/**
 * Get invoice priority
 */
export function getInvoicePriority(invoice: any): "low" | "medium" | "high" {
  if (invoice.status === "PAID" || invoice.status === "CANCELLED") {
    return "low";
  }

  if (isInvoiceOverdue(invoice)) {
    return "high";
  }

  const dueDate = new Date(invoice.dueDate);
  const today = new Date();
  const daysUntilDue = Math.ceil(
    (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysUntilDue <= 3) {
    return "high";
  } else if (daysUntilDue <= 7) {
    return "medium";
  }

  return "low";
}
