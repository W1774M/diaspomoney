import { BaseEntity } from ".";

// ========================
// === TYPES INVOICES ====
// ========================

// --- Invoice Entity ---
export interface Invoice extends Omit<BaseEntity, '_id'> {
  _id: string; // Requis pour BaseEntity
  id: string; // Alias pour _id
  invoiceNumber: string;
  customerId: string;
  providerId: string;
  transactionId?: string; // ID de la transaction associée
  bookingId?: string; // ID de la réservation associée
  amount: number;
  currency: string;
  tax?: number; // Taxe
  totalAmount?: number; // Montant total (amount + tax)
  status: string;
  issueDate: Date;
  dueDate: Date;
  paymentDate?: Date;
  paidDate?: Date;
  paidAt?: Date; // Alias pour paidDate
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  notes?: string;
  metadata?: Record<string, any>; // Métadonnées supplémentaires
  billingAddress?: {
    street?: string;
    city?: string;
    country?: string;
    postalCode?: string;
  }; // Adresse de facturation
  userId: string;
  createdAt: Date; // Requis pour BaseEntity
  updatedAt: Date; // Requis pour BaseEntity
}

// --- Extended Invoice Interface ---
export interface InvoiceExtended extends Invoice {
  notes?: string;
  paymentDate?: Date;
  paidDate?: Date;
}

// --- Filters ---
export interface InvoiceFilters {
  searchTerm: string;
  statusFilter: 'PAID' | 'PENDING' | 'OVERDUE' | 'CANCELLED' | 'ALL';
  dateFilter: string;
}

// --- Invoice Status ---
export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED',
}

export const INVOICE_STATUSES = Object.values(InvoiceStatus);

// --- UI Props Interfaces ---

// Props for a single Invoice Card
export interface InvoiceCardProps {
  invoice: {
    _id: string;
    invoiceNumber: string;
    customerId: string;
    providerId: string;
    amount: number;
    currency: string;
    status: string;
    issueDate: Date;
    dueDate: Date;
    paidDate?: Date;
    items: Array<{
      description: string;
      quantity: number;
      unitPrice: number;
      total: number;
    }>;
  };
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onDownload: (id: string) => void;
}

// Props for the filters above the invoice table/list
export interface InvoicesFiltersProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  statusFilter: 'PAID' | 'PENDING' | 'OVERDUE' | 'CANCELLED' | 'ALL';
  setStatusFilter: (
    value: 'PAID' | 'PENDING' | 'OVERDUE' | 'CANCELLED' | 'ALL'
  ) => void;
  dateFilter: string;
  setDateFilter: (value: string) => void;
}

// Props for the main invoice table
export interface InvoicesTableProps {
  invoices: any[];
  loading: boolean;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onDownload: (id: string) => void;
}

// Header props, for totals/action-button permissions
export interface InvoicesHeaderProps {
  totalInvoices: number;
  onAddInvoice: () => void;
  canCreate?: boolean;
}

// Tabbed view for invoices (e.g., all, as-provider, as-customer)
export interface InvoicesTabsProps {
  activeTab: 'all' | 'as-provider' | 'as-customer';
  setActiveTab: (tab: 'all' | 'as-provider' | 'as-customer') => void;
  isAdmin: boolean;
  isProvider: boolean;
  isCustomer: boolean;
}

// --- Misc Types ---

// Status for UI select options, etc.
export interface InvoiceStatusExtended {
  value: string;
  label: string;
}
