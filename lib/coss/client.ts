/**
 * Client coss.com (sandbox / live selon COSS_API_KEY).
 */
import { Coss } from 'coss';

let cached: Coss | null = null;

export function getCossClient(): Coss {
  if (!process.env['COSS_API_KEY']) {
    throw new Error('COSS_API_KEY manquante');
  }
  if (!cached) {
    cached = new Coss();
  }
  return cached;
}

export function isCossSchedulingConfigured(): boolean {
  return Boolean(process.env['COSS_API_KEY']?.startsWith('coss_'));
}
