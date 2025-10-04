// Beneficiaries Types and Interfaces

export interface Beneficiary {
  _id: string;
  id?: string; // Pour compatibilité
  name: string;
  email?: string;
  phone?: string;
  relationship: string;
  hasAccount: boolean;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface BeneficiaryFilters {
  searchTerm: string;
  relationship: string;
  hasAccount: string;
}

export interface BeneficiaryStats {
  totalBeneficiaries: number;
  withAccount: number;
  withoutAccount: number;
  relationships: string[];
}

export interface BeneficiaryCardProps {
  beneficiary: Beneficiary;
  onEdit: (beneficiary: Beneficiary) => void;
  onDelete: (id: string) => void;
}

export interface BeneficiaryFormProps {
  beneficiary?: Beneficiary;
  onSubmit: (data: BeneficiaryFormData) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

export interface BeneficiaryFormData {
  name: string;
  email?: string;
  phone?: string;
  relationship: string;
}

export interface BeneficiariesHeaderProps {
  onAddBeneficiary: () => void;
}

export interface BeneficiariesSearchProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
}

export interface BeneficiariesFiltersProps {
  filters: BeneficiaryFilters;
  onFilterChange: (key: keyof BeneficiaryFilters, value: string) => void;
  availableRelationships: string[];
}

export interface BeneficiariesTableProps {
  beneficiaries: Beneficiary[];
  loading: boolean;
  error: string | null;
  onEdit: (beneficiary: Beneficiary) => void;
  onDelete: (id: string) => void;
}

export interface BeneficiariesPageProps {
  // Props for the main page component
}
