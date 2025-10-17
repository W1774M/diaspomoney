/**
 * Utilitaires Tailwind CSS - DiaspoMoney
 */

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// === FONCTION PRINCIPALE DE FUSION ===
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// === CLASSES PRÉDÉFINIES DIASPOMONEY ===

// Couleurs de marque
export const brandColors = {
  primary: 'bg-diaspomoney-500 text-white hover:bg-diaspomoney-600',
  secondary: 'bg-diaspomoney-100 text-diaspomoney-700 hover:bg-diaspomoney-200',
  accent: 'bg-diaspomoney-50 text-diaspomoney-600 hover:bg-diaspomoney-100',
} as const;

// États de statut
export const statusColors = {
  success: 'bg-success-500 text-white hover:bg-success-600',
  warning: 'bg-warning-500 text-white hover:bg-warning-600',
  error: 'bg-error-500 text-white hover:bg-error-600',
  info: 'bg-diaspomoney-500 text-white hover:bg-diaspomoney-600',
} as const;

// Tailles de boutons
export const buttonSizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
  xl: 'px-8 py-4 text-xl',
} as const;

// Variantes de boutons
export const buttonVariants = {
  solid:
    'bg-diaspomoney-500 text-white hover:bg-diaspomoney-600 focus:ring-diaspomoney-500',
  outline:
    'border border-diaspomoney-500 text-diaspomoney-500 hover:bg-diaspomoney-50 focus:ring-diaspomoney-500',
  ghost:
    'text-diaspomoney-500 hover:bg-diaspomoney-50 focus:ring-diaspomoney-500',
  link: 'text-diaspomoney-500 underline hover:text-diaspomoney-600 focus:ring-diaspomoney-500',
} as const;

// Formes de boutons
export const buttonShapes = {
  rounded: 'rounded-md',
  pill: 'rounded-full',
  square: 'rounded-none',
} as const;

// Classes de base pour les boutons
export const buttonBase =
  'inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';

// Classes de base pour les cartes
export const cardBase =
  'bg-white rounded-lg shadow-sm border border-gray-200 p-6';

// Classes de base pour les inputs
export const inputBase =
  'block w-full rounded-md border-gray-300 shadow-sm focus:border-diaspomoney-500 focus:ring-diaspomoney-500 sm:text-sm';

// Classes de base pour les modales
export const modalBase =
  'fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50';

// Classes de base pour les notifications
export const notificationBase =
  'fixed top-4 right-4 z-50 max-w-sm w-full bg-white rounded-lg shadow-lg border border-gray-200 p-4';

// Classes d'animation
export const animations = {
  fadeIn: 'animate-fade-in',
  slideUp: 'animate-slide-up',
  slideDown: 'animate-slide-down',
  bounce: 'animate-bounce-gentle',
} as const;

// Classes de responsive
export const responsive = {
  mobile: 'sm:hidden',
  tablet: 'hidden sm:block md:hidden',
  desktop: 'hidden md:block',
  large: 'hidden lg:block',
} as const;

// Classes de spacing
export const spacing = {
  xs: 'p-1',
  sm: 'p-2',
  md: 'p-4',
  lg: 'p-6',
  xl: 'p-8',
  '2xl': 'p-12',
} as const;

// Classes de typographie
export const typography = {
  h1: 'text-4xl font-bold text-gray-900',
  h2: 'text-3xl font-semibold text-gray-900',
  h3: 'text-2xl font-semibold text-gray-900',
  h4: 'text-xl font-semibold text-gray-900',
  h5: 'text-lg font-semibold text-gray-900',
  h6: 'text-base font-semibold text-gray-900',
  body: 'text-base text-gray-700',
  caption: 'text-sm text-gray-500',
  small: 'text-xs text-gray-400',
} as const;

// === FONCTIONS UTILITAIRES ===

// Créer un bouton avec les classes appropriées
export function createButton({
  variant = 'solid',
  size = 'md',
  shape = 'rounded',
  status,
  className,
  // ..._props
}: {
  variant?: keyof typeof buttonVariants;
  size?: keyof typeof buttonSizes;
  shape?: keyof typeof buttonShapes;
  status?: keyof typeof statusColors;
  className?: string;
  [key: string]: any;
}) {
  const baseClasses = buttonBase;
  const variantClasses = status
    ? statusColors[status]
    : buttonVariants[variant];
  const sizeClasses = buttonSizes[size];
  const shapeClasses = buttonShapes[shape];

  return cn(baseClasses, variantClasses, sizeClasses, shapeClasses, className);
}

// Créer une carte avec les classes appropriées
export function createCard({
  variant = 'default',
  className,
  // ..._props
}: {
  variant?: 'default' | 'elevated' | 'outlined';
  className?: string;
  [key: string]: any;
}) {
  const variants = {
    default: cardBase,
    elevated: 'bg-white rounded-lg shadow-lg border border-gray-200 p-6',
    outlined: 'bg-white rounded-lg border-2 border-gray-200 p-6',
  };

  return cn(variants[variant], className);
}

// Créer un input avec les classes appropriées
export function createInput({
  // _variant = 'default',
  size = 'md',
  status,
  className,
  // ..._props
}: {
  variant?: 'default' | 'filled' | 'outlined';
  size?: 'sm' | 'md' | 'lg';
  status?: 'success' | 'warning' | 'error';
  className?: string;
  [key: string]: any;
}) {
  const baseClasses = inputBase;
  const sizeClasses = {
    sm: 'text-sm py-1.5',
    md: 'text-base py-2',
    lg: 'text-lg py-3',
  };
  const statusClasses = status
    ? {
        success:
          'border-success-500 focus:border-success-500 focus:ring-success-500',
        warning:
          'border-warning-500 focus:border-warning-500 focus:ring-warning-500',
        error: 'border-error-500 focus:border-error-500 focus:ring-error-500',
      }[status]
    : '';

  return cn(baseClasses, sizeClasses[size], statusClasses, className);
}

// Créer une notification avec les classes appropriées
export function createNotification({
  type = 'info',
  className,
  // ..._props
}: {
  type?: 'success' | 'warning' | 'error' | 'info';
  className?: string;
  [key: string]: any;
}) {
  const typeClasses = {
    success: 'border-success-200 bg-success-50',
    warning: 'border-warning-200 bg-warning-50',
    error: 'border-error-200 bg-error-50',
    info: 'border-diaspomoney-200 bg-diaspomoney-50',
  };

  return cn(notificationBase, typeClasses[type], className);
}

// Suppression du bloc d'exports redondant pour éviter les conflits de déclaration
