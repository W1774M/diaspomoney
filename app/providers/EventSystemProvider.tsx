'use client';

/**
 * Provider pour le système d'événements côté client
 * Note: Les listeners sont initialisés côté serveur uniquement
 * (voir lib/events/setup.ts pour l'initialisation serveur)
 */

export function EventSystemProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // Les listeners sont initialisés côté serveur uniquement
  // car ils utilisent MongoDB et d'autres modules Node.js
  return <>{children}</>;
}
