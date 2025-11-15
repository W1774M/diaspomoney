/**
 * Loader personnalisé pour les images Next.js
 * Sert les images locales directement sans passer par l'optimiseur
 */

export default function imageLoader({ src, width, quality }: { src: string; width: number; quality?: number }) {
  // Pour les images locales (commençant par /), les servir directement
  // Next.js servira ces images depuis le dossier public sans optimisation
  if (src.startsWith('/')) {
    return src;
  }
  
  // Pour les images externes, utiliser l'optimiseur Next.js par défaut
  const params = new URLSearchParams();
  params.set('url', src);
  params.set('w', width.toString());
  if (quality) {
    params.set('q', quality.toString());
  }
  
  return `/_next/image?${params.toString()}`;
}

