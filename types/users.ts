// Users Types and Interfaces
export interface UserFilters {
  searchTerm: string;
  roleFilter: 'ADMIN' | 'PROVIDER' | 'CUSTOMER' | 'CSM' | 'ALL';
  statusFilter: 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'SUSPENDED' | 'ALL';
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
  onDelete: (_id: string) => void;
  onEdit: (_id: string) => void;
  onView: (_id: string) => void;
  onSendEmail: (_user: any) => void;
  onCall: (_user: any) => void;
}

export interface UsersFiltersProps {
  searchTerm: string;
  setSearchTerm: (_value: string) => void;
  roleFilter: 'ADMIN' | 'PROVIDER' | 'CUSTOMER' | 'CSM' | 'ALL';
  setRoleFilter: (
    _value: 'ADMIN' | 'PROVIDER' | 'CUSTOMER' | 'CSM' | 'ALL'
  ) => void;
  statusFilter: 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'SUSPENDED' | 'ALL';
  setStatusFilter: (
    _value: 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'SUSPENDED' | 'ALL'
  ) => void;
}

export interface UsersTableProps {
  users: any[];
  loading: boolean;
  onDelete: (_id: string) => void;
  onEdit: (_id: string) => void;
  onView: (_id: string) => void;
  onSendEmail: (_user: any) => void;
  onCall: (_user: any) => void;
}

export interface UsersHeaderProps {
  totalUsers: number;
  onAddUser: () => void;
}
