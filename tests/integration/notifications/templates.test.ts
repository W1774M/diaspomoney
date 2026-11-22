/**
 * Garde-fou : chaque modèle de notification utilisé par le code doit exister, même sans
 * aucun modèle en base (c'est le cas en dev, rct et prod). Sans modèle, la notification
 * échoue avec « Template non trouvé » et ne part jamais.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import { notificationService } from '@/services/notification/notification.service';
import { ADDITIONAL_TEMPLATE_NAMES, getAdditionalTemplate } from '@/services/notification/additional-templates';

const ROOT = path.resolve(import.meta.dirname, '../../..');
const SCANNED = ['services', 'lib', 'facades', 'app', 'domain', 'strategies', 'commands'];

function sourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...sourceFiles(full));
    else if (/\.(ts|tsx)$/.test(entry) && !/\.(test|spec)\./.test(entry)) out.push(full);
  }
  return out;
}

/** Noms de modèles passés à `template:`, y compris dans une condition sur plusieurs lignes. */
function usedTemplateNames(): string[] {
  const names = new Set<string>();
  for (const dir of SCANNED) {
    for (const file of sourceFiles(path.join(ROOT, dir))) {
      const source = readFileSync(file, 'utf8');
      for (const match of source.matchAll(/\btemplate:\s*([\s\S]{0,200}?),\s*\n/g)) {
        for (const name of match[1]!.matchAll(/['"]([a-z]+(?:_[a-z]+)+|welcome)['"]/g)) {
          names.add(name[1]!);
        }
      }
    }
  }
  return [...names].sort();
}

const getTemplate = (name: string) =>
  (notificationService as unknown as {
    getTemplate(name: string, locale: string): Promise<{ subject: string; content: string } | null>;
  }).getTemplate(name, 'fr');

describe('modèles de notification', () => {
  const used = usedTemplateNames();

  it('trouve les modèles utilisés dans le code', () => {
    expect(used.length).toBeGreaterThan(20);
    expect(used).toContain('booking_status_updated');
  });

  it.each(used)('« %s » existe sans modèle en base', async (name) => {
    const template = await getTemplate(name);
    expect(template, `modèle manquant : ${name}`).not.toBeNull();
    expect(template!.subject.trim()).not.toBe('');
    expect(template!.content.trim()).not.toBe('');
  });

  it.each(ADDITIONAL_TEMPLATE_NAMES)('« %s » remplace toutes ses variables déclarées', (name) => {
    const template = getAdditionalTemplate(name, 'fr')!;
    const declared = new Set(template.variables);
    const placeholders = [...`${template.subject} ${template.content}`.matchAll(/\{\{(\w+)\}\}/g)].map((m) => m[1]);
    // Toute variable du texte doit être déclarée (donc transmise par les appels).
    for (const placeholder of placeholders) expect(declared.has(placeholder!), `${name} : {{${placeholder}}}`).toBe(true);
  });
});
