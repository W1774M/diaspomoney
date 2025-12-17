// Layout global pour toutes les routes API
// Désactive le prerendering pour toutes les routes API
// Cela évite les erreurs MongoDB pendant le build
export const dynamic = 'force-dynamic';

// Ce layout s'applique à toutes les routes sous /api/*
// Il ne crée pas de route supplémentaire, juste une configuration
export default function ApiLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Ce layout ne rend rien, il sert uniquement à définir la configuration
  // Les routes API gèrent leur propre rendu
  return <>{children}</>;
}

