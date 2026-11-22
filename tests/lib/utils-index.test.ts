import { describe, expect, it, vi } from 'vitest';

import * as u from '@/lib/utils/index';

describe('lib/utils : validation', () => {
  it('reconnaît e-mails, téléphones, mots de passe et UUID', () => {
    expect(u.isValidEmail('awa@exemple.fr')).toBe(true);
    expect(u.isValidEmail('pas-un-email')).toBe(false);
    expect(typeof u.isValidPhone('+33612345678')).toBe('boolean');
    expect(u.isValidPassword('court')).toBe(false);
    expect(u.isValidUUID('123e4567-e89b-12d3-a456-426614174000')).toBe(true);
    expect(u.isValidUUID('xyz')).toBe(false);
  });
});

describe('lib/utils : formatage', () => {
  it('formate montants et dates en français', () => {
    expect(u.formatCurrency(19)).toMatch(/19,00\s?€/);
    expect(u.formatCurrency(1234.5, 'USD')).toMatch(/1\s?234,50/);
    const date = new Date(2026, 10, 21, 14, 5);
    expect(u.formatDate(date)).toBe('21 novembre 2026');
    expect(u.formatDateTime(date)).toMatch(/21 novembre 2026.*14:05/);
  });

  it('formate un temps relatif selon l’échelle', () => {
    expect(u.formatRelativeTime(new Date(Date.now() + 5 * 86_400_000))).toMatch(/dans 5 jours/);
    expect(u.formatRelativeTime(new Date(Date.now() - 3 * 3_600_000))).toMatch(/heures?/);
    expect(u.formatRelativeTime(new Date(Date.now() + 5 * 60_000))).toMatch(/minutes?/);
    expect(u.formatRelativeTime(new Date(Date.now() - 10_000))).toMatch(/secondes?|maintenant/);
  });
});

describe('lib/utils : chaînes', () => {
  it('met en forme, résume et normalise', () => {
    expect(u.capitalize('dIASPO')).toBe('Diaspo');
    expect(u.capitalize('')).toBe('');
    expect(u.slugify('  Santé à Douala !  ')).toBe('sant-douala');
    expect(u.truncate('abcdef', 3)).toBe('abc...');
    expect(u.truncate('abc', 5)).toBe('abc');
    expect(u.generateId()).toMatch(/^[A-Za-z0-9]{8}$/);
    expect(u.generateToken(12)).toMatch(/^[A-Za-z0-9]{12}$/);
  });

  it('nettoie entrées et URLs, masque e-mails et téléphones', () => {
    expect(u.sanitizeInput('  <b onclick=x>javascript:salut</b> ')).toBe('b xsalut/b');
    expect(u.cleanUrl(undefined)).toBe('http://localhost:3000');
    expect(u.cleanUrl(' "https://diaspomoney.fr" ')).toBe('https://diaspomoney.fr');
    expect(u.maskEmail('awadiallo@exemple.fr')).toBe('a*******o@exemple.fr');
    expect(u.maskEmail('ab@x.fr')).toBe('ab@x.fr');
    expect(u.maskPhone('0612345678')).toBe('06******78');
    expect(u.maskPhone('123')).toBe('123');
  });
});

describe('lib/utils : dates', () => {
  it('ajoute jours, heures, minutes et situe une date', () => {
    const base = new Date(2026, 0, 31, 23, 30);
    expect(u.addDays(base, 1).getDate()).toBe(1);
    expect(u.addHours(base, 1).getHours()).toBe(0);
    expect(u.addMinutes(base, 45).getMinutes()).toBe(15);
    expect(u.isToday(new Date())).toBe(true);
    expect(u.isTomorrow(u.addDays(new Date(), 1))).toBe(true);
    expect(u.isYesterday(u.addDays(new Date(), -1))).toBe(true);
    expect(u.isToday(u.addDays(new Date(), 2))).toBe(false);
  });
});

describe('lib/utils : nombres', () => {
  it('borne, arrondit, tire au hasard et calcule des pourcentages', () => {
    expect(u.clamp(15, 0, 10)).toBe(10);
    expect(u.clamp(-1, 0, 10)).toBe(0);
    expect(u.round(1.2345)).toBe(1.23);
    expect(u.round(1.5, 0)).toBe(2);
    vi.spyOn(Math, 'random').mockReturnValueOnce(0.999);
    expect(u.random(1, 6)).toBe(6);
    expect(u.percentage(1, 3)).toBe(33.33);
    expect(u.percentage(5, 0)).toBe(0);
  });
});

describe('lib/utils : objets et tableaux', () => {
  const people = [
    { name: 'Awa', city: 'Douala', age: 30 },
    { name: 'Ibrahim', city: 'Yaoundé', age: 25 },
    { name: 'Fatou', city: 'Douala', age: 41 },
  ];

  it('copie, extrait, omet et teste le vide', () => {
    const copy = u.deepClone(people[0]);
    expect(copy).toEqual(people[0]);
    expect(copy).not.toBe(people[0]);
    expect(u.pick(people[0]!, ['name'])).toEqual({ name: 'Awa' });
    expect(u.omit(people[0]!, ['age'])).toEqual({ name: 'Awa', city: 'Douala' });
    expect([null, '', [], {}].every(u.isEmpty)).toBe(true);
    expect([0, 'a', [1], { a: 1 }].some(u.isEmpty)).toBe(false);
  });

  it('dédoublonne, groupe, trie, découpe et pagine', () => {
    expect(u.unique([1, 1, 2])).toEqual([1, 2]);
    expect(Object.keys(u.groupBy(people, 'city'))).toEqual(['Douala', 'Yaoundé']);
    expect(u.sortBy(people, 'age').map((p) => p.name)).toEqual(['Ibrahim', 'Awa', 'Fatou']);
    expect(u.sortBy(people, 'age', 'desc')[0]!.name).toBe('Fatou');
    expect(u.chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);

    const page = u.paginate(people, 2, 2);
    expect(page.data.map((p) => p.name)).toEqual(['Fatou']);
    expect(page.pagination).toEqual({ page: 2, limit: 2, total: 3, pages: 2 });
  });
});

describe('lib/utils : journalisation', () => {
  it('traduit les niveaux et formate les messages', () => {
    expect(u.logLevel('error')).toBe(0);
    expect(u.logLevel('inconnu')).toBe(2);
    expect(u.formatLogMessage('info', 'ok')).toMatch(/^\[.+\] INFO: ok$/);
    expect(u.formatLogMessage('warn', 'x', { a: 1 })).toContain('{"a":1}');
  });
});
