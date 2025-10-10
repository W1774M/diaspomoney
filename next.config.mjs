const nextConfig = {
  // Optimisation des images
  images: {
    formats: ["image/webp", "image/avif"],
    minimumCacheTTL: 31536000,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "diaspomoney.fr",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "www.diaspomoney.fr",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "diaspomoney.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "www.diaspomoney.com",
        port: "",
        pathname: "/**",
      },
      // Configuration plus permissive pour le développement
      {
        protocol: "https",
        hostname: "**",
        port: "",
        pathname: "/**",
      },
    ],
    // Configuration pour permettre toutes les images externes en développement
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    // Désactiver la validation stricte en développement
    unoptimized: process.env.NODE_ENV === "development",
  },

  // Configuration expérimentale
  experimental: {
    instrumentationHook: true,
  },

  // Configuration Webpack pour les modules Node.js
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        dns: false,
        net: false,
        tls: false,
        fs: false,
        child_process: false,
        "timers/promises": false,
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
        "@mongodb-js/zstd": false,
        "@aws-sdk/credential-providers": false,
        "gcp-metadata": false,
        snappy: false,
        socks: false,
        aws4: false,
        "mongodb-client-encryption": false,
      };
    }
    return config;
  },

  // Variables d'environnement
  env: {
    CUSTOM_KEY: process.env["CUSTOM_KEY"],
  },
};

export default nextConfig;
