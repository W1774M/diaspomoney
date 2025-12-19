# 🔧 Guide de Dépannage - Connexion SSH

## ✅ Statut : Connexion SSH Fonctionnelle

**Date de vérification :** 2025-12-06

La connexion SSH manuelle fonctionne correctement :
- ✅ Port 22 accessible (`TcpTestSucceeded : True`)
- ✅ Authentification par clé publique (`id_ed25519`)
- ✅ Serveur : Ubuntu 24.04.3 LTS
- ✅ Utilisateur : `root@217.154.22.202`

## 🚨 Problème Initial (Résolu)

Erreur de connexion SSH lors de la tentative de connexion à `217.154.22.202` :

```
Connection to 217.154.22.202 port 22 timed out
Error installing server: Failed to connect to the remote SSH host
```

**Résolution :** La connexion SSH fonctionne manuellement. Le problème était probablement lié à la configuration de Cursor Remote SSH.

## 🔍 Diagnostic

### 1. Vérifier l'Accessibilité du Serveur

Testez la connexion SSH depuis votre terminal :

```bash
# Test de connexion SSH basique
ssh -v user@217.154.22.202

# Test avec timeout personnalisé
ssh -o ConnectTimeout=10 user@217.154.22.202
```

### 2. Vérifier la Connectivité Réseau

```bash
# Ping du serveur
ping 217.154.22.202

# Test du port 22
telnet 217.154.22.202 22
# ou avec PowerShell
Test-NetConnection -ComputerName 217.154.22.202 -Port 22
```

### 3. Vérifier le Firewall

Le port 22 (SSH) peut être bloqué par :
- Le firewall Windows local
- Le firewall du serveur distant
- Un pare-feu réseau intermédiaire

## ✅ Solutions

### Solution 1 : Vérifier la Configuration SSH dans Cursor

1. Ouvrez les paramètres de Cursor (`Ctrl + ,`)
2. Recherchez "Remote SSH"
3. Vérifiez la configuration SSH :
   - Format : `user@217.154.22.202`
   - Port : `22` (ou le port SSH personnalisé)
   - Clé SSH : Chemin vers votre clé privée si nécessaire

### Solution 2 : Configurer le Fichier SSH Config ✅ RECOMMANDÉ

Créez/modifiez le fichier `C:\Users\Admin\.ssh\config` sur Windows :

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

**Configuration confirmée :**
- ✅ Utilisateur : `root`
- ✅ Clé SSH : `id_ed25519` (ED25519 SHA256:ucNuqZNNzt2b0K2zBQHrw1Pm19cxkAIt81J2CmYBPRQ)
- ✅ Serveur : Ubuntu 24.04.3 LTS

**Utilisation dans Cursor :**
1. Ouvrez la palette de commandes (`Ctrl + Shift + P`)
2. Tapez "Remote-SSH: Connect to Host"
3. Sélectionnez `diaspomoney-server` (ou entrez `root@217.154.22.202`)
4. Cursor installera automatiquement le serveur distant

### Solution 3 : Vérifier les Informations de Connexion

Assurez-vous d'avoir :
- ✅ Le bon nom d'utilisateur
- ✅ Le bon port SSH (peut être différent de 22)
- ✅ La clé SSH correcte ou le mot de passe
- ✅ Les permissions d'accès au serveur

### Solution 4 : Utiliser un Tunnel SSH

Si le serveur SSH n'est pas directement accessible, vous pouvez utiliser un tunnel :

```bash
# Créer un tunnel SSH via un serveur intermédiaire
ssh -L 2222:217.154.22.202:22 user@serveur-intermediaire
```

Puis connectez-vous à `localhost:2222` dans Cursor.

### Solution 5 : Vérifier le Service SSH sur le Serveur

Sur le serveur distant, vérifiez que le service SSH est actif :

```bash
# Sur Linux
sudo systemctl status sshd
# ou
sudo systemctl status ssh

# Redémarrer si nécessaire
sudo systemctl restart sshd
```

### Solution 6 : Vérifier les Logs SSH

Consultez les logs SSH pour plus de détails :

```bash
# Sur le serveur distant
sudo tail -f /var/log/auth.log
# ou
sudo journalctl -u sshd -f
```

## 🔐 Configuration de Clé SSH

Si vous utilisez une clé SSH :

1. **Générer une clé SSH** (si vous n'en avez pas) :
```bash
ssh-keygen -t rsa -b 4096 -C "votre-email@example.com"
```

2. **Copier la clé publique sur le serveur** :
```bash
ssh-copy-id user@217.154.22.202
# ou manuellement
cat ~/.ssh/id_rsa.pub | ssh user@217.154.22.202 "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys"
```

3. **Tester la connexion** :
```bash
ssh user@217.154.22.202
```

## 🌐 Alternative : Connexion Directe (Sans Remote SSH)

Si vous ne pouvez pas vous connecter via SSH, vous pouvez :

1. **Développer en local** et synchroniser via Git
2. **Utiliser Docker** pour un environnement similaire
3. **Utiliser un VPN** si le serveur est sur un réseau privé

## 📝 Notes Importantes

- ✅ **Connexion SSH vérifiée et fonctionnelle**
- L'adresse IP `217.154.22.202` est également utilisée pour MongoDB dans la configuration
- Serveur : Ubuntu 24.04.3 LTS (GNU/Linux 6.8.0-87-generic x86_64)
- Clé SSH utilisée : `id_ed25519` (ED25519)
- **Important :** 25 mises à jour système disponibles sur le serveur

## 🎯 Configuration Cursor Remote SSH

### Étapes pour Connecter Cursor au Serveur

1. **Ouvrir la palette de commandes** : `Ctrl + Shift + P`

2. **Sélectionner** : `Remote-SSH: Connect to Host...`

3. **Choisir l'option** :
   - Soit `diaspomoney-server` (si vous avez créé le fichier config)
   - Soit `root@217.154.22.202` directement

4. **Sélectionner la plateforme** : `Linux` (Ubuntu)

5. **Attendre l'installation** : Cursor installera automatiquement le serveur distant

6. **Ouvrir un dossier** : Une fois connecté, ouvrez le dossier du projet

### Si l'Installation Échoue

Si Cursor ne peut pas installer le serveur distant :

1. **Vérifier les permissions** :
   ```bash
   ssh root@217.154.22.202 "mkdir -p ~/.cursor-server && chmod 755 ~/.cursor-server"
   ```

2. **Vérifier l'espace disque** :
   ```bash
   ssh root@217.154.22.202 "df -h"
   ```

3. **Vérifier les prérequis** :
   ```bash
   ssh root@217.154.22.202 "which node npm git"
   ```

## 🆘 Support

Si le problème persiste :

1. Vérifiez avec votre administrateur système
2. Consultez les logs détaillés de Cursor
3. Vérifiez la documentation de votre fournisseur de serveur

---

**Dernière mise à jour :** 2025-12-06

