# Scripts d'automatisation - DiaspoMoney

## Scripts disponibles

### `setup-kubectl.sh`
Configure kubectl pour se connecter au cluster K3s.

**Usage:**
```bash
./scripts/setup-kubectl.sh
```

### `init-k8s.sh`
Initialise le cluster K3s : crée le namespace, vérifie la configuration du registry, etc.

**Usage:**
```bash
./scripts/init-k8s.sh
```

### `check-registry.sh`
Vérifie que le registry Docker est accessible et configuré correctement.

**Usage:**
```bash
./scripts/check-registry.sh [registry-url]
# Exemple:
./scripts/check-registry.sh localhost:5000
```

### `deploy.sh`
Déploie automatiquement l'application dans l'environnement spécifié.

**Usage:**
```bash
./scripts/deploy.sh [dev|rct|prod] [image-tag]
# Exemples:
./scripts/deploy.sh dev
./scripts/deploy.sh prod v1.0.0
```

## Ordre d'exécution recommandé

1. **Configurer kubectl** (première fois seulement)
   ```bash
   ./scripts/setup-kubectl.sh
   ```

2. **Initialiser le cluster**
   ```bash
   ./scripts/init-k8s.sh
   ```

3. **Vérifier le registry**
   ```bash
   ./scripts/check-registry.sh
   ```

4. **Build et push l'image**
   ```bash
   pnpm k8s:dev
   ```

5. **Déployer l'application**
   ```bash
   ./scripts/deploy.sh dev
   ```

## Variables d'environnement

Les scripts utilisent les variables d'environnement suivantes (avec valeurs par défaut) :

- `REGISTRY` : URL du registry Docker (défaut: `localhost:5000`)
- `NAMESPACE` : Namespace Kubernetes (défaut: `diaspomoney`)
- `IMAGE_NAME` : Nom de l'image Docker (défaut: `diaspomoney`)

**Exemple:**
```bash
export REGISTRY=192.168.1.10:5000
export NAMESPACE=diaspomoney-prod
./scripts/deploy.sh prod
```

## Dépannage

### kubectl ne peut pas se connecter

```bash
# Vérifier que K3s est démarré
sudo systemctl status k3s

# Reconfigurer kubectl
./scripts/setup-kubectl.sh
```

### Registry non accessible

```bash
# Vérifier la connectivité
curl http://localhost:5000/v2/

# Vérifier la configuration K3s
cat /etc/rancher/k3s/registries.yaml

# Redémarrer K3s après modification
sudo systemctl restart k3s
```

### Namespace n'existe pas

```bash
# Créer le namespace
kubectl create namespace diaspomoney

# Ou utiliser le script d'initialisation
./scripts/init-k8s.sh
```
