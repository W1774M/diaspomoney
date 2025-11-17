/**
 * Configuration CDN - DiaspoMoney
 * Architecture Multi-CDN pour optimiser les performances
 * Basé sur la charte de développement Company-Grade
 */

export interface CDNConfig {
  provider: 'cloudflare' | 'cloudinary' | 'aws-cloudfront' | 'local';
  baseUrl: string;
  fallbackUrl: string;
  caching: {
    images: number;
    css: number;
    js: number;
    fonts: number;
    documents: number;
  };
  optimization: {
    minify: boolean;
    compression: boolean;
    imageOptimization: boolean;
  };
}

// Configuration CDN selon l'environnement
export const getCDNConfig = (): CDNConfig => {
  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction) {
    return {
      provider: 'cloudflare',
      baseUrl: 'https://cdn.diaspomoney.fr',
      fallbackUrl: 'https://app.diaspomoney.fr',
      caching: {
        images: 2592000, // 30 days
        css: 31536000, // 1 year
        js: 31536000, // 1 year
        fonts: 31536000, // 1 year
        documents: 86400, // 1 day
      },
      optimization: {
        minify: true,
        compression: true,
        imageOptimization: true,
      },
    };
  }

  // Configuration développement
  return {
    provider: 'local',
    baseUrl: 'http://localhost:3000',
    fallbackUrl: 'http://localhost:3000',
    caching: {
      images: 0,
      css: 0,
      js: 0,
      fonts: 0,
      documents: 0,
    },
    optimization: {
      minify: false,
      compression: false,
      imageOptimization: false,
    },
  };
};

// Fonction pour générer l'URL CDN d'un asset
export const getAssetURL = (
  path: string,
  options?: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'avif' | 'jpg' | 'png';
    transformation?: string;
  },
): string => {
  const config = getCDNConfig();

  // Si l'URL est déjà complète, la retourner
  if (path.startsWith('http')) {
    return path;
  }

  // Nettoyer le chemin
  const cleanPath = path.startsWith('/') ? path : `/${path}`;

  // Configuration Cloudflare
  if (config.provider === 'cloudflare') {
    let url = `${config.baseUrl}${cleanPath}`;

    // Ajouter les transformations d'image si spécifiées
    if (
      options &&
      (options.width !== undefined ||
        options.height !== undefined ||
        options.quality !== undefined ||
        options.format !== undefined)
    ) {
      const params = new URLSearchParams();

      if (typeof options.width === 'number')
        params.append('width', options.width.toString());
      if (typeof options.height === 'number')
        params.append('height', options.height.toString());
      if (typeof options.quality === 'number')
        params.append('quality', options.quality.toString());
      if (options.format) params.append('format', options.format);

      if (params.toString()) {
        url += `?${params.toString()}`;
      }
    }

    return url;
  }

  // Configuration Cloudinary
  if (config.provider === 'cloudinary') {
    const cloudName = process.env['CLOUDINARY_CLOUD_NAME'];
    if (!cloudName) {
       
      console.warn('CLOUDINARY_CLOUD_NAME not configured, using fallback');
      return `${config.fallbackUrl}${cleanPath}`;
    }

    let url = `https://res.cloudinary.com/${cloudName}/image/upload`;

    // Ajouter les transformations
    if (options) {
      const transformations: string[] = [];

      if (typeof options.width === 'number') {
        transformations.push(`w_${options.width}`);
      }
      if (typeof options.height === 'number') {
        transformations.push(`h_${options.height}`);
      }

      if (typeof options.quality === 'number') {
        transformations.push(`q_${options.quality}`);
      }

      if (options.format) {
        transformations.push(`f_${options.format}`);
      }

      if (transformations.length > 0) {
        url += `/${transformations.join(',')}`;
      }
    }

    url += cleanPath;
    return url;
  }

  // Fallback local / aws-cloudfront
  return `${config.baseUrl}${cleanPath}`;
};

// Fonction pour précharger les assets critiques
export const preloadCriticalAssets = (): string[] => {
  const criticalAssets = [
    '/fonts/inter-var.woff2',
    '/css/critical.css',
    '/js/runtime.js',
    '/images/logo.svg',
  ];

  return criticalAssets.map(asset => getAssetURL(asset));
};

