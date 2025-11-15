'use client';

/**
 * Provider pour initialiser le système d'événements côté client
 * S'assure que les listeners sont configurés au démarrage de l'application
 */

import { initializeEventSystem } from '@/lib/events/setup';
import { useEffect } from 'react';

export function EventSystemProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialiser le système d'événements au montage du composant
    initializeEventSystem();
  }, []);

  return <>{children}</>;
}

