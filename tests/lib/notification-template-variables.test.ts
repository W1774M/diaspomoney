// @vitest-environment node
/**
 * Garde-fou : chaque envoi de notification transmet toutes les {{variables}} de son modèle.
 * Une variable oubliée part telle quelle dans le message (« {{reservationNumber}} »).
 *
 * Analyse statique (compilateur TypeScript) des appels `{ recipient, template: '…', data|payload }`.
 * Les données construites dans une variable du même fichier (const payload = {…}) et leurs
 * décompositions (...base) sont suivies ; une donnée impossible à résoudre est signalée.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';

const ROOT = path.resolve(import.meta.dirname, '../..');
const SCANNED = ['services', 'lib', 'facades', 'app', 'domain', 'strategies', 'commands'];
const TEMPLATE_FILES = ['services/notification/notification.service.ts', 'services/notification/additional-templates.ts'];

const parse = (file: string) =>
  ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, file.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
const nameOf = (p: ts.ObjectLiteralElementLike) =>
  p.name && (ts.isIdentifier(p.name) || ts.isStringLiteral(p.name)) ? p.name.text : null;
function literals(node: ts.Node | undefined, out: string[] = []): string[] {
  if (!node) return out;
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) out.push(node.text);
  else ts.forEachChild(node, (c) => void literals(c, out));
  return out;
}
function sourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...sourceFiles(full));
    else if (/\.(ts|tsx)$/.test(entry) && !/\.(test|spec)\./.test(entry)) out.push(full);
  }
  return out;
}

/** Modèle → variables présentes dans son sujet et son contenu. */
function templatePlaceholders(): Record<string, string[]> {
  const templates: Record<string, string[]> = {};
  for (const file of TEMPLATE_FILES) {
    const visit = (n: ts.Node) => {
      if (ts.isPropertyAssignment(n) && ts.isObjectLiteralExpression(n.initializer)) {
        const props = n.initializer.properties;
        const subject = props.find((p) => nameOf(p) === 'subject');
        const content = props.find((p) => nameOf(p) === 'content');
        if (subject && content && ts.isPropertyAssignment(subject) && ts.isPropertyAssignment(content)) {
          const text = [...literals(subject.initializer), ...literals(content.initializer)].join(' ');
          templates[nameOf(n)!] = [...new Set([...text.matchAll(/\{\{(\w+)\}\}/g)].map((m) => m[1]!))];
        }
      }
      ts.forEachChild(n, visit);
    };
    visit(parse(path.join(ROOT, file)));
  }
  return templates;
}

interface Call {
  where: string;
  template: string;
  keys: Set<string> | null; // null : données impossibles à résoudre statiquement
}

function notificationCalls(templates: Record<string, string[]>): Call[] {
  const calls: Call[] = [];
  for (const dir of SCANNED) {
    for (const file of sourceFiles(path.join(ROOT, dir))) {
      if (TEMPLATE_FILES.some((t) => file.endsWith(path.normalize(t)))) continue;
      const sf = parse(file);
      // Objets littéraux affectés à une constante du fichier : const payload = { … }
      const locals = new Map<string, ts.ObjectLiteralExpression>();
      const collect = (n: ts.Node) => {
        if (ts.isVariableDeclaration(n) && ts.isIdentifier(n.name) && n.initializer && ts.isObjectLiteralExpression(n.initializer)) {
          locals.set(n.name.text, n.initializer);
        }
        ts.forEachChild(n, collect);
      };
      collect(sf);

      const keysOf = (expr: ts.Expression, depth = 0): Set<string> | null => {
        if (depth > 3) return null;
        const obj = ts.isIdentifier(expr) ? locals.get(expr.text) : ts.isObjectLiteralExpression(expr) ? expr : undefined;
        if (!obj) return null;
        const keys = new Set<string>();
        for (const p of obj.properties) {
          if (ts.isSpreadAssignment(p)) {
            const inner = keysOf(p.expression, depth + 1);
            if (!inner) return null;
            inner.forEach((k) => keys.add(k));
          } else if (ts.isShorthandPropertyAssignment(p)) keys.add(p.name.text);
          else if (nameOf(p)) keys.add(nameOf(p)!);
        }
        return keys;
      };

      const visit = (n: ts.Node) => {
        if (ts.isObjectLiteralExpression(n)) {
          const props = n.properties;
          const tpl = props.find((p) => nameOf(p) === 'template');
          const isSend = props.some((p) => nameOf(p) === 'recipient');
          if (tpl && ts.isPropertyAssignment(tpl) && isSend) {
            const data = props.find((p) => ['data', 'payload'].includes(nameOf(p) ?? ''));
            const keys = !data
              ? new Set<string>()
              : ts.isPropertyAssignment(data)
                ? keysOf(data.initializer)
                : ts.isShorthandPropertyAssignment(data)
                  ? keysOf(data.name)
                  : null;
            const line = sf.getLineAndCharacterOfPosition(n.getStart()).line + 1;
            for (const template of literals(tpl.initializer).filter((s) => templates[s])) {
              calls.push({ where: `${path.relative(ROOT, file).replace(/\\/g, '/')}:${line}`, template, keys });
            }
          }
        }
        ts.forEachChild(n, visit);
      };
      visit(sf);
    }
  }
  return calls;
}

const templates = templatePlaceholders();
const calls = notificationCalls(templates);

describe('variables des notifications', () => {
  it('trouve les modèles et les envois', () => {
    expect(Object.keys(templates).length).toBeGreaterThan(30);
    expect(calls.length).toBeGreaterThan(25);
  });

  it.each(calls.map((c) => [`${c.template} (${c.where})`, c] as const))('%s transmet toutes ses variables', (_label, call) => {
    expect(call.keys, `${call.where} : données de « ${call.template} » impossibles à vérifier (à construire en littéral ou en const locale)`).not.toBeNull();
    const missing = templates[call.template]!.filter((v) => !call.keys!.has(v));
    expect(missing, `${call.where} : « ${call.template} » sans ${missing.map((m) => `{{${m}}}`).join(', ')}`).toEqual([]);
  });
});
