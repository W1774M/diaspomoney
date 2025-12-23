# 🔒 Configuration TLS/SSL - DiaspoMoney

## 📋 Configuration recommandée : Let's Encrypt

**✅ Configuration automatique avec Let's Encrypt** - Utilisez cette méthode pour obtenir de vrais certificats SSL.

### 🚀 Configuration rapide

1. **Vérifier la configuration DNS** :
```bash
./scripts/verify-letsencrypt.sh
```

2. **Configurer Let's Encrypt** :
```bash
./scripts/setup-letsencrypt.sh
```

3. **Vérifier que tout fonctionne** :
```bash
./scripts/verify-letsencrypt.sh
```

Les certificats seront générés automatiquement lors des premières requêtes HTTPS.

### 📝 Détails de la configuration

#### Prérequis

1. **DNS configuré** : Les domaines doivent pointer vers votre serveur
   - `dev.diaspomoney.fr`
   - `rct.diaspomoney.fr`
   - `diaspomoney.fr`

2. **Ports ouverts** : Les ports 80 et 443 doivent être accessibles depuis Internet

3. **Traefik installé** : Traefik doit être installé dans le namespace `kube-system`

#### Configuration automatique

Le script `setup-letsencrypt.sh` :
- ✅ Configure Traefik avec ACME (Let's Encrypt)
- ✅ Utilise httpChallenge (plus fiable)
- ✅ Configure tlsChallenge en complément
- ✅ Met à jour Traefik via Helm

#### Mode staging (pour les tests)

Pour tester sans consommer le quota Let's Encrypt :
```bash
./scripts/setup-letsencrypt.sh --staging
```

⚠️ Les certificats staging ne seront pas reconnus par les navigateurs.

---

## 🔧 Solutions alternatives

### Solution 1 : Certificat auto-signé (Développement/Test uniquement)

⚠️ **Uniquement pour le développement local** - Utilisez le script :

```bash
./scripts/create-tls-secret.sh
```

**Limitations** :
- Les navigateurs afficheront un avertissement
- Non sécurisé pour la production
- Fonctionne pour les tests locaux

### Solution 2 : Let's Encrypt avec Traefik (Production) - ✅ RECOMMANDÉ

#### Configuration automatique (recommandé)

Utilisez le script fourni :
```bash
./scripts/setup-letsencrypt.sh
```

#### Configuration manuelle

Si vous préférez configurer manuellement :

1. **Appliquer le ConfigMap** :
```bash
kubectl apply -f k8s/traefik/traefik-config.yaml
```

2. **Mettre à jour Traefik via Helm** :
```bash
helm upgrade traefik traefik/traefik \
  --namespace kube-system \
  --set "additionalArguments={--certificatesresolvers.le.acme.email=contact@diaspomoney.fr,--certificatesresolvers.le.acme.storage=/data/acme.json,--certificatesresolvers.le.acme.httpchallenge=true,--certificatesresolvers.le.acme.httpchallenge.entrypoint=web,--certificatesresolvers.le.acme.tlschallenge=true}" \
  --reuse-values
```

3. **Vérifier les IngressRoutes** :
Les IngressRoutes doivent utiliser `certResolver: le` au lieu de `secretName`. Les fichiers ont déjà été mis à jour.

#### Rate limits Let's Encrypt

Let's Encrypt limite à :
- 5 échecs par heure par domaine
- 50 certificats par semaine par domaine

Si vous atteignez la limite, attendez 1 heure avant de réessayer.

#### Supprimer les certificats auto-signés

Une fois Let's Encrypt configuré, vous pouvez supprimer les secrets auto-signés :

```bash
kubectl delete secret dev-tls-cert rct-tls-cert app-tls-cert diaspomoney-tls -n diaspomoney
```

Traefik générera automatiquement de nouveaux certificats Let's Encrypt.

### Solution 3 : Utiliser un certificat externe

Si vous avez un certificat SSL d'un autre fournisseur :

```bash
# Créer le secret avec votre certificat
kubectl create secret tls diaspomoney-tls \
  --cert=/path/to/cert.crt \
  --key=/path/to/key.key \
  -n diaspomoney
```

## 🔍 Vérification

### Vérifier le certificat actuel

```bash
# Avec curl (ignorer l'avertissement auto-signé)
curl -k -v https://dev.diaspomoney.fr 2>&1 | grep -i "certificate\|subject"

# Vérifier le secret
kubectl get secret diaspomoney-tls -n diaspomoney -o yaml
```

### Vérifier les logs Traefik

```bash
kubectl logs -n kube-system -l app.kubernetes.io/name=traefik | grep -i "cert\|acme\|tls"
```

## 📝 Notes importantes

1. **Rate Limit Let's Encrypt** :
   - 5 échecs par heure par domaine
   - 50 certificats par semaine par domaine
   - Attendre avant de réessayer

2. **DNS requis** : Les domaines doivent pointer vers votre serveur pour Let's Encrypt

3. **Ports ouverts** : Ports 80 et 443 doivent être accessibles depuis Internet

4. **Certificat auto-signé** : Acceptable pour dev/test, **PAS pour production**

## 🚀 Commandes utiles

```bash
# Configurer Let's Encrypt (recommandé)
./scripts/setup-letsencrypt.sh

# Vérifier la configuration Let's Encrypt
./scripts/verify-letsencrypt.sh

# Créer certificat auto-signé (dev uniquement)
./scripts/create-tls-secret.sh

# Vérifier les secrets TLS
./scripts/verify-tls-secrets.sh

# Voir les certificats dans Traefik
kubectl logs -n kube-system -l app.kubernetes.io/name=traefik | grep -i certificate

# Tester la connexion HTTPS
curl -v https://dev.diaspomoney.fr
curl -v https://rct.diaspomoney.fr
curl -v https://diaspomoney.fr
```

---

**Dernière mise à jour** : $(date)

