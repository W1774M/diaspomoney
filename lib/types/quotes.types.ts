// Quotes Types and Interfaces
import { BaseEntity } from './index';

export interface Quote extends Omit<BaseEntity, '_id'> {
  _id: string; // Requis pour BaseEntity
  id: string;
  type: 'BTP' | 'EDUCATION';
  projectType?: string; // Pour BTP
  area?: number; // Pour BTP
  features?: string[]; // Pour BTP
  budget?: number;
  timeline?: string;
  location?: {
    city: string;
    country: string;
  };
  contact: {
    name: string;
    email: string;
    phone?: string;
  };
  description?: string;
  urgency?: 'LOW' | 'MEDIUM' | 'HIGH';
  costEstimate?: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
  providerId?: string; // Pour BTP
  schoolId?: string; // Pour EDUCATION
  // Champs spécifiques EDUCATION
  studentType?: 'SELF' | 'CHILD' | 'DEPENDENT';
  studentInfo?: {
    firstName: string;
    lastName: string;
    dateOfBirth?: string;
    gender?: 'MALE' | 'FEMALE' | 'OTHER';
    nationality?: string;
  };
  academicInfo?: {
    currentLevel?: string;
    desiredProgram?: string;
    academicYear?: string;
    previousEducation?: string;
  };
  preferences?: {
    language?: string;
    schedule?: string;
    budget?: number;
    urgency?: 'LOW' | 'MEDIUM' | 'HIGH';
  };
  questions?: string;
  createdAt: Date; // Requis pour BaseEntity
  updatedAt: Date; // Requis pour BaseEntity
}

export interface QuoteFilters {
  searchTerm: string;
  statusFilter: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED' | 'ALL';
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
  statusFilter: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED' | 'ALL';
  setStatusFilter: (
    value: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED' | 'ALL'
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
  canCreate?: boolean;
}
