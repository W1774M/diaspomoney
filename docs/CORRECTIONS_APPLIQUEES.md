# 🔧 Corrections Appliquées - DiaspoMoney

## 📝 Résumé des Problèmes Résolus

### 1. ✅ Erreur TypeScript (Build Docker)
**Problème:** Le paramètre `profile` n'était pas utilisé dans le callback JWT  
**Solution:** Supprimé le paramètre inutilisé et la variable `debug` non utilisée  
**Fichiers modifiés:**
- `app/api/auth/[...nextauth]/route.ts`

### 2. ✅ Erreurs OAuth non détaillées
**Problème:** Les erreurs de connexion Google/Facebook n'affichaient pas de détails  
**Solution:** Amélioration de la gestion d'erreurs avec détails spécifiques  
**Fichiers modifiés:**
- `app/api/auth/[...nextauth]/route.ts` (ligne 164-173)
- `components/features/auth/LoginForm.tsx` (ligne 89-94)

### 3. ✅ Images du dossier public/ non accessibles
**Problème:** Le dossier `public/` était ignoré par `.gitignore`  
**Solution:** Commenté la ligne 94 du `.gitignore`  
**Fichiers modifiés:**
- `.gitignore`

---

## 🎯 Actions à Effectuer IMMÉDIATEMENT

### Étape 1: Vérifier votre fichier .env

Ouvrez votre fichier `.env` et vérifiez ces variables critiques:

```bash
# ✅ L'URI MongoDB doit utiliser "mongodb" comme hostname (pas localhost)
MONGODB_URI=mongodb://admin:${MONGO_PASSWORD}@mongodb:27017/diaspomoney?authSource=admin

# ✅ L'URL Redis doit utiliser "redis" comme hostname (pas localhost)
REDIS_URL=redis://:${REDIS_PASSWORD}@redis:6379

# ✅ Les secrets doivent avoir au moins 32 caractères
AUTH_SECRET=votre-secret-long-aleatoire-32-caracteres-minimum
NEXTAUTH_SECRET=votre-secret-long-aleatoire-32-caracteres-minimum

# ✅ URL de l'application
NEXTAUTH_URL=https://app.diaspomoney.fr

# ✅ OAuth configuré
GOOGLE_CLIENT_ID=votre-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=votre-secret
FACEBOOK_CLIENT_ID=votre-app-id
FACEBOOK_CLIENT_SECRET=votre-secret
```

**📖 Référence complète:** Voir `ENV_ANALYSIS.md`

### Étape 2: Committer le dossier public/

```bash
# Le dossier public/ peut maintenant être commité
git add public/
git commit -m "fix: include public/ directory with static assets"
```

### Étape 3: Redéployer l'application

**Option A - Script automatique (recommandé):**
```bash
chmod +x fix-and-deploy.sh
./fix-and-deploy.sh
```

**Option B - Commandes manuelles:**
```bash
# 1. Arrêter l'app
docker compose -f docker-compose.prod.yml stop app

# 2. Supprimer l'ancien conteneur et image
docker compose -f docker-compose.prod.yml rm -f app
docker rmi diaspomoney_app

# 3. Nettoyer le cache
docker builder prune -f

# 4. Rebuild et redémarrer
docker compose -f docker-compose.prod.yml up -d --build app

# 5. Voir les logs
docker compose -f docker-compose.prod.yml logs -f app
```

### Étape 4: Tester la connexion Google

1. Accédez à https://app.diaspomoney.fr/login
2. Cliquez sur "Continuer avec Google"
3. Si une erreur se produit, vous verrez maintenant le détail exact de l'erreur
4. Vérifiez les logs: `docker compose -f docker-compose.prod.yml logs app`

---

## 🔍 Diagnostic des Erreurs

### Si vous voyez "DatabaseError"

**Cause probable:** Problème de connexion MongoDB

