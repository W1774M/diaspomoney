/**
 * Périmètre de couverture commun aux trois suites (client, serveur, intégration).
 * La couverture globale est la fusion des trois : voir scripts/test-coverage.mjs.
 */
export const coverageInclude = [
  '{app,components,lib,hooks,services,facades,repositories,domain,store,strategies,builders,utils,config,models,template,middleware,contexts,containers,commands}/**/*.{ts,tsx}',
  'proxy.ts',
];

export const coverageExclude = [
  '**/*.d.ts',
  '**/*.config.*',
  '**/node_modules/**',
  '**/.next/**',
  'tests/**',
];
