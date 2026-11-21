// Dashboard Types and Interfaces
export interface DashboardStats {
  users?: number;
  customers?: number;
  providers?: number;
  bookings: number;
  invoices: number;
}

export interface DashboardStatCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }> | React.ForwardRefExoticComponent<any> | any;
  color: "blue" | "orange" | "green" | "purple" | "red" | "yellow";
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
