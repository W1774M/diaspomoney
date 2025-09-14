#!/usr/bin/env tsx

import { readdir, readFile, stat } from "fs/promises";
import { extname, join } from "path";

interface ImportIssue {
  file: string;
  line: number;
  import: string;
  suggestion: string;
}

const problematicPatterns = [
  // Anciens répertoires copy
  "@/lib copy/",
  "@/types copy/",
  "@/hooks copy/",
  "@/models copy/",
  "@/components copy/",

  // Anciens chemins d'API
  "@/app/dashboard/api/",
  "/api/dashboard/",

  // Fichiers supprimés
  "@/lib/definitions",
];

const suggestions: Record<string, string> = {
  "@/lib copy/": "@/lib/",
  "@/types copy/": "@/types/",
  "@/hooks copy/": "@/hooks/",
  "@/models copy/": "@/models/",
  "@/components copy/": "@/components/",
  "@/app/dashboard/api/": "@/app/api/",
  "/api/dashboard/": "/api/",
  "@/lib/definitions": "@/types/",
};

async function scanDirectory(dir: string): Promise<string[]> {
  const files: string[] = [];

  try {
    const items = await readdir(dir);

    for (const item of items) {
      const fullPath = join(dir, item);
      const stats = await stat(fullPath);

      if (stats.isDirectory()) {
        const subFiles = await scanDirectory(fullPath);
        files.push(...subFiles);
      } else if (stats.isFile()) {
        const ext = extname(item);
        if ([".ts", ".tsx", ".js", ".jsx"].includes(ext)) {
          files.push(fullPath);
        }
      }
    }
  } catch (error) {
    // Ignorer les erreurs de lecture de répertoire
  }

  return files;
}

async function checkFile(filePath: string): Promise<ImportIssue[]> {
  const issues: ImportIssue[] = [];

  // Ignorer le script lui-même
  if (filePath.includes("check-imports.ts")) {
    return issues;
  }

  try {
    const content = await readFile(filePath, "utf-8");
    const lines = content.split("\n");

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNumber = i + 1;

      // Vérifier les imports
      for (const pattern of problematicPatterns) {
        if (line && line.includes(pattern)) {
          const suggestion = suggestions[pattern] || "Vérifier le chemin";
          issues.push({
            file: filePath,
            line: lineNumber,
            import: line.trim(),
            suggestion: `Remplacer par: ${line.replace(pattern, suggestion)}`,
          });
        }
      }

      // Vérifier les chemins d'API obsolètes
      if (
        line &&
        (line.includes("dashboard/api") || line.includes("/api/dashboard/"))
      ) {
        issues.push({
          file: filePath,
          line: lineNumber,
          import: line.trim(),
          suggestion: "API routes déplacées vers /app/api/",
        });
      }
    }
  } catch (error) {
    console.error(`Erreur lors de la lecture de ${filePath}:`, error);
  }

  return issues;
}

async function main() {
  console.log("🔍 Vérification des imports problématiques...\n");

  const files = await scanDirectory(".");
  const allIssues: ImportIssue[] = [];

  for (const file of files) {
    const issues = await checkFile(file);
    allIssues.push(...issues);
  }

  if (allIssues.length === 0) {
    console.log("✅ Aucun import problématique trouvé !");
    return;
  }

  console.log(
    `❌ ${allIssues.length} import(s) problématique(s) trouvé(s) :\n`
  );

  // Grouper par fichier
  const issuesByFile = allIssues.reduce(
    (acc, issue) => {
      if (!acc[issue.file]) {
        acc[issue.file] = [];
      }
      acc[issue.file]!.push(issue);
      return acc;
    },
    {} as Record<string, ImportIssue[]>
  );

  for (const [file, issues] of Object.entries(issuesByFile)) {
    console.log(`📁 ${file}:`);
    for (const issue of issues) {
      console.log(`   Ligne ${issue.line}: ${issue.import}`);
      console.log(`   💡 ${issue.suggestion}\n`);
    }
  }

  console.log("🔧 Actions recommandées :");
  console.log("1. Corriger les imports selon les suggestions ci-dessus");
  console.log("2. Vérifier que les nouveaux chemins existent");
  console.log("3. Tester que l'application fonctionne après les corrections");
  console.log("4. Relancer ce script pour vérifier les corrections");
}

main().catch(console.error);
