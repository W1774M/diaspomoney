#!/usr/bin/env node

/**
 * Script d'upload vers CDN - DiaspoMoney
 * Automatisation du déploiement des assets vers Cloudflare/Cloudinary
 * Basé sur la charte de développement Company-Grade
 */

const fs = require('fs');
const path = require('path');
const { glob } = require('glob');
const crypto = require('crypto');

// Configuration CDN
const CDN_CONFIG = {
  cloudflare: {
    enabled: process.env.CLOUDFLARE_API_TOKEN,
    zoneId: process.env.CLOUDFLARE_ZONE_ID,
    apiToken: process.env.CLOUDFLARE_API_TOKEN,
    baseUrl: 'https://cdn.diaspomoney.fr'
  },
  cloudinary: {
    enabled: process.env.CLOUDINARY_CLOUD_NAME,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET
  }
};

// Types de fichiers et leurs configurations
const FILE_TYPES = {
  images: {
    pattern: '**/*.{jpg,jpeg,png,webp,svg,gif,avif}',
    folder: 'images',
    cacheTTL: 2592000, // 30 days
    optimization: true
  },
  css: {
    pattern: '**/*.css',
    folder: 'css',
    cacheTTL: 31536000, // 1 year
    optimization: true
  },
  js: {
    pattern: '**/*.js',
    folder: 'js',
    cacheTTL: 31536000, // 1 year
    optimization: true
  },
  fonts: {
    pattern: '**/*.{woff,woff2,ttf,otf}',
    folder: 'fonts',
    cacheTTL: 31536000, // 1 year
    optimization: false
  },
  documents: {
    pattern: '**/*.{pdf,doc,docx}',
    folder: 'documents',
    cacheTTL: 86400, // 1 day
    optimization: false
  }
};

// Fonction pour calculer le hash d'un fichier
function calculateFileHash(filePath) {
  const content = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(content).digest('hex').substring(0, 16);
}

// Fonction pour optimiser les images avec Sharp
async function optimizeImage(inputPath, outputPath, options = {}) {
  try {
    const sharp = require('sharp');
    
    const {
      width,
      height,
      quality = 85,
      format = 'webp'
    } = options;

    let pipeline = sharp(inputPath);

    if (width || height) {
      pipeline = pipeline.resize(width, height, {
        fit: 'cover',
        position: 'center'
      });
    }

    if (format === 'webp') {
      pipeline = pipeline.webp({ quality });
    } else if (format === 'avif') {
      pipeline = pipeline.avif({ quality });
    } else if (format === 'jpeg') {
      pipeline = pipeline.jpeg({ quality });
    }

    await pipeline.toFile(outputPath);
    return true;
  } catch (error) {
    console.warn(`⚠️  Impossible d'optimiser ${inputPath}:`, error.message);
    return false;
  }
}

// Fonction pour uploader vers Cloudinary
async function uploadToCloudinary(filePath, folder, options = {}) {
  if (!CDN_CONFIG.cloudinary.enabled) {
    console.log('⏭️  Cloudinary non configuré, skip');
    return null;
  }

  try {
    const cloudinary = require('cloudinary').v2;
    
    cloudinary.config({
      cloud_name: CDN_CONFIG.cloudinary.cloudName,
      api_key: CDN_CONFIG.cloudinary.apiKey,
      api_secret: CDN_CONFIG.cloudinary.apiSecret
    });

    const result = await cloudinary.uploader.upload(filePath, {
      folder: `diaspomoney/${folder}`,
      use_filename: true,
      unique_filename: false,
      overwrite: true,
      format: 'auto',
      quality: 'auto:good',
      ...options
    });

    console.log(`✅ Cloudinary: ${result.secure_url}`);
    return result.secure_url;
  } catch (error) {
    console.error(`❌ Erreur Cloudinary:`, error.message);
    return null;
  }
}

