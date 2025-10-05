// This file configures the initialization of Sentry for edge features (middleware, edge routes, and so on).
// The config you add here will be used whenever one of the edge features is loaded.
// Note that this config is unrelated to the Vercel Edge Runtime and is also required when running locally.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

// Configuration de Sentry pour les edge features
const isProduction = process.env.NODE_ENV === "production";
const dsn = process.env["SENTRY_DSN"] || "";

Sentry.init({
  dsn: isProduction ? dsn : "",
  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: isProduction ? 1 : 0,
  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,
  // Désactiver Sentry en développement
  enabled: isProduction,
});
