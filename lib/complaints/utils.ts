import { Complaint } from "@/types/complaints";

/**
 * Get complaint status color
 */
export function getStatusColor(status: string): string {
  switch (status) {
    case "OPEN":
      return "text-red-600 bg-red-100";
    case "IN_PROGRESS":
      return "text-yellow-600 bg-yellow-100";
    case "RESOLVED":
      return "text-green-600 bg-green-100";
    case "CLOSED":
      return "text-gray-600 bg-gray-100";
    default:
      return "text-gray-600 bg-gray-100";
  }
}

/**
 * Get complaint status display text
 */
export function getStatusText(status: string): string {
  switch (status) {
    case "OPEN":
      return "Ouverte";
    case "IN_PROGRESS":
      return "En cours";
    case "RESOLVED":
      return "Résolue";
    case "CLOSED":
      return "Fermée";
    default:
      return status;
  }
}

/**
 * Get complaint priority color
 */
export function getPriorityColor(priority: string): string {
  switch (priority) {
    case "HIGH":
      return "text-red-600 bg-red-100";
    case "MEDIUM":
      return "text-yellow-600 bg-yellow-100";
    case "LOW":
      return "text-green-600 bg-green-100";
    default:
      return "text-gray-600 bg-gray-100";
  }
}

/**
 * Get complaint priority display text
 */
export function getPriorityText(priority: string): string {
  switch (priority) {
    case "HIGH":
      return "Élevée";
    case "MEDIUM":
      return "Moyenne";
    case "LOW":
      return "Faible";
    default:
      return priority;
  }
}

/**
 * Get complaint type display text
 */
export function getTypeText(type: string): string {
  switch (type) {
    case "QUALITY":
      return "Qualité";
    case "DELAY":
      return "Retard";
    case "BILLING":
      return "Facturation";
    case "COMMUNICATION":
      return "Communication";
    default:
      return type;
  }
}

/**
 * Format complaint date
 */
export function formatComplaintDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("fr-FR");
}

/**
 * Check if complaint is recent (within last 7 days)
 */
export function isRecentComplaint(complaint: Complaint): boolean {
  const createdAt = new Date(complaint.createdAt);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - createdAt.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays <= 7;
}

/**
 * Check if complaint is urgent (high priority and open)
 */
export function isUrgentComplaint(complaint: Complaint): boolean {
  return complaint.priority === "HIGH" && complaint.status === "OPEN";
}

/**
 * Get complaint age in days
 */
export function getComplaintAge(complaint: Complaint): number {
  const createdAt = new Date(complaint.createdAt);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - createdAt.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Check if complaint needs attention (open for more than 3 days)
 */
export function needsAttention(complaint: Complaint): boolean {
  return complaint.status === "OPEN" && getComplaintAge(complaint) > 3;
}
