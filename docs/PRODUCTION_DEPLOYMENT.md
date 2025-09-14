# 🚀 Guide de Déploiement en Production

## 📋 Prérequis

### Serveur de production

- **OS** : Ubuntu 20.04+ ou Debian 11+
- **RAM** : Minimum 2GB (recommandé 4GB+)
- **CPU** : 2 vCPU minimum
- **Stockage** : 20GB+ d'espace libre
- **Réseau** : IP publique avec ports 80 et 443 ouverts

### Logiciels requis

```bash
# Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

## 🌐 Configuration DNS

Pointez vos domaines vers l'IP de votre serveur :

```
Type    Nom                           Valeur
A       app.diaspomoney.fr           VOTRE_IP_SERVEUR
A       dashboard.diaspomoney.fr     VOTRE_IP_SERVEUR
A       mongo.diaspomoney.fr         VOTRE_IP_SERVEUR
```

## 📁 Déploiement

### 1. Cloner le projet

```bash
git clone <votre-repo> diaspomoney
cd diaspomoney
```

### 2. Configuration des variables d'environnement

```bash
# Copier le fichier d'environnement
cp .env.example .env

# Éditer les variables
nano .env
```

Variables importantes :

```env
LETSENCRYPT_EMAIL=contact@diaspomoney.fr
HOSTNAME=0.0.0.0
PORT=3000
```

### 3. Déploiement automatique

```bash
# Rendre le script exécutable
chmod +x scripts/start-prod.sh

# Lancer le déploiement
./scripts/start-prod.sh
```

### 4. Vérification du déploiement

```bash
# Vérifier les conteneurs
docker ps

# Vérifier les logs Traefik
docker logs traefik

# Vérifier les certificats ACME
docker exec traefik ls -la /letsencrypt/
```

## 🔒 Certificats SSL

### Vérification ACME

Les certificats Let's Encrypt sont générés automatiquement :

1. **Première requête HTTPS** → Déclenche la génération
2. **Challenge HTTP** → Validation du domaine
3. **Certificat généré** → Stocké dans `/letsencrypt/acme.json`

### Vérification des certificats

```bash
# Vérifier les certificats
openssl s_client -connect app.diaspomoney.fr:443 -servername app.diaspomoney.fr

# Vérifier la validité
curl -I https://app.diaspomoney.fr
```

## 🌍 Services accessibles

Une fois déployé, les services sont accessibles via :

- **Application principale** : https://app.diaspomoney.fr
- **Dashboard Traefik** : https://dashboard.diaspomoney.fr
- **MongoDB Express** : https://mongo.diaspomoney.fr
- **Grafana** : https://dashboard.diaspomoney.fr/grafana
- **Prometheus** : https://dashboard.diaspomoney.fr/prometheus
- **Loki** : https://dashboard.diaspomoney.fr/loki

## 🔧 Maintenance

### Mise à jour

```bash
# Arrêter les services
docker-compose -f docker/docker-compose.yml -f docker/docker-compose.prod.yml down

# Mettre à jour le code
git pull

# Redémarrer
./scripts/start-prod.sh
```

### Sauvegarde

```bash
# Sauvegarder les volumes
docker run --rm -v diaspomoney_mongodb_data:/data -v $(pwd):/backup ubuntu tar czf /backup/mongodb-backup.tar.gz /data
docker run --rm -v diaspomoney_traefik_letsencrypt:/data -v $(pwd):/backup ubuntu tar czf /backup/letsencrypt-backup.tar.gz /data
```

### Monitoring

```bash
# Logs en temps réel
docker-compose -f docker/docker-compose.yml -f docker/docker-compose.prod.yml logs -f

# Métriques
curl http://localhost:9100/metrics
```

## 🚨 Dépannage

### Problèmes courants

#### Certificats non générés

```bash
# Vérifier les logs ACME
docker logs traefik | grep -i acme

# Vérifier la résolution DNS
nslookup app.diaspomoney.fr

# Vérifier l'accessibilité
curl -I http://app.diaspomoney.fr
```

#### Services non accessibles

```bash
# Vérifier les conteneurs
docker ps

# Vérifier les réseaux
docker network ls

# Vérifier les logs
docker logs app
```

#### Problèmes de performance

```bash
# Utilisation des ressources
docker stats

# Logs d'erreur
docker logs traefik --tail=100
```

## 📞 Support

En cas de problème :

1. Vérifiez les logs : `docker logs <service>`
2. Vérifiez la configuration DNS
3. Vérifiez les ports ouverts (80, 443)
4. Vérifiez l'espace disque disponible

---

**Note** : Ce guide suppose que vous avez un serveur avec une IP publique et un domaine configuré. Pour un environnement de développement local, utilisez HTTP uniquement.
