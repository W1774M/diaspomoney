# Scripts de Migration et Seeding

Ce dossier contient les scripts pour migrer et peupler la base de données avec des données de test.

## 🚀 Scripts Disponibles

### 1. Seeding des Bénéficiaires

```bash
npm run seed:beneficiaries
```

- Ajoute des données de test pour les bénéficiaires
- Utilise l'API REST existante
- Nécessite que le serveur Next.js soit démarré (`npm run dev`)

### 2. Test de l'API

```bash
npm run test:api
```

- Teste les endpoints de l'API des bénéficiaires
- Vérifie GET et POST
- Utile pour déboguer les problèmes d'API

## 📋 Prérequis

1. **Serveur Next.js démarré** :

   ```bash
   npm run dev
   ```

2. **Base de données MongoDB** :
   - Variable d'environnement `MONGODB_URI` configurée
   - Base de données accessible

3. **Utilisateur connecté** :
   - Session NextAuth active
   - Utilisateur authentifié

## 🔧 Utilisation

### Étape 1 : Démarrer le serveur

```bash
npm run dev
```

### Étape 2 : Se connecter à l'application

- Ouvrir http://localhost:3000
- Se connecter avec un compte utilisateur

### Étape 3 : Exécuter le seeding

```bash
npm run seed:beneficiaries
```

### Étape 4 : Vérifier les données

- Aller sur http://localhost:3000/dashboard/beneficiaries
- Vérifier que les bénéficiaires sont affichés

## 📊 Données de Test

Le script `seed-beneficiaries.mjs` ajoute 5 bénéficiaires de test :

1. **Sophie Durand** (Épouse) - avec compte
2. **Pierre Martin** (Fils) - avec compte
3. **Claire Dubois** (Mère) - sans compte
4. **Jean Dupont** (Père) - avec compte
5. **Marie Leroy** (Sœur) - sans compte

## 🐛 Dépannage

### Erreur "API non accessible"

- Vérifier que `npm run dev` est en cours
- Vérifier que le port 3000 est libre

### Erreur "Non authentifié"

- Se connecter à l'application d'abord
- Vérifier que la session NextAuth est active

### Erreur de base de données

- Vérifier la variable `MONGODB_URI`
- Vérifier la connexion MongoDB

## 📝 Notes

- Les scripts utilisent l'API REST existante
- Aucune modification directe de la base de données
- Respecte les validations et permissions existantes
- Idempotent (peut être exécuté plusieurs fois)
