// Settings Types and Interfaces
export interface ProfileData {
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  address: string;
  dateOfBirth: string;
  countryOfResidence: string;
  targetCountry: string;
  targetCity: string;
  monthlyBudget: string;
  specialty: string;
}

export interface PreferencesData {
  language: string;
  timezone: string;
  notifications: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
}

export interface SecurityData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  twoFactorEnabled: boolean;
}

export interface BillingData {
  paymentMethod: string;
  billingAddress: string;
  taxId: string;
}

export interface PrivacyData {
  profileVisibility: 'public' | 'private' | 'friends';
  dataSharing: boolean;
  analytics: boolean;
  marketingConsent: boolean;
  kycConsent: boolean;
}

export interface SettingsTab {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

export interface SettingsHeaderProps {
  userName: string;
  userEmail: string;
}

export interface SettingsTabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  tabs: SettingsTab[];
}

export interface ProfileSettingsProps {
  data: ProfileData;
  setData: (data: ProfileData) => void;
  onSave: () => void;
  saving: boolean;
}

export interface SecuritySettingsProps {
  data: SecurityData;
  setData: (data: SecurityData) => void;
  onSave: () => void;
  saving: boolean;
}

export interface NotificationSettingsProps {
  data: PreferencesData;
  setData: (data: PreferencesData) => void;
  onSave: () => void;
  saving: boolean;
}

export interface BillingSettingsProps {
  data: BillingData;
  setData: (data: BillingData) => void;
  onSave: () => void;
  saving: boolean;
}

export interface PrivacySettingsProps {
  data: PrivacyData;
  setData: (data: PrivacyData) => void;
  onSave: () => void;
  saving: boolean;
}
