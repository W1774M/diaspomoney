// Users Types and Interfaces
export interface UserFilters {
  searchTerm: string;
  roleFilter: "ADMIN" | "PROVIDER" | "CUSTOMER" | "CSM" | "ALL";
  statusFilter: "ACTIVE" | "INACTIVE" | "PENDING" | "SUSPENDED" | "ALL";
}

export interface UserCardProps {
  user: {
    _id: string;
    name?: string;
    email?: string;
    phone?: string;
    company?: string;
    roles?: string[];
    status?: string;
    avatar?: {
      image: string;
      name: string;
    };
  };
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
  onView: (id: string) => void;
  onSendEmail: (user: any) => void;
  onCall: (user: any) => void;
}

export interface UsersFiltersProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  roleFilter: "ADMIN" | "PROVIDER" | "CUSTOMER" | "CSM" | "ALL";
  setRoleFilter: (
    value: "ADMIN" | "PROVIDER" | "CUSTOMER" | "CSM" | "ALL"
  ) => void;
  statusFilter: "ACTIVE" | "INACTIVE" | "PENDING" | "SUSPENDED" | "ALL";
  setStatusFilter: (
    value: "ACTIVE" | "INACTIVE" | "PENDING" | "SUSPENDED" | "ALL"
  ) => void;
}

export interface UsersTableProps {
  users: any[];
  loading: boolean;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
  onView: (id: string) => void;
  onSendEmail: (user: any) => void;
  onCall: (user: any) => void;
}

export interface UsersHeaderProps {
  totalUsers: number;
  onAddUser: () => void;
}
