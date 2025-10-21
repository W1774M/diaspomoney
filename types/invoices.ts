// Invoices Types and Interfaces
export interface InvoiceFilters {
  searchTerm: string;
  statusFilter: 'PAID' | 'PENDING' | 'OVERDUE' | 'CANCELLED' | 'ALL';
  dateFilter: string;
}

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

export interface InvoicesTableProps {
  invoices: any[];
  loading: boolean;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onDownload: (id: string) => void;
}

export interface InvoicesHeaderProps {
  totalInvoices: number;
  onAddInvoice: () => void;
  canCreate?: boolean;
}

export interface InvoicesTabsProps {
  activeTab: 'all' | 'as-provider' | 'as-customer';
  setActiveTab: (tab: 'all' | 'as-provider' | 'as-customer') => void;
  isAdmin: boolean;
  isProvider: boolean;
  isCustomer: boolean;
}
