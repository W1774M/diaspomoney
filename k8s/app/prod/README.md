# App — production

Les manifests complets ont été migrés vers Kustomize.

**Chemin canonique :**

```bash
kubectl apply -k k8s/app/overlays/prod
```

Ce dossier ne contient qu’un wrapper (`kustomization.yaml`) qui pointe vers `../overlays/prod`.
