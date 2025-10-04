// Dashboard Services Types and Interfaces

export interface DashboardServiceTab {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

export interface DashboardServicesHeaderProps {
  title: string;
  description: string;
}

export interface DashboardServicesTabsProps {
  tabs: DashboardServiceTab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export interface DashboardServicesContentProps {
  activeTab: string;
  children: React.ReactNode;
}

export interface DashboardServicesPageProps {
  // Props for the main page component
}
