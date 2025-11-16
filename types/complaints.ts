/**
 * Types et interfaces pour les réclamations/complaints
 */

import { Complaint as RepositoryComplaint } from '@/repositories';

// Réexport du type Complaint du repository
export type Complaint = RepositoryComplaint;

// Types pour les services
export interface CreateComplaintData {
  title: string;
  type: Complaint['type'];
  priority: Complaint['priority'];
  description: string;
  provider: string;
  appointmentId: string;
  userId?: string;
}

export interface UpdateComplaintData {
  title?: string;
  type?: Complaint['type'];
  priority?: Complaint['priority'];
  status?: Complaint['status'];
  description?: string;
}

export interface ComplaintServiceFilters {
  userId?: string;
  provider?: string;
  appointmentId?: string;
  type?: Complaint['type'];
  priority?: Complaint['priority'];
  status?: Complaint['status'];
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
  offset?: number;
}

export interface ComplaintFilters {
  searchTerm: string;
  status: string;
  type: string;
  priority: string;
}

export interface ComplaintStats {
  totalComplaints: number;
  openComplaints: number;
  inProgressComplaints: number;
  resolvedComplaints: number;
  closedComplaints: number;
}

export interface ComplaintCardProps {
  complaint: Complaint;
  onView: (complaint: Complaint) => void;
  onComment: (complaint: Complaint) => void;
}

export interface ComplaintFormProps {
  complaint?: Complaint;
  onSubmit: (data: ComplaintFormData) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

export interface ComplaintFormData {
  title: string;
  type: string;
  priority: string;
  description: string;
  provider: string;
  appointmentId: string;
}

export interface ComplaintsHeaderProps {
  onNewComplaint: () => void;
}

export interface ComplaintsSearchProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
}

export interface ComplaintsFiltersProps {
  filters: ComplaintFilters;
  onFilterChange: (key: keyof ComplaintFilters, value: string) => void;
  availableStatuses: string[];
  availableTypes: string[];
  availablePriorities: string[];
}

export interface ComplaintsTableProps {
  complaints: Complaint[];
  loading: boolean;
  error: string | null;
  onView: (complaint: Complaint) => void;
  onComment: (complaint: Complaint) => void;
}

export interface ComplaintsPageProps {
  // Props for the main page component
}
