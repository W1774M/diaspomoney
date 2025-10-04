// Quotes Types and Interfaces
export interface QuoteFilters {
  searchTerm: string;
  statusFilter: "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED" | "ALL";
  dateFilter: string;
}

export interface QuoteCardProps {
  quote: {
    id: string;
    number: string;
    title: string;
    provider: string;
    amount: number;
    status: string;
    createdAt: string;
    validUntil: string;
    services: string[];
  };
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onDownload: (id: string) => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

export interface QuotesFiltersProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  statusFilter: "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED" | "ALL";
  setStatusFilter: (
    value: "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED" | "ALL"
  ) => void;
  dateFilter: string;
  setDateFilter: (value: string) => void;
}

export interface QuotesTableProps {
  quotes: any[];
  loading: boolean;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onDownload: (id: string) => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

export interface QuotesHeaderProps {
  totalQuotes: number;
  onAddQuote: () => void;
}
