/**
 * Next.js Instrumentation Hook
 * S'exécute une seule fois au démarrage du serveur
 * Utilisé pour initialiser les systèmes serveur uniquement
 */

export async function register() {
  if (process.env['NEXT_RUNTIME'] === 'nodejs') {
    // Initialiser les systèmes serveur uniquement
    const { initializeDI } = await import('@/lib/di/initialize');
    initializeDI();
  }
}
