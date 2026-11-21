import { createRequire } from 'module';
const require = createRequire(import.meta.url);
// Use webpack from Next.js's bundled version (webpack is not a direct dependency)
const webpack = require('next/dist/compiled/webpack/webpack-lib');

/**
 * CSP en « Report-Only » : elle signale les violations dans la console sans rien bloquer.
 * Une fois GTM et Stripe vérifiés, renommer l'en-tête en Content-Security-Policy.
 */
const CSP = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self' https://checkout.stripe.com https://accounts.google.com https://www.facebook.com",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "style-src 'self' 'unsafe-inline'",
  "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://*.google-analytics.com https://js.stripe.com https://static.cloudflareinsights.com",
  "connect-src 'self' https://api.diaspomoney.fr https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com https://api.stripe.com https://*.sentry.io https://*.ingest.sentry.io https://cloudflareinsights.com",
  "frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://www.googletagmanager.com",
  'upgrade-insecure-requests',
].join('; ');

const SECURITY_HEADERS = [
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), browsing-topics=(), payment=(self "https://js.stripe.com")' },
  { key: 'Content-Security-Policy-Report-Only', value: CSP },
];

const nextConfig = {
  // Ne pas annoncer « X-Powered-By: Next.js ».
  poweredByHeader: false,

  // En-têtes de sécurité appliqués à toutes les réponses.
  async headers() {
    return [{ source: '/:path*', headers: SECURITY_HEADERS }];
  },

  // Ancienne adresse dupliquée de la politique de confidentialité.
  async redirects() {
    return [{ source: '/privacy', destination: '/privacy-policy', permanent: true }];
  },

  // Optimisation des images
  images: {
    formats: ['image/webp', 'image/avif'], // Seulement webp et avif sont supportés par Next.js
    minimumCacheTTL: 31536000,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'diaspomoney.fr',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.diaspomoney.fr',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'diaspomoney.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.diaspomoney.com',
        port: '',
        pathname: '/**',
      },
      // Configuration pour les images WordPress
      {
        protocol: 'https',
        hostname: 'wp-content.diaspomoney.fr',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.diaspomoney.fr',
        port: '',
        pathname: '/**',
      },
      // Configuration plus permissive UNIQUEMENT en développement (évite d'autoriser `**` en prod)
      ...(process.env.NODE_ENV !== 'production'
        ? [
            {
              protocol: 'https',
              hostname: '**',
              port: '',
              pathname: '/**',
            },
          ]
        : []),
    ],
    // Configuration pour permettre toutes les images externes en développement
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // Configuration pour exclure certains packages de l'externalisation serveur
  // Ces packages sont nécessaires pour OpenTelemetry et Sentry
  serverExternalPackages: ['require-in-the-middle', 'import-in-the-middle'],

  // Configuration Webpack pour les modules Node.js
  webpack: (config, { isServer }) => {
    // Exclure les fichiers système Windows pour éviter les erreurs Watchpack
    config.watchOptions = {
      ...config.watchOptions,
      ignored: [
        '**/node_modules/**',
        '**/.git/**',
        '**/.next/**',
        '**/coverage/**',
        '**/logs/**',
        '**/backups/**',
        '**/archives/**',
        // Exclure les fichiers système Windows
        'C:/DumpStack.log.tmp',
        'C:/hiberfil.sys',
        'C:/pagefile.sys',
        'C:/swapfile.sys',
        '**/DumpStack.log.tmp',
        '**/hiberfil.sys',
        '**/pagefile.sys',
        '**/swapfile.sys',
        // Exclure les dossiers système Windows
        '**/System Volume Information/**',
        '**/Windows/**',
        '**/Program Files/**',
        '**/Program Files (x86)/**',
      ],
    };

    // Exclure les fichiers de test et autres fichiers non nécessaires dans node_modules
    // Utiliser IgnorePlugin pour exclure les modules de test et fichiers de test
    config.plugins = config.plugins || [];

    // Ignorer les fichiers de test et fichiers non nécessaires
    config.plugins.push(
      new webpack.IgnorePlugin({
        checkResource(resource, context) {
          // Ignorer tous les fichiers de test dans node_modules
          if (context.includes('node_modules')) {
            // Ignorer les dossiers de test
            if (
              resource.includes('/test/') ||
              resource.includes('/tests/') ||
              resource.includes('/__tests__/')
            ) {
              return true;
            }
            // Ignorer les fichiers de test
            if (resource.match(/\.(test|spec)\.(js|mjs|ts|tsx|json)$/)) {
              return true;
            }
            // Ignorer les fichiers non-code (README, LICENSE, etc.)
            if (resource.match(/\.(md|txt|yml|yaml|zip|sh)$/)) {
              return true;
            }
            // Ignorer les fichiers bench
            if (
              resource.includes('bench.js') ||
              resource.includes('benchmark')
            ) {
              return true;
            }
          }

          // Ignorer les modules de test spécifiques
          const testModules = [
            'tap',
            'pino-elasticsearch',
            'why-is-node-running',
            'desm',
            'fastbench',
          ];
          if (testModules.includes(resource)) {
            return true;
          }

          return false;
        },
      })
    );

    // Ignorer les fichiers de test lors de la résolution
    config.resolve = config.resolve || {};
    config.resolve.alias = config.resolve.alias || {};

    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        dns: false,
        net: false,
        tls: false,
        fs: false,
        child_process: false,
        'timers/promises': false,
        timers: false,
        stream: false,
        crypto: false,
        util: false,
        url: false,
        querystring: false,
        path: false,
        os: false,
        buffer: false,
        events: false,
        // MongoDB dependencies
        kerberos: false,
        '@mongodb-js/zstd': false,
        '@aws-sdk/credential-providers': false,
        'gcp-metadata': false,
        snappy: false,
        socks: false,
        aws4: false,
        'mongodb-client-encryption': false,
      };
    }
    return config;
  },
};

export default nextConfig;