// Fonction pour uploader vers Cloudflare R2
async function uploadToCloudflare(filePath, key, contentType) {
  if (!CDN_CONFIG.cloudflare.enabled) {
    console.log('⏭️  Cloudflare non configuré, skip');
    return null;
  }

  try {
    const fetch = require('node-fetch');
    
    const fileContent = fs.readFileSync(filePath);
    
    const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${CDN_CONFIG.cloudflare.zoneId}/r2/buckets/diaspomoney-assets/objects/${key}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${CDN_CONFIG.cloudflare.apiToken}`,
        'Content-Type': contentType
      },
      body: fileContent
    });

    if (response.ok) {
      const url = `${CDN_CONFIG.cloudflare.baseUrl}/${key}`;
      console.log(`✅ Cloudflare: ${url}`);
      return url;
    } else {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }
  } catch (error) {
    console.error(`❌ Erreur Cloudflare:`, error.message);
    return null;
  }
}

// Fonction pour traiter un fichier
async function processFile(filePath, fileType) {
  const config = FILE_TYPES[fileType];
  const relativePath = path.relative('public', filePath);
  const fileName = path.basename(filePath);
  const fileHash = calculateFileHash(filePath);
  const optimizedFileName = `${path.parse(fileName).name}-${fileHash}${path.extname(fileName)}`;
  
  console.log(`\n📁 Traitement: ${relativePath}`);
  
  // Créer le dossier de sortie
  const outputDir = path.join('public', 'cdn', config.folder);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const outputPath = path.join(outputDir, optimizedFileName);
  
  // Optimiser le fichier si nécessaire
  if (config.optimization && fileType === 'images') {
    const optimized = await optimizeImage(filePath, outputPath, {
      quality: 85,
      format: 'webp'
    });
    
    if (!optimized) {
      // Copier le fichier original si l'optimisation échoue
      fs.copyFileSync(filePath, outputPath);
    }
  } else {
    // Copier le fichier tel quel
    fs.copyFileSync(filePath, outputPath);
  }
  
  // Upload vers les CDN
  const cdnKey = `${config.folder}/${optimizedFileName}`;
  
  const cloudflareUrl = await uploadToCloudflare(outputPath, cdnKey, 'image/webp');
  const cloudinaryUrl = await uploadToCloudinary(outputPath, config.folder);
  
  // Générer le manifest
  return {
    original: relativePath,
    optimized: `cdn/${config.folder}/${optimizedFileName}`,
    cdn: {
      cloudflare: cloudflareUrl,
      cloudinary: cloudinaryUrl
    },
    hash: fileHash,
    size: fs.statSync(outputPath).size,
    cacheTTL: config.cacheTTL
  };
}

// Fonction principale
async function main() {
  console.log('🚀 UPLOAD CDN - DiaspoMoney');
  console.log('============================\n');
  
  const manifest = {
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    assets: {}
  };
  
  // Traiter chaque type de fichier
  for (const [fileType, config] of Object.entries(FILE_TYPES)) {
    console.log(`\n📂 Traitement des fichiers ${fileType}...`);
    
    const files = await glob(config.pattern, { 
      cwd: 'public',
      absolute: true 
    });
    
    console.log(`   Trouvé ${files.length} fichiers`);
    
    const processedFiles = [];
    
    for (const file of files) {
      try {
        const result = await processFile(file, fileType);
        processedFiles.push(result);
      } catch (error) {
        console.error(`❌ Erreur traitement ${file}:`, error.message);
      }
    }
    
    manifest.assets[fileType] = processedFiles;
    console.log(`✅ ${processedFiles.length} fichiers ${fileType} traités`);
  }
  
  // Sauvegarder le manifest
  const manifestPath = 'public/cdn/manifest.json';
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`\n📋 Manifest sauvegardé: ${manifestPath}`);
  
  // Générer les statistiques
  const totalFiles = Object.values(manifest.assets).flat().length;
  const totalSize = Object.values(manifest.assets)
    .flat()
    .reduce((sum, file) => sum + file.size, 0);
  
  console.log('\n📊 STATISTIQUES:');
  console.log(`   Total fichiers: ${totalFiles}`);
  console.log(`   Taille totale: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   CDN Cloudflare: ${CDN_CONFIG.cloudflare.enabled ? '✅' : '❌'}`);
  console.log(`   CDN Cloudinary: ${CDN_CONFIG.cloudinary.enabled ? '✅' : '❌'}`);
  
  console.log('\n✅ Upload CDN terminé');
}

// Exécution si le script est appelé directement
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  });
}

module.exports = { main, processFile, uploadToCloudflare, uploadToCloudinary };
