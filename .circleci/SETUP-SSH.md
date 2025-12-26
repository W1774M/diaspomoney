# 🔐 Configuration SSH pour CircleCI

Si vous préférez utiliser SSH au lieu de HTTPS pour le checkout, suivez ces étapes :

## Option 1 : Ajouter la clé SSH dans CircleCI (Recommandé)

1. **Générez une clé SSH dédiée pour CircleCI** (si vous n'en avez pas) :
```bash
ssh-keygen -t ed25519 -C "circleci@diaspomoney" -f ~/.ssh/circleci_key
```

2. **Ajoutez la clé publique à GitHub** :
   - Copiez le contenu de `~/.ssh/circleci_key.pub`
   - Allez sur GitHub → Settings → SSH and GPG keys
   - Cliquez sur "New SSH key"
   - Collez la clé publique

3. **Ajoutez la clé privée dans CircleCI** :
   - Allez sur [app.circleci.com](https://app.circleci.com)
   - Sélectionnez votre projet `diaspomoney`
   - Allez dans **Project Settings → SSH Keys**
   - Cliquez sur "Add SSH Key"
   - Collez le contenu de `~/.ssh/circleci_key` (la clé privée)
   - Sauvegardez

## Option 2 : Utiliser votre clé SSH existante

Si vous avez déjà une clé SSH locale que vous utilisez pour GitHub :

1. **Trouvez votre clé SSH** :
```bash
# Généralement dans ~/.ssh/id_rsa ou ~/.ssh/id_ed25519
ls -la ~/.ssh/
```

2. **Vérifiez que la clé publique est sur GitHub** :
```bash
cat ~/.ssh/id_rsa.pub  # ou id_ed25519.pub
```
   - Vérifiez que cette clé est bien dans GitHub → Settings → SSH and GPG keys

3. **Ajoutez la clé privée dans CircleCI** :
   - Allez sur [app.circleci.com](https://app.circleci.com)
   - Sélectionnez votre projet `diaspomoney`
   - Allez dans **Project Settings → SSH Keys**
   - Cliquez sur "Add SSH Key"
   - Collez le contenu de votre clé privée (`~/.ssh/id_rsa` ou `~/.ssh/id_ed25519`)
   - Sauvegardez

## Option 3 : Forcer HTTPS (Plus simple, recommandé)

La configuration actuelle utilise déjà HTTPS. Si vous avez toujours des problèmes :

1. Vérifiez que votre projet est bien connecté à GitHub dans CircleCI
2. Allez dans **Project Settings → GitHub** et vérifiez la connexion

## Vérification

Après avoir ajouté la clé SSH dans CircleCI, le checkout devrait fonctionner automatiquement. CircleCI utilisera la clé configurée pour cloner le repository.

## Note de sécurité

⚠️ **Important** : Ne partagez jamais votre clé SSH privée publiquement. Utilisez uniquement les paramètres CircleCI pour l'ajouter.

