# 🚀 Configuration Cursor Remote SSH - DiaspoMoney

## ✅ Connexion SSH Vérifiée

La connexion SSH au serveur `217.154.22.202` fonctionne correctement :

```
✅ Port 22 accessible
✅ Authentification par clé publique (id_ed25519)
✅ Serveur : Ubuntu 24.04.3 LTS
✅ Utilisateur : root
```

## 📋 Configuration Rapide

### 1. Créer le Fichier SSH Config

Créez/modifiez le fichier `C:\Users\Admin\.ssh\config` :

```ssh-config
Host diaspomoney-server
    HostName 217.154.22.202
    User root
    Port 22
    IdentityFile ~/.ssh/id_ed25519
    ServerAliveInterval 60
    ServerAliveCountMax 3
    ConnectTimeout 10
    ForwardAgent yes
    StrictHostKeyChecking accept-new
```

### 2. Connecter Cursor au Serveur

1. **Ouvrir la palette de commandes** : `Ctrl + Shift + P`

2. **Taper** : `Remote-SSH: Connect to Host...`

3. **Sélectionner** : `diaspomoney-server` (ou `root@217.154.22.202`)

4. **Choisir la plateforme** : `Linux`

5. **Attendre l'installation** du serveur distant Cursor

6. **Ouvrir le dossier** : `/root/diaspomoney` ou le chemin de votre projet

## 🔧 Prérequis sur le Serveur

Vérifiez que les outils suivants sont installés :

```bash
# Se connecter au serveur
ssh root@217.154.22.202

# Vérifier Node.js (requis pour Cursor Server)
node --version

# Vérifier npm
npm --version

# Vérifier Git
git --version

# Si manquants, installer :
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs git
```

## 🐛 Dépannage

### Problème : "Failed to install server"

**Solution 1 : Vérifier les permissions**
```bash
ssh root@217.154.22.202 "mkdir -p ~/.cursor-server && chmod 755 ~/.cursor-server"
```

**Solution 2 : Vérifier l'espace disque**
```bash
ssh root@217.154.22.202 "df -h"
```

**Solution 3 : Nettoyer les installations précédentes**
```bash
ssh root@217.154.22.202 "rm -rf ~/.cursor-server"
```

### Problème : "Connection timeout"

**Vérifier la connectivité :**
```powershell
Test-NetConnection -ComputerName 217.154.22.202 -Port 22
```

**Tester la connexion SSH :**
```bash
ssh -v root@217.154.22.202
```

### Problème : "Permission denied"

**Vérifier la clé SSH :**
```bash
# Sur Windows
cat C:\Users\Admin\.ssh\id_ed25519.pub

# Copier la clé sur le serveur si nécessaire
ssh-copy-id -i ~/.ssh/id_ed25519 root@217.154.22.202
```

## 📝 Informations du Serveur

- **IP** : `217.154.22.202`
- **OS** : Ubuntu 24.04.3 LTS
- **Kernel** : 6.8.0-87-generic x86_64
- **Utilisateur** : `root`
- **Clé SSH** : `id_ed25519`
- **Port SSH** : `22`

## 🔐 Sécurité

⚠️ **Note de sécurité** : L'utilisation de `root` pour SSH n'est pas recommandée en production. Considérez :

1. Créer un utilisateur dédié :
```bash
ssh root@217.154.22.202
adduser diaspomoney
usermod -aG sudo diaspomoney
```

2. Configurer l'authentification par clé pour le nouvel utilisateur

3. Désactiver la connexion root si possible

## 📚 Ressources

- [Documentation Cursor Remote SSH](https://cursor.sh/docs/remote-ssh)
- [Guide de dépannage SSH](./SSH_CONNECTION_TROUBLESHOOTING.md)

---

**Dernière mise à jour :** 2025-12-06





