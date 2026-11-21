#!/usr/bin/env node

/**
 * Script pour trouver et supprimer les images non utilisées
 * Usage: node scripts/find-unused-images.js [--dry-run] [--delete]
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const DRY_RUN = process.argv.includes('--dry-run');
const DELETE = process.argv.includes('--delete');

// Extensions d'images supportées
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.ico', '.avif'];

// Dossiers à exclure (uploads, avatars dynamiques, etc.)
// Note: Ces dossiers contiennent des images uploadées dynamiquement
const EXCLUDE_PATTERNS = [
  /^uploads\//,
  /^img\/users\/providers\//, // Images de providers uploadées dynamiquement
];

/**
 * Récupère toutes les images dans le dossier public
 */
function getAllImages(dir, baseDir = dir) {
  const images = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = path.relative(baseDir, fullPath).replace(/\\/g, '/');

    // Vérifier si le chemin doit être exclu
    if (EXCLUDE_PATTERNS.some(pattern => pattern.test(relativePath))) {
      continue;
    }

    if (entry.isDirectory()) {
      images.push(...getAllImages(fullPath, baseDir));
    } else {
      const ext = path.extname(entry.name).toLowerCase();
      if (IMAGE_EXTENSIONS.includes(ext)) {
        images.push({
          fullPath,
          relativePath: '/' + relativePath, // Chemin relatif depuis public
          fileName: entry.name,
        });
      }
    }
  }

  return images;
}

/**
 * Cherche les références à une image dans le code
 */
function findImageReferences(imagePath, codebaseDir) {
  const searchPatterns = [
    imagePath, // Chemin complet
    imagePath.replace(/^\//, ''), // Sans le slash initial
    path.basename(imagePath), // Juste le nom du fichier
    path.basename(imagePath, path.extname(imagePath)), // Sans extension
  ];

  const results = [];
  
  try {
    // Utiliser ripgrep (rg) si disponible, sinon grep
    let command;
    try {
      execSync('which rg', { stdio: 'ignore' });
      command = 'rg';
    } catch {
      command = 'grep';
    }

    for (const pattern of searchPatterns) {
      try {
        let output;
        if (command === 'rg') {
          output = execSync(
            `rg -l --type-add 'code:*.{ts,tsx,js,jsx,json,md,html,css}' --type code "${pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}" ${codebaseDir}`,
            { encoding: 'utf-8', stdio: 'pipe' }
          );
        } else {
          output = execSync(
            `grep -r -l --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" --include="*.json" --include="*.md" --include="*.html" --include="*.css" "${pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}" ${codebaseDir}`,
            { encoding: 'utf-8', stdio: 'pipe' }
          );
        }
        
        if (output.trim()) {
          const files = output.trim().split('\n').filter(Boolean);
          results.push(...files);
        }
      } catch {
        // Pas de résultats pour ce pattern
      }
    }
  } catch (error) {
    console.error(`Erreur lors de la recherche: ${error.message}`);
  }

  return [...new Set(results)]; // Supprimer les doublons
}

/**
 * Fonction principale
 */
function main() {
  const projectRoot = path.resolve(__dirname, '..');
  const publicDir = path.join(projectRoot, 'public');
  const codebaseDir = projectRoot;

  console.log('🔍 Recherche des images non utilisées...\n');
  console.log(`📁 Dossier public: ${publicDir}`);
  console.log(`📁 Codebase: ${codebaseDir}\n`);

  // Récupérer toutes les images
  const allImages = getAllImages(publicDir);
  console.log(`📸 ${allImages.length} images trouvées\n`);

  const unusedImages = [];
  const usedImages = [];

  // Vérifier chaque image
  for (let i = 0; i < allImages.length; i++) {
    const image = allImages[i];
    process.stdout.write(`\r⏳ Vérification ${i + 1}/${allImages.length}: ${image.fileName}...`);

    const references = findImageReferences(image.relativePath, codebaseDir);
    
    if (references.length === 0) {
      unusedImages.push(image);
    } else {
      usedImages.push({ image, references });
    }
  }

  console.log('\n\n');

  // Afficher les résultats
  console.log('✅ Images utilisées:', usedImages.length);
  console.log('❌ Images non utilisées:', unusedImages.length);
  console.log('\n');

  if (unusedImages.length > 0) {
    console.log('📋 Liste des images non utilisées:\n');
    unusedImages.forEach((img, index) => {
      console.log(`${index + 1}. ${img.relativePath}`);
      console.log(`   ${img.fullPath}`);
    });

    console.log('\n');

    if (DELETE && !DRY_RUN) {
      console.log('🗑️  Suppression des images non utilisées...\n');
      let deletedCount = 0;
      unusedImages.forEach((img) => {
        try {
          fs.unlinkSync(img.fullPath);
          console.log(`   ✓ Supprimé: ${img.relativePath}`);
          deletedCount++;
        } catch (error) {
          console.error(`   ✗ Erreur lors de la suppression de ${img.relativePath}: ${error.message}`);
        }
      });
      console.log(`\n✅ ${deletedCount} images supprimées`);
    } else if (DRY_RUN) {
      console.log('🔍 Mode dry-run: aucune suppression effectuée');
      console.log('   Utilisez --delete pour supprimer réellement les fichiers');
    } else {
      console.log('💡 Pour supprimer ces images, exécutez:');
      console.log('   node scripts/find-unused-images.js --delete');
    }
  } else {
    console.log('🎉 Toutes les images sont utilisées!');
  }
}

// Exécuter le script
main();

