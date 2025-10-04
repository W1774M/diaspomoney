# 📊 Données Mock pour les Services

## 🎯 Objectif

Intégration des données mock des providers dans la section `/services` pour fournir des données réalistes et cohérentes.

## 📁 Fichiers Modifiés

### 1. **Services à Venir** (`app/dashboard/services/upcoming/page.tsx`)

```typescript
// Utilisation des données mock
const mockServices = MOCK_USERS.filter(
  user => user.roles.includes("PROVIDER") && user.status === "ACTIVE"
)
  .slice(0, 3)
  .map((provider, index) => ({
    id: provider._id,
    title: provider.selectedServices || "Service professionnel",
    provider: provider.name,
    date: new Date(Date.now() + (index + 1) * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    time: provider.availabilities?.[0]?.split("-")[0] || "09:00",
    location: provider.address || "En ligne",
    status: index === 0 ? "confirmed" : "pending",
    specialty: provider.specialty,
    company: provider.company,
  }));
```

### 2. **Suivi des Services** (`app/dashboard/services/tracking/page.tsx`)

```typescript
// Services en cours de réalisation
const mockServices = MOCK_USERS.filter(
  user => user.roles.includes("PROVIDER") && user.status === "ACTIVE"
)
  .slice(0, 2)
  .map((provider, index) => ({
    id: provider._id,
    title: provider.selectedServices || "Service professionnel",
    provider: provider.name,
    startTime: provider.availabilities?.[0]?.split("-")[0] || "09:00",
    endTime: provider.availabilities?.[0]?.split("-")[1] || "10:00",
    location: provider.address || "En ligne",
    status: index === 0 ? "in_progress" : "waiting",
    progress: index === 0 ? 65 : 0,
    specialty: provider.specialty,
    company: provider.company,
  }));
```

### 3. **Historique des Services** (`app/dashboard/services/history/page.tsx`)

```typescript
// Services terminés et annulés
const mockServices = MOCK_USERS.filter(
  user => user.roles.includes("PROVIDER") && user.status === "ACTIVE"
)
  .slice(0, 3)
  .map((provider, index) => ({
    id: provider._id,
    title: provider.selectedServices || "Service professionnel",
    provider: provider.name,
    date: new Date(Date.now() - (index + 1) * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    time: provider.availabilities?.[0]?.split("-")[0] || "14:30",
    location: provider.address || "En ligne",
    status: index === 2 ? "cancelled" : "completed",
    rating: index === 2 ? null : provider.rating || 4.5,
    specialty: provider.specialty,
    company: provider.company,
  }));
```

## 🔧 Fonctionnalités Ajoutées

### ✅ **Données Réalistes**

- **Providers actifs** : Filtrage des utilisateurs avec rôle `PROVIDER` et statut `ACTIVE`
- **Informations complètes** : Nom, entreprise, spécialité, adresse, disponibilités
- **Dates dynamiques** : Services à venir (dates futures), historique (dates passées)

### ✅ **Informations Enrichies**

- **Nom du provider** avec entreprise entre parenthèses
- **Spécialité** affichée comme badge
- **Adresse** ou "En ligne" selon la disponibilité
- **Disponibilités** utilisées pour les créneaux horaires
- **Notes** des providers pour l'historique

### ✅ **États Variés**

- **Services à venir** : Statuts "confirmed" et "pending"
- **Suivi** : Statuts "in_progress" et "waiting" avec barre de progression
- **Historique** : Statuts "completed" et "cancelled" avec notes

## 🧪 Tests Disponibles

```bash
# Tester les données mock des services
npm run test:services

# Tester l'API des bénéficiaires
npm run test:api

# Tester la déconnexion
npm run test:signout
```

## 📊 Données Utilisées

### **Providers Mock Disponibles**

1. **Dr. Marie Dubois** (Médecine générale)
   - Entreprise : Clinique Horizon
   - Services : Consultation, Suivi, Téléconsultation
   - Note : 4.6/5
   - Disponibilités : 09:00-09:30, 10:00-10:30, 14:00-14:30

2. **L'ELDORADO** (Éducation)
   - Services : Halte garderie, Maternelle, Primaire, Collège
   - Note : 4.5/5
   - Disponibilités : Variables selon le service

3. **Autres providers** selon les données mock

### **Mapping des Données**

| Champ Mock         | Champ Service | Description            |
| ------------------ | ------------- | ---------------------- |
| `_id`              | `id`          | Identifiant unique     |
| `name`             | `provider`    | Nom du provider        |
| `selectedServices` | `title`       | Titre du service       |
| `specialty`        | `specialty`   | Spécialité du provider |
| `company`          | `company`     | Entreprise du provider |
| `address`          | `location`    | Lieu du service        |
| `availabilities`   | `time`        | Créneaux horaires      |
| `rating`           | `rating`      | Note du provider       |

## 🎨 Améliorations UI

### **Affichage Enrichi**

- **Nom + Entreprise** : "Dr. Martin (Clinique Horizon)"
- **Badge spécialité** : Affichage de la spécialité en badge gris
- **Informations complètes** : Toutes les données mock sont utilisées

### **États Visuels**

- **Services confirmés** : Badge vert "Confirmé"
- **Services en attente** : Badge jaune "En attente"
- **Services en cours** : Badge bleu "En cours" avec barre de progression
- **Services terminés** : Badge vert "Terminé" avec note
- **Services annulés** : Badge rouge "Annulé"

## 🚀 Avantages

1. **Données Cohérentes** : Utilisation des mêmes providers dans toutes les sections
2. **Informations Complètes** : Toutes les données mock sont exploitées
3. **Réalisme** : Dates, horaires et statuts variés
4. **Maintenabilité** : Un seul fichier mock à maintenir
5. **Flexibilité** : Facile d'ajouter de nouveaux providers

## 📝 Notes Techniques

- **Filtrage** : Seuls les providers actifs sont utilisés
- **Limitation** : Maximum 3 services par section pour éviter la surcharge
- **Dates dynamiques** : Calcul automatique des dates futures/passées
- **Fallbacks** : Valeurs par défaut si les données mock sont manquantes
- **Types** : Utilisation des types TypeScript existants

## 🔄 Prochaines Étapes

1. **API Réelle** : Remplacer les données mock par des appels API
2. **Pagination** : Gérer un grand nombre de services
3. **Filtres** : Ajouter des filtres par spécialité, date, statut
4. **Recherche** : Fonctionnalité de recherche dans les services
5. **Notifications** : Alertes pour les services à venir
