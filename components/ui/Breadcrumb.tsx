'use client';

import { ChevronRight, Home } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface BreadcrumbItem {
  label: string;
  href: string;
}

interface BreadcrumbProps {
  items?: BreadcrumbItem[];
  className?: string;
}

/**
 * Mapping des routes vers des labels lisibles
 */
const routeLabels: Record<string, string> = {
  dashboard: 'Dashboard',
  admin: 'Administration',
  csm: 'CSM',
  provider: 'Prestataire',
  customer: 'Client',
  beneficiary: 'Bénéficiaire',
  notifications: 'Notifications',
  users: 'Utilisateurs',
  providers: 'Prestataires',
  agencies: 'Agences',
  orders: 'Commandes',
  'csm-management': 'Gestion CSM',
  services: 'Services',
  beneficiaries: 'Bénéficiaires',
  availabilities: 'Disponibilités',
  billing: 'Facturation',
  invoices: 'Factures',
  quotes: 'Devis',
  'payment-receipts': 'Bons de paiement',
  settings: 'Paramètres',
  stats: 'Statistiques',
  statistics: 'Statistiques',
  new: 'Nouveau',
  edit: 'Modifier',
  history: 'Historique',
  tracking: 'Suivi',
  upcoming: 'À venir',
  contacts: 'Contacts',
  apply: 'Candidater',
  specialities: 'Spécialités',
  complaints: 'Réclamations',
  payments: 'Paiements',
  addresses: 'Adresses',
  cards: 'Cartes',
  paypal: 'PayPal',
};

/**
 * Génère les breadcrumbs à partir du pathname
 */
function generateBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbs: BreadcrumbItem[] = [];

  // Toujours commencer par "Accueil"
  breadcrumbs.push({
    label: 'Accueil',
    href: '/',
  });

  // Si on est dans le dashboard, ajouter "Dashboard"
  if (segments[0] === 'dashboard') {
    breadcrumbs.push({
      label: 'Dashboard',
      href: '/dashboard',
    });

    // Parcourir les segments restants
    let currentPath = '/dashboard';
    for (let i = 1; i < segments.length; i++) {
      const segment = segments[i];
      currentPath += `/${segment}`;

      // Ignorer les IDs (ObjectId MongoDB ou UUID)
      const isId = /^[0-9a-f]{24}$/i.test(segment) || /^[0-9a-f-]{36}$/i.test(segment);
      if (isId) {
        // Pour les IDs, utiliser le segment précédent comme label
        if (i > 0) {
          const prevSegment = segments[i - 1];
          const label = routeLabels[prevSegment] || prevSegment;
          breadcrumbs.push({
            label: `${label} #${segment.slice(-6)}`,
            href: currentPath,
          });
        }
        continue;
      }

      // Utiliser le mapping ou formater le segment
      const label = routeLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
      breadcrumbs.push({
        label,
        href: currentPath,
      });
    }
  } else {
    // Pour les autres routes, construire normalement
    let currentPath = '';
    for (const segment of segments) {
      currentPath += `/${segment}`;
      const label = routeLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
      breadcrumbs.push({
        label,
        href: currentPath,
      });
    }
  }

  return breadcrumbs;
}

export default function Breadcrumb({ items, className = '' }: BreadcrumbProps) {
  const pathname = usePathname();
  const breadcrumbs = items || generateBreadcrumbs(pathname || '');

  // Ne pas afficher si on est sur la page d'accueil
  if (pathname === '/' || breadcrumbs.length <= 1) {
    return null;
  }

  return (
    <nav
      className={`flex items-center space-x-2 text-sm ${className}`}
      aria-label='Breadcrumb'
    >
      <ol className='flex items-center space-x-1 flex-wrap'>
        {breadcrumbs.map((item, index) => {
          const isLast = index === breadcrumbs.length - 1;

          return (
            <li key={`${item.href}-${index}`} className='flex items-center'>
              {index > 0 && (
                <ChevronRight className='h-4 w-4 text-gray-400 mx-1.5 flex-shrink-0' />
              )}

              {isLast ? (
                <span className='text-gray-900 font-medium truncate max-w-xs'>
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className='text-gray-600 hover:text-[hsl(25,100%,53%)] transition-colors flex items-center truncate max-w-xs'
                  title={item.label}
                >
                  {index === 0 ? (
                    <Home className='h-4 w-4 flex-shrink-0' />
                  ) : (
                    <span className='truncate'>{item.label}</span>
                  )}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

