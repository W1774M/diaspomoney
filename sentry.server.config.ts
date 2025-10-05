// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

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
