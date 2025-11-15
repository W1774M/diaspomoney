# 🚀 Quick Start - DiaspoMoney Production

## ⚡ Commandes Essentielles

### 🔧 Déploiement Rapide (Fix + Deploy)
```bash
# Tout en un (recommandé)
./fix-and-deploy.sh
```

### 🗑️ Nettoyage Docker (Build non utilisés)
```bash
# Nettoyer images et cache (garde les données)
docker image prune -a -f && docker builder prune -a -f

# Voir l'espace libéré
docker system df
```

### 📦 Rebuild et Redémarrage
```bash
# Rebuild complet
docker compose -f docker-compose.prod.yml up -d --build app

# Restart rapide (sans rebuild)
docker compose -f docker-compose.prod.yml restart app
```

### 📋 Logs et Monitoring
```bash
# Logs en temps réel
docker compose -f docker-compose.prod.yml logs -f app

# Logs avec filtre erreur
docker compose -f docker-compose.prod.yml logs app | grep -i error

# État des services
docker compose -f docker-compose.prod.yml ps
```

---

## 🔑 Variables .env CRITIQUES

```bash
# Hostnames Docker (IMPORTANT !)
MONGODB_URI=mongodb://admin:PASSWORD@mongodb:27017/diaspomoney?authSource=admin
REDIS_URL=redis://:PASSWORD@redis:6379

# Secrets (min 32 chars)
AUTH_SECRET=votre-secret-32-caracteres-minimum
NEXTAUTH_SECRET=votre-secret-32-caracteres-minimum

# OAuth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
FACEBOOK_CLIENT_ID=...
FACEBOOK_CLIENT_SECRET=...
```

**⚠️ Utilisez "mongodb" et "redis" comme hostnames, PAS "localhost"**

---

## 📚 Documentation Complète

- **CORRECTIONS_APPLIQUEES.md** - Résumé des corrections et checklist
- **ENV_ANALYSIS.md** - Variables d'environnement détaillées
- **DOCKER_CLEANUP.md** - Commandes de nettoyage avancées

---

## 🆘 Dépannage Rapide

### Build qui échoue
```bash
# Nettoyer et rebuild from scratch
docker compose -f docker-compose.prod.yml down
docker system prune -a -f
docker compose -f docker-compose.prod.yml up -d --build
```

### Images ne s'affichent pas
```bash
# Vérifier que public/ est dans le container
docker exec diaspomoney-app ls -la /app/public/

# Si vide, rebuild
docker compose -f docker-compose.prod.yml up -d --build app
```

### OAuth ne fonctionne pas
1. Vérifier les logs: `docker compose -f docker-compose.prod.yml logs app | grep AUTH`
2. Vérifier les variables: `docker exec diaspomoney-app env | grep GOOGLE`
3. Vérifier le callback dans Google Console: `https://app.diaspomoney.fr/api/auth/callback/google`

---

## ✅ Checklist Avant Deploy

- [ ] Fichier `.env` configuré
- [ ] `MONGODB_URI` utilise `mongodb://mongodb:...`
- [ ] Secrets OAuth configurés
- [ ] Dossier `public/` commité dans git
- [ ] Build Docker passe sans erreur

---

## 📞 Support

Voir les fichiers détaillés:
- `CORRECTIONS_APPLIQUEES.md` pour la checklist complète
- `ENV_ANALYSIS.md` pour les variables d'environnement
- `DOCKER_CLEANUP.md` pour le nettoyage avancé