**Solutions:**
1. Vérifier que `MONGODB_URI` utilise `mongodb` comme hostname (pas `localhost`)
2. Vérifier que `MONGO_PASSWORD` est défini
3. Vérifier que MongoDB est démarré: `docker compose -f docker-compose.prod.yml ps`
4. Voir les logs MongoDB: `docker compose -f docker-compose.prod.yml logs mongodb`

### Si vous voyez "Configuration"

**Cause probable:** Variables OAuth manquantes ou incorrectes

**Solutions:**
1. Vérifier `GOOGLE_CLIENT_ID` et `GOOGLE_CLIENT_SECRET`
2. Vérifier que le callback est configuré dans Google Console:
   - URL: `https://app.diaspomoney.fr/api/auth/callback/google`

### Si les images ne s'affichent pas

**Causes possibles:**
1. Le dossier `public/` n'a pas été commité
2. L'image n'a pas été reconstruite après le fix

**Solutions:**
```bash
# Vérifier que public/ existe
ls -la public/

# Vérifier dans le conteneur
docker exec diaspomoney-app ls -la /app/public/

# Si vide, reconstruire
docker compose -f docker-compose.prod.yml up -d --build app
```

---

## 📚 Documentation Créée

1. **ENV_ANALYSIS.md** - Analyse complète des variables d'environnement
   - Variables nécessaires vs inutiles
   - Template .env minimal
   - Commandes de génération de secrets

2. **DOCKER_CLEANUP.md** - Guide de nettoyage Docker
   - Commandes de nettoyage sécurisées
   - Scripts de maintenance
   - Backup avant nettoyage

3. **fix-and-deploy.sh** - Script de déploiement rapide
   - Arrête et nettoie l'ancienne version
   - Reconstruit avec les corrections
   - Redémarre l'application

---

## 🎯 Commandes de Maintenance Rapide

### Voir les logs en temps réel
```bash
docker compose -f docker-compose.prod.yml logs -f app
```

### Redémarrer un service
```bash
docker compose -f docker-compose.prod.yml restart app
```

### Voir l'état des services
```bash
docker compose -f docker-compose.prod.yml ps
```

### Nettoyer le cache Docker (sans toucher aux données)
```bash
docker image prune -a -f && docker builder prune -a -f
```

---

## ✅ Checklist de Déploiement

- [ ] Vérifier le fichier `.env` (voir ENV_ANALYSIS.md)
- [ ] Vérifier que `MONGODB_URI` utilise `mongodb://mongodb:27017`
- [ ] Vérifier que `REDIS_URL` utilise `redis://redis:6379`
- [ ] Vérifier que les secrets OAuth sont configurés
- [ ] Committer le dossier `public/`
- [ ] Exécuter `./fix-and-deploy.sh` OU rebuild manuellement
- [ ] Tester la connexion Google
- [ ] Vérifier que les images s'affichent correctement
- [ ] Vérifier les logs pour les erreurs

---

## 🆘 Support

Si vous rencontrez toujours des problèmes:

1. Vérifiez les logs détaillés:
```bash
docker compose -f docker-compose.prod.yml logs app | grep -i error
docker compose -f docker-compose.prod.yml logs mongodb | grep -i error
```

2. Vérifiez la connectivité réseau Docker:
```bash
docker network inspect diaspomoney_diaspomoney
```

3. Testez la connexion MongoDB depuis l'app:
```bash
docker exec -it diaspomoney-app sh
# Puis dans le conteneur:
nc -zv mongodb 27017
```

4. Vérifiez que tous les services sont "healthy":
```bash
docker compose -f docker-compose.prod.yml ps
```

---

## 📊 Résultat Attendu

Après avoir suivi ces étapes, vous devriez avoir:

✅ Build Docker qui passe sans erreur TypeScript  
✅ Images du dossier `public/` accessibles  
✅ Connexion Google fonctionnelle  
✅ Messages d'erreur détaillés en cas de problème  
✅ Variables d'environnement correctement configurées  
✅ Application qui démarre et répond sur https://app.diaspomoney.fr

