#!/usr/bin/env node
/**
 * Couverture globale : lance les trois suites (client, serveur, intégration) avec
 * couverture, fusionne les rapports et applique les seuils de coverage-thresholds.json.
 * Les suites serveur et intégration ont besoin de MongoDB (MONGODB_URI, port 27018 par défaut).
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, rmSync } from 'node:fs';

const REPORTS = '.vitest-reports';
const thresholds = JSON.parse(readFileSync('coverage-thresholds.json', 'utf8'));
const vitest = process.platform === 'win32' ? 'node_modules/.bin/vitest.CMD' : 'node_modules/.bin/vitest';
const run = (args) => execFileSync(vitest, args, { stdio: 'inherit', shell: process.platform === 'win32' });

rmSync(REPORTS, { recursive: true, force: true });

for (const [name, config] of [
  ['client', 'vitest.config.ts'],
  ['server', 'vitest.server.config.ts'],
  ['integration', 'vitest.integration.config.ts'],
]) {
  console.log(`\n▶ Suite ${name}`);
  run([
    'run', '--config', config, '--coverage',
    '--reporter=default', '--reporter=blob', `--outputFile.blob=${REPORTS}/${name}.json`,
  ]);
}

console.log('\n▶ Couverture globale (fusion des trois suites)');
run([
  '--config', 'vitest.config.ts', `--merge-reports=${REPORTS}`, '--coverage',
  '--coverage.reporter=text-summary', '--coverage.reporter=json-summary', '--coverage.reporter=html',
  ...['lines', 'statements', 'functions', 'branches'].map((k) => `--coverage.thresholds.${k}=${thresholds[k]}`),
]);
