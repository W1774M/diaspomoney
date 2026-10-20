# App — recette

Les manifests complets ont été migrés vers Kustomize.

**Chemin canonique :**

```bash
kubectl apply -k k8s/app/overlays/rct
```

Ce dossier ne contient qu’un wrapper (`kustomization.yaml`) qui pointe vers `../overlays/rct`.
