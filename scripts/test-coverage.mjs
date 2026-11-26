#!/usr/bin/env node
/* global process, console */
/**
 * Couverture globale : lance les trois suites (client, serveur, intégration) avec
 * couverture, fusionne les rapports et applique les seuils de coverage-thresholds.json.
 * Les suites serveur et intégration ont besoin de MongoDB (MONGODB_URI, port 27018 par défaut).
 * En CI (CI=true), écrit aussi un rapport JUnit par suite dans test-results/ (onglet Tests
 * de CircleCI) : c'est l'unique exécution des tests du pipeline.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, rmSync } from 'node:fs';

const REPORTS = '.vitest-reports';
const JUNIT = process.env.CI === 'true';
const thresholds = JSON.parse(readFileSync('coverage-thresholds.json', 'utf8'));
const vitest = process.platform === 'win32' ? 'node_modules\\.bin\\vitest.CMD' : 'node_modules/.bin/vitest';
const run = (args) => execFileSync(vitest, args, { stdio: 'inherit', shell: process.platform === 'win32' });

rmSync(REPORTS, { recursive: true, force: true });

for (const [name, config] of [
  ['client', 'vitest.config.ts'],
  ['server', 'vitest.server.config.ts'],
  ['integration', 'vitest.integration.config.ts'],
]) {
  // Poste local : vitest.<suite>.local.mts (non versionné) remplace la config CI s'il existe.
  const local = `vitest.${name}.local.mts`;
  console.log(`\n▶ Suite ${name}`);
  run([
    'run', '--config', existsSync(local) ? local : config, '--coverage',
    '--reporter=default', '--reporter=blob', `--outputFile.blob=${REPORTS}/${name}.json`,
    ...(JUNIT ? ['--reporter=junit', `--outputFile.junit=test-results/${name}.xml`] : []),
  ]);
}

console.log('\n▶ Couverture globale (fusion des trois suites)');
// `run` est obligatoire : sans lui, Vitest démarre en watch hors CI et refuse la fusion.
run([
  'run', '--config', 'vitest.config.ts', `--merge-reports=${REPORTS}`, '--coverage',
  '--coverage.reporter=text-summary', '--coverage.reporter=json-summary', '--coverage.reporter=html',
  ...['lines', 'statements', 'functions', 'branches'].map((k) => `--coverage.thresholds.${k}=${thresholds[k]}`),
]);
