# Migration vers MongoDB - DiaspoMoney

## 🗄️ Architecture de la Base de Données

Le projet a été migré de données statiques vers MongoDB pour une meilleure scalabilité et gestion des données.

### Modèles de Données

#### 1. **Provider** (`models/Provider.ts`)

- **Prestataires de services** (cliniques, écoles, BTP, etc.)
- **Champs principaux** : id, name, type, specialty, services, rating, etc.
- **Index** : type.id, specialty, recommended, rating

#### 2. **Appointment** (`models/Appointment.ts`)

- **Rendez-vous et réservations**
- **Champs principaux** : reservationNumber, requester, recipient, provider, status, paymentStatus
- **Index** : reservationNumber, requester.email, status, paymentStatus

#### 3. **RetryToken** (`models/RetryToken.ts`)

- **Tokens de retry pour paiements échoués**
- **TTL Index** : suppression automatique après expiration

### API Routes

#### `/api/providers`

- `GET` : Récupérer tous les prestataires avec filtres
- `POST` : Créer un nouveau prestataire

#### `/api/providers/[id]`

- `GET` : Récupérer un prestataire spécifique
- `PUT` : Mettre à jour un prestataire
- `DELETE` : Supprimer un prestataire

### Hooks Personnalisés

#### `useProviders(options)`

```typescript
const { providers, loading, error, refetch } = useProviders({
  type: "1,2,3", // Filtre par type
  specialty: "Médecine", // Filtre par spécialité
  service: "Consultation", // Filtre par service
  country: "Cameroun", // Filtre par pays
  city: "Douala", // Filtre par ville
  priceMax: 100, // Prix maximum
  recommended: true, // Seulement recommandés
  sortBy: "rating", // Tri par note
});
```

#### `useProvider(id)`

```typescript
const { provider, loading, error, refetch } = useProvider("123");
```

## 🚀 Installation et Configuration

### 1. **Démarrer MongoDB avec Docker**

```bash
docker-compose up -d
```

### 2. **Migrer les données statiques**

```bash
npm run migrate
```

### 3. **Vérifier la migration**

```bash
# Accéder à Mongo Express
# http://localhost:8081
# Vérifier la collection "providers"
```

## 📊 Filtres et Recherche

### Types de Prestataires

- **Santé** : IDs 1,2,3,4 (Clinique, Centre médical, Médecin, Hôpital)
- **Éducation** : IDs 5,6,7 (École, Université, Formation)
- **BTP** : IDs 8,9,10 (Construction, Immobilier, Rénovation)

### Exemples de Requêtes API

```bash
# Tous les prestataires de santé
GET /api/providers?type=1,2,3,4

# Prestataires recommandés à Douala
GET /api/providers?recommended=true&city=Douala

# Prestataires par spécialité
GET /api/providers?specialty=Médecine%20générale

# Tri par prix croissant
GET /api/providers?sortBy=price_asc

# Filtre par prix maximum
GET /api/providers?priceMax=50
```

## 🔧 Développement

### Ajouter un nouveau prestataire

```typescript
const newProvider = {
  id: 999,
  name: "Nouvelle Clinique",
  type: { id: 1, value: "Clinique" },
  specialty: "Médecine générale",
  recommended: true,
  services: [{ id: 1, name: "Consultation", price: 30 }],
  // ... autres champs
};

await fetch("/api/providers", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(newProvider),
});
```

### Mettre à jour un prestataire

```typescript
await fetch("/api/providers/123", {
  method: "PUT",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ rating: 4.5 }),
});
```

## 📈 Performance

### Index MongoDB

- **Provider** : type.id, specialty, recommended, rating
- **Appointment** : reservationNumber, requester.email, status, paymentStatus
- **RetryToken** : TTL sur expiresAt

### Optimisations

- **Pagination** côté serveur
- **Filtres** optimisés avec index
- **Cache** des requêtes fréquentes
- **TTL** pour nettoyage automatique

## 🔒 Sécurité

### Validation des Données

- **Mongoose Schemas** avec validation
- **Sanitisation** des entrées utilisateur
- **Types TypeScript** pour la sécurité des types

### Gestion des Erreurs

- **Try-catch** dans toutes les API routes
- **Messages d'erreur** explicites
- **Logs** pour le debugging

## 🧪 Tests

### Tester la Migration

```bash
# Vérifier que les données sont migrées
curl http://localhost:3000/api/providers

# Tester les filtres
curl "http://localhost:3000/api/providers?type=1,2,3,4&recommended=true"
```

### Tester les Hooks

```typescript
// Dans un composant React
const { providers, loading, error } = useProviders({
  type: "1,2,3,4",
  recommended: true,
});

console.log("Prestataires:", providers);
console.log("Chargement:", loading);
console.log("Erreur:", error);
```

## 📝 Notes Importantes

1. **Migration unique** : Le script de migration peut être exécuté plusieurs fois sans doublons
2. **IDs uniques** : Chaque prestataire a un ID unique dans la base de données
3. **Services avec IDs** : Tous les services ont maintenant des IDs uniques
4. **Compatibilité** : L'interface utilisateur reste identique, seule la source de données change

## 🆘 Dépannage

### Erreur de Connexion MongoDB

```bash
# Vérifier que Docker est démarré
docker ps

# Redémarrer les conteneurs
docker-compose down && docker-compose up -d
```

### Erreur de Migration

```bash
# Vérifier les logs
docker-compose logs mongodb

# Réinitialiser la base
docker-compose down -v && docker-compose up -d
npm run migrate
```

### Erreur API

```bash
# Vérifier les logs Next.js
npm run dev

# Tester l'API directement
curl http://localhost:3000/api/providers
```

# Tous les prestataires

curl http://localhost:3000/api/providers

# Prestataires de santé

curl "http://localhost:3000/api/providers?type=1,2,3,4"

# Prestataires recommandés

curl "http://localhost:3000/api/providers?recommended=true"
