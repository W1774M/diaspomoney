import { createRequire } from 'module';
const require = createRequire(import.meta.url);
// Use webpack from Next.js's bundled version (webpack is not a direct dependency)
const webpack = require('next/dist/compiled/webpack/webpack-lib');

const nextConfig = {
  // Optimisation des images
  images: {
    formats: ['image/webp', 'image/avif'],
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
      {
        protocol: 'https',
        hostname: 'app.diaspomoney.fr',
        port: '',
        pathname: '/**',
      },
      // Configuration plus permissive pour le développement
      {
        protocol: 'https',
        hostname: '**',
        port: '',
        pathname: '/**',
      },
    ],
    // Configuration pour permettre toutes les images externes en développement
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    // Loader personnalisé pour les images locales
    loader: 'custom',
    loaderFile: './lib/image-loader.ts',
  },

  // Configuration expérimentale (instrumentationHook n'est plus nécessaire)
  // experimental: {
  //   instrumentationHook: true,
  // },

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
            if (resource.includes('/test/') || 
                resource.includes('/tests/') ||
                resource.includes('/__tests__/')) {
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
            if (resource.includes('bench.js') || resource.includes('benchmark')) {
              return true;
            }
          }
          
          // Ignorer les modules de test spécifiques
          const testModules = [
            'tap', 
            'pino-elasticsearch', 
            'why-is-node-running',
            'desm',
            'fastbench'
          ];
          if (testModules.includes(resource)) {
            return true;
          }
          
          return false;
        }
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