// Configuration des règles de cache
export const getCacheRules = () => {
  const config = getCDNConfig();

  return [
    {
      pattern: '*.jpg,*.png,*.webp,*.svg,*.gif,*.avif',
      ttl: config.caching.images,
      browserTTL: 86400, // 1 day
      immutable: true,
    },
    {
      pattern: '*.css,*.js',
      ttl: config.caching.css,
      browserTTL: 604800, // 1 week
      immutable: true,
    },
    {
      pattern: '*.woff,*.woff2,*.ttf,*.otf',
      ttl: config.caching.fonts,
      browserTTL: 31536000, // 1 year
      immutable: true,
    },
    {
      pattern: '*.pdf,*.doc,*.docx',
      ttl: config.caching.documents,
      browserTTL: 3600, // 1 hour
      immutable: false,
    },
  ];
};

// Fonction pour optimiser les images
export const optimizeImage = (
  src: string,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'avif' | 'auto';
  } = {},
): string => {
  const config = getCDNConfig();

  if (!config.optimization.imageOptimization) {
    return src;
  }

  // Only pass width/height/quality/format if defined, matching types exactly for getAssetURL
  // Build params exactly matching types, avoiding { format: undefined }
  const params: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'avif' | 'jpg' | 'png';
  } = {};

  if (typeof options.width === 'number') {
    params.width = options.width;
  }
  if (typeof options.height === 'number') {
    params.height = options.height;
  }

  if (typeof options.quality === 'number') {
    params.quality = options.quality;
  } else {
    params.quality = 85;
  }

  if (options.format && options.format !== 'auto') {
    params.format = options.format as 'webp' | 'avif' | 'jpg' | 'png';
  } else if (options.format === 'auto') {
    params.format = 'webp';
  }

  return getAssetURL(src, params);
};

// Fonction pour générer les balises de préchargement
export const generatePreloadTags = (assets: string[]): string => {
  return assets
    .map(asset => {
      const extension = asset.split('.').pop()?.toLowerCase();
      let as: string;
      switch (extension) {
        case 'css':
          as = 'style';
          break;
        case 'js':
          as = 'script';
          break;
        case 'woff':
        case 'woff2':
        case 'ttf':
        case 'otf':
          as = 'font';
          break;
        case 'svg':
        case 'jpg':
        case 'jpeg':
        case 'png':
        case 'gif':
        case 'webp':
        case 'avif':
          as = 'image';
          break;
        default:
          as = 'fetch';
      }
      return `<link rel="preload" href="${asset}" as="${as}"${as === 'font' ? ' crossorigin' : ''}>`;
    })
    .join('\n');
};

// Configuration Cloudflare Workers (optionnel)
export const getCloudflareWorkerConfig = () => {
  return {
    name: 'diaspomoney-cdn',
    script: `
      addEventListener('fetch', event => {
        event.respondWith(handleRequest(event.request))
      })
      
      async function handleRequest(request) {
        const url = new URL(request.url)
        
        // Optimisation des images
        if (url.pathname.match(/\\.(jpg|jpeg|png|webp|gif)$/i)) {
          const imageRequest = new Request(request, {
            cf: {
              image: {
                width: url.searchParams.get('w') || 'auto',
                height: url.searchParams.get('h') || 'auto',
                quality: url.searchParams.get('q') || 85,
                format: url.searchParams.get('f') || 'auto'
              }
            }
          })
          return fetch(imageRequest)
        }
        
        // Cache des assets statiques
        if (url.pathname.match(/\\.(css|js|woff|woff2)$/i)) {
          const cacheKey = new Request(request.url, request)
          const cache = caches.default
          let response = await cache.match(cacheKey)
          
          if (!response) {
            response = await fetch(request)
            response = new Response(response.body, {
              headers: {
                ...Object.fromEntries(response.headers.entries()),
                'Cache-Control': 'public, max-age=31536000, immutable'
              },
              status: response.status,
              statusText: response.statusText
            })
            event.waitUntil(cache.put(cacheKey, response.clone()))
          }
          
          return response
        }
        
        return fetch(request)
      }
    `,
  };
};
