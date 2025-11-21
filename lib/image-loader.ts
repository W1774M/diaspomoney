/**
 * Loader personnalisé pour les images Next.js
 * Sert les images locales directement sans passer par l'optimiseur
 */

export default function imageLoader({ src, width, quality }: { src: string; width: number; quality?: number }) {
  // Pour les images locales (commençant par /), les servir directement depuis /public
  // Next.js servira ces images depuis le dossier public
  if (src.startsWith('/')) {
    // Retourner le chemin tel quel - Next.js servira depuis /public automatiquement
    // Si on veut utiliser l'optimiseur Next.js pour les images locales, on peut utiliser:
    // return `/_next/image?url=${encodeURIComponent(src)}&w=${width}${quality ? `&q=${quality}` : ''}`;
    // Mais pour l'instant, on sert directement depuis /public pour éviter les problèmes de CDN
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

