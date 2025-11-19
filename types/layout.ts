/**
 * Types pour les composants de layout (Sidebar, Header, etc.)
 */

import { LucideIcon } from 'lucide-react';

/**
 * Dashboard disponible pour un utilisateur
 */
export interface Dashboard {
  name: string;
  href: string;
  role: string;
}

/**
 * Section de navigation dans la sidebar
 */
export interface NavigationSection {
  title: string;
  items: NavigationItem[];
}

/**
 * Élément de navigation dans la sidebar
 */
export interface NavigationItem {
  name: string;
  key: string;
  href?: string;
  icon?: LucideIcon;
  show: boolean;
  badge?: number;
  values?: NavigationSubItem[];
}

/**
 * Sous-élément de navigation (pour les menus déroulants)
 */
export interface NavigationSubItem {
  name: string;
  key: string;
  href: string;
  icon?: LucideIcon;
  show: boolean;
  badge?: number;
}

/**
 * Props pour le composant NavigationLink
 */
export interface NavigationLinkProps {
  item: NavigationItem;
  pathname: string;
}

/**
 * Props pour le composant NavigationMenu
 */
export interface NavigationMenuProps {
  item: NavigationItem;
  pathname: string;
  isExpanded: boolean;
  onToggle: () => void;
}

/**
 * Props pour le composant UserSection
 */
export interface UserSectionProps {
  user: {
    name?: string;
    email?: string;
    roles?: string[];
    avatar?: string | { image?: string; name?: string };
  } | null;
}

/**
 * Props pour le composant FooterActions
 */
export interface FooterActionsProps {
  onSignOut: () => void;
  isSigningOut: boolean;
  pathname: string;
  isSettingsExpanded: boolean;
  onToggleSettings: () => void;
}
