import { useAuth } from './auth/useAuth';

export interface PermissionCheck {
  canCreateInvoices: boolean;
  canCreateQuotes: boolean;
  canCreatePayments: boolean;
  canManageUsers: boolean;
  canViewAllData: boolean;
}

export function usePermissions(): PermissionCheck {
  const { isAdmin, isProvider, isCustomer } = useAuth();

  return {
    // Seuls les prestataires et admins peuvent créer des factures
    canCreateInvoices: isAdmin() || isProvider(),

    // Seuls les prestataires et admins peuvent créer des devis
    canCreateQuotes: isAdmin() || isProvider(),

    // Seuls les clients peuvent effectuer des paiements
    canCreatePayments: isCustomer(),

    // Seuls les admins peuvent gérer les utilisateurs
    canManageUsers: isAdmin(),

    // Seuls les admins peuvent voir toutes les données
    canViewAllData: isAdmin(),
  };
}
