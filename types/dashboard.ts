// Dashboard Types and Interfaces
export interface DashboardStats {
  users?: number;
  customers?: number;
  providers?: number;
  appointments: number;
  invoices: number;
}

export interface DashboardStatCardProps {
  title: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  color: "blue" | "orange" | "green" | "purple" | "red";
  description?: string;
}

export interface DashboardActionCardProps {
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  color: "blue" | "orange" | "green" | "purple" | "red";
}

export interface DashboardHeaderProps {
  userName: string;
  subtitle?: string;
}

export interface DashboardStatsProps {
  stats: DashboardStats;
  isAdmin: boolean;
  isCSM: boolean;
}

export interface DashboardQuickActionsProps {
  isAdmin: boolean;
  isCSM: boolean;
}
