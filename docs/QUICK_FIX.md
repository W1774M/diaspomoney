# 🔧 Résolution Rapide - Diaspomoney

## 🚨 Problème Actuel

Les dépendances ne sont pas installées et il y a des erreurs de modules manquants.

## ✅ Solution Rapide

### Option 1: Script automatique (Recommandé)

**Sur Windows :**

```bash
pnpm fix-deps:win
```

**Sur Linux/Mac :**

```bash
pnpm fix-deps
```

### Option 2: Manuel

1. **Supprimer les répertoires copy :**

   ```bash
   rm -rf "components copy" "models copy" "types copy" "hooks copy" "lib copy"
   ```

2. **Nettoyer les dépendances :**

   ```bash
   rm -rf node_modules
   rm -f pnpm-lock.yaml
   ```

3. **Réinstaller :**

   ```bash
   pnpm install
   ```

4. **Vérifier :**
   ```bash
   pnpm check-imports
   ```

## 🔄 Versions Temporaires

J'ai créé des versions temporaires des fichiers qui fonctionnent sans les nouvelles dépendances :

- ✅ `lib/security.ts` - Version temporaire sans `nanoid` et `rate-limiter-flexible`
- ✅ `lib/email.ts` - Version temporaire sans `resend` et `react-email`
- ✅ `config/auth.ts` - Version temporaire sans `@auth/mongodb-adapter`

## 🚀 Après l'installation

Une fois les dépendances installées, vous pourrez :

1. **Lancer le projet :**

   ```bash
   pnpm dev
   ```

2. **Mettre à jour vers les versions complètes :**
   - Remplacer les fichiers temporaires par les versions complètes
   - Activer Resend pour les emails
   - Activer l'adaptateur MongoDB

## 📋 Checklist

- [ ] Répertoires "copy" supprimés
- [ ] Dépendances installées (`pnpm install`)
- [ ] Projet fonctionne (`pnpm dev`)
- [ ] Variables d'environnement configurées
- [ ] Tests passent (`pnpm test`)

## 🆘 En cas de problème

1. **Vérifier les logs d'erreur**
2. **S'assurer que pnpm est installé**
3. **Vérifier la version de Node.js (>=18)**
4. **Consulter la documentation de migration**

## 📞 Support

Si le problème persiste, vérifiez :

- La version de Node.js
- La version de pnpm
- Les permissions du dossier
- L'espace disque disponible
