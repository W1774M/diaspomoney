# Script de nettoyage des images non utilisées

Ce script permet d'identifier et de supprimer les images non utilisées dans le projet.

## Utilisation

### 1. Mode dry-run (recommandé en premier)
Affiche les images non utilisées sans les supprimer :

```bash
node scripts/find-unused-images.js --dry-run
```

### 2. Supprimer les images non utilisées
⚠️ **Attention** : Cette commande supprime définitivement les fichiers !

```bash
node scripts/find-unused-images.js --delete
```

## Images exclues automatiquement

Les images suivantes sont **toujours exclues** car elles sont uploadées dynamiquement :
- `public/uploads/**` - Avatars et fichiers uploadés par les utilisateurs
- `public/img/users/providers/**` - Images de providers uploadées dynamiquement

## Exemples de sortie

```
🔍 Recherche des images non utilisées...

📁 Dossier public: /root/Lab/diaspomoney/public
📁 Codebase: /root/Lab/diaspomoney

📸 8 images trouvées

✅ Images utilisées: 5
❌ Images non utilisées: 3

📋 Liste des images non utilisées:

1. /img/diaspo/old-logo.png
   /root/Lab/diaspomoney/public/img/diaspo/old-logo.png
2. /img/diaspo/temp-image.jpg
   /root/Lab/diaspomoney/public/img/diaspo/temp-image.jpg
```

## Notes importantes

- Le script recherche les références dans tous les fichiers `.ts`, `.tsx`, `.js`, `.jsx`, `.json`, `.md`, `.html`, `.css`
- Les images référencées dans la base de données ne seront **pas** détectées
- Faites toujours un `--dry-run` avant de supprimer
- Considérez faire un commit Git avant de supprimer pour pouvoir restaurer si nécessaire

