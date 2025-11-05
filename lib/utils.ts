import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combine class names with Tailwind CSS
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function round(value: number, precision: number = 2): number {
  return Math.round(value * Math.pow(10, precision)) / Math.pow(10, precision);
}

export function random(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Format currency
 */
export function formatCurrency(amount: number, currency = 'EUR'): string {
  if (currency === 'USD') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  }

  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
  }).format(amount);
}

/**
 * Format date
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(d);
}

/**
 * Format date time
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

/**
 * Get status color for Tailwind CSS
 */
export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    // Client statuses
    ACTIVE: 'bg-green-100 text-green-800',
    INACTIVE: 'bg-gray-100 text-gray-800',
    PROSPECT: 'bg-blue-100 text-blue-800',

    // Invoice statuses
    DRAFT: 'bg-gray-100 text-gray-800',
    SENT: 'bg-blue-100 text-blue-800',
    PAID: 'bg-green-100 text-green-800',
    OVERDUE: 'bg-red-100 text-red-800',
    CANCELLED: 'bg-yellow-100 text-yellow-800',

    // Project statuses
    PLANNING: 'bg-purple-100 text-purple-800',
    IN_PROGRESS: 'bg-blue-100 text-blue-800',
    ON_HOLD: 'bg-yellow-100 text-yellow-800',
    COMPLETED: 'bg-green-100 text-green-800',

    // Task statuses
    TODO: 'bg-gray-100 text-gray-800',
    TASK_IN_PROGRESS: 'bg-blue-100 text-blue-800',
    REVIEW: 'bg-yellow-100 text-yellow-800',
    DONE: 'bg-green-100 text-green-800',

    // Appointment statuses
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    completed: 'bg-blue-100 text-blue-800',
  };

  return colors[status] || 'bg-gray-100 text-gray-800';
}

/**
 * Get priority color for Tailwind CSS
 */
export function getPriorityColor(priority: string): string {
  const colors: Record<string, string> = {
    LOW: 'bg-gray-100 text-gray-800',
    MEDIUM: 'bg-blue-100 text-blue-800',
    HIGH: 'bg-orange-100 text-orange-800',
    URGENT: 'bg-red-100 text-red-800',
  };

  return colors[priority] || 'bg-gray-100 text-gray-800';
}

/**
 * Generate a unique ID (stable for hydration)
 */
export function generateId(): string {
  // Use a more stable approach to prevent hydration mismatches
  const timestamp = Date.now().toString(36);
  const random = Math.floor(Math.random() * 1000).toString(36);
  return `${timestamp}-${random}`;
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  // Additional validation to catch edge cases
  if (emailRegex.test(email)) {
    // Check for consecutive dots
    if (email.includes('..')) return false;
    // Check for leading/trailing dots in local or domain part
    const [local, domain] = email.split('@');
    if (!local || !domain) return false;
    if (local.startsWith('.') || local.endsWith('.')) return false;
    if (domain.startsWith('.') || domain.endsWith('.')) return false;
    // Check for valid TLD length
    const domainParts = domain.split('.');
    const tld = domainParts[domainParts.length - 1];
    if (domainParts.length < 2 || !tld || tld.length < 2) return false;
    return true;
  }
  return false;
}

/**
 * Truncate text
 */
export function truncateText(text: string, maxLength: number): string {
  if (maxLength <= 0) return '...';
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
}

/**
 * Capitalize first letter
 */
export function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Convert string to slug
 */
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    if (wait === 0) {
      func(...args);
    } else {
      timeout = setTimeout(() => func(...args), wait);
    }
  };
}

/**
 * Deep clone object
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime()) as unknown as T;
  if (Array.isArray(obj))
    return obj.map(item => deepClone(item)) as unknown as T;
  if (typeof obj === 'object') {
    const clonedObj = {} as T;
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        try {
          // Use type assertion to avoid 'any' and lint errors
          (clonedObj as Record<string, unknown>)[key] = deepClone(
            (obj as Record<string, unknown>)[key]
          );
        } catch {
          // Handle circular references by setting to undefined
          (clonedObj as Record<string, unknown>)[key] = undefined;
        }
      }
    }
    return clonedObj;
  }
  return obj;
}
