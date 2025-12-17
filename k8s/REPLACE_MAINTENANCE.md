# 🔄 Remplacement de l'application de maintenance

Ce guide explique comment remplacer l'application de maintenance par l'application de production sur `diaspomoney.fr`.

## 📋 Modifications effectuées

### 1. ✅ Correction du service de production
- **Fichier**: `diaspomoney/k8s/app/prod/service.yaml`
- **Changement**: Le selector pointe maintenant vers `app: diaspomoney-app` (au lieu de `app: diaspomoney`)

### 2. ✅ Mise à jour de l'IngressRoute de production
- **Fichier**: `diaspomoney/k8s/app/prod/ingress.yaml`
- **Ajouts**:
  - Support du challenge ACME pour Let's Encrypt (route `/.well-known/acme-challenge`)
  - Redirection www.diaspomoney.fr → diaspomoney.fr
  - Middleware de sécurité (en-têtes HTTP sécurisés)
  - Middleware de redirection www vers non-www

## 🚀 Déploiement

### Étape 1 : Supprimer l'application de maintenance

```bash
# Option 1 : Utiliser le script automatique
cd diaspomoney/k8s
./remove-maintenance.sh

# Option 2 : Supprimer manuellement
kubectl delete ingressroute maintenance-page-ingressroute-https -n diaspomoney
kubectl delete ingressroute maintenance-page-ingressroute-http -n diaspomoney
kubectl delete ingressroute maintenance-page-www-redirect-https -n diaspomoney
kubectl delete ingressroute maintenance-page-www-redirect-http -n diaspomoney
kubectl delete ingressroute maintenance-page-acme-challenge -n diaspomoney
kubectl delete deployment maintenance-page -n diaspomoney
kubectl delete service maintenance-page-service -n diaspomoney
```

### Étape 2 : Appliquer la nouvelle configuration de production

```bash
# Appliquer le service corrigé
kubectl apply -f diaspomoney/k8s/app/prod/service.yaml

# Appliquer les IngressRoute avec les nouvelles fonctionnalités
kubectl apply -f diaspomoney/k8s/app/prod/ingress.yaml

# Vérifier que le déploiement existe
kubectl get deployment diaspomoney-app -n diaspomoney
```

### Étape 3 : Vérifier le déploiement

```bash
# Vérifier les pods
kubectl get pods -n diaspomoney -l app=diaspomoney-app

# Vérifier les services
kubectl get svc -n diaspomoney | grep diaspomoney

# Vérifier les IngressRoute
kubectl get ingressroute -n diaspomoney | grep diaspomoney

# Vérifier les logs
kubectl logs -f deployment/diaspomoney-app -n diaspomoney
```

## 🔍 Vérifications

1. **DNS** : Vérifier que `diaspomoney.fr` pointe vers votre cluster Kubernetes
2. **Certificat TLS** : Le certificat Let's Encrypt devrait être renouvelé automatiquement
3. **Application** : Accéder à https://diaspomoney.fr et vérifier que l'application fonctionne
4. **Redirection www** : Tester https://www.diaspomoney.fr → doit rediriger vers https://diaspomoney.fr

## ⚠️ Notes importantes

- Les ressources de maintenance dans `Maintenance/k8s/` peuvent être conservées pour référence ou supprimées
- Le middleware `security-headers` est maintenant inclus dans l'IngressRoute de production
- Le middleware `www-to-nonwww-redirect` redirige automatiquement www vers non-www
- La route ACME est maintenant gérée par l'application de production

## 🐛 Dépannage

Si l'application ne répond pas :

1. Vérifier que les pods sont en cours d'exécution :
   ```bash
   kubectl get pods -n diaspomoney -l app=diaspomoney-app
   ```

2. Vérifier les logs :
   ```bash
   kubectl logs -f deployment/diaspomoney-app -n diaspomoney
   ```

3. Vérifier les IngressRoute :
   ```bash
   kubectl describe ingressroute diaspomoney-ingressroute-https -n diaspomoney
   ```

4. Vérifier que le service pointe vers les bons pods :
   ```bash
   kubectl get endpoints diaspomoney-service -n diaspomoney
   ```

