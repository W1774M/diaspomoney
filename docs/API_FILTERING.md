# Filtrage par Groupe - API DiaspoMoney

## Vue d'ensemble

L'API DiaspoMoney supporte maintenant le filtrage par groupe de prestataires. Les prestataires sont organisés en trois groupes principaux :

- **sante** : Services de santé (cliniques, médecins, hôpitaux, etc.)
- **edu** : Services d'éducation (écoles, universités, formations, etc.)
- **immo** : Services immobiliers (construction, rénovation, immobilier, etc.)

## Structure du Modèle

### Provider Type avec Groupe

```typescript
interface ProviderType {
  id: string | number;
  value: string;
  group: string; // "sante" | "edu" | "immo"
}
```

### Exemple de Données

```json
{
  "id": 1,
  "name": "Clinique La Paix 2",
  "type": {
    "id": 1,
    "value": "Clinique",
    "group": "sante"
  },
  "specialty": "Médecine générale",
  "services": [...]
}
```

## API Endpoints

### GET /api/providers

Filtrage par groupe avec le paramètre `group`.

#### Paramètres de Requête

- `group` (optionnel) : Filtre par groupe de prestataires
  - `sante` : Services de santé
  - `edu` : Services d'éducation
  - `immo` : Services immobiliers

#### Exemples d'Utilisation

```bash
# Récupérer tous les prestataires de santé
GET /api/providers?group=sante

# Récupérer tous les prestataires d'éducation
GET /api/providers?group=edu

# Récupérer tous les prestataires immobiliers
GET /api/providers?group=immo

# Combiner avec d'autres filtres
GET /api/providers?group=sante&specialty=Cardiologie&priceMax=100
```

#### Réponse

```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "id": 1,
      "name": "Clinique La Paix 2",
      "type": {
        "id": 1,
        "value": "Clinique",
        "group": "sante"
      },
      "specialty": "Médecine générale",
      "services": [...]
    }
  ],
  "count": 7
}
```

## Mapping des Types vers Groupes

| Type ID | Type Value     | Groupe |
| ------- | -------------- | ------ |
| 1       | Clinique       | sante  |
| 2       | Centre médical | sante  |
| 3       | Médecin        | sante  |
| 4       | Hôpital        | sante  |
| 5       | École          | edu    |
| 6       | Université     | edu    |
| 7       | Formation      | edu    |
| 8       | Construction   | immo   |
| 9       | Immobilier     | immo   |
| 10      | Rénovation     | immo   |

## Utilisation dans le Frontend

### Hook useProviders

```typescript
import { useProviders } from "@/hooks/data/useProviders";

function MyComponent() {
  const { providers, loading, error } = useProviders({
    group: "sante", // Filtrer par groupe santé
    specialty: "Cardiologie", // Combiner avec d'autres filtres
    priceMax: 100,
  });

  return (
    <div>
      {providers.map((provider) => (
        <div key={provider.id}>{provider.name}</div>
      ))}
    </div>
  );
}
```

### Interface TypeScript

```typescript
interface UseProvidersOptions {
  type?: string;
  group?: string; // "sante" | "edu" | "immo"
  specialty?: string;
  service?: string;
  country?: string;
  city?: string;
  priceMax?: number;
  recommended?: boolean;
  sortBy?: string;
}
```

## Migration des Données

Pour ajouter le champ `group` aux prestataires existants, utilisez le script de migration :

```bash
pnpm run migrate:groups
```

Ce script :

1. Se connecte à MongoDB
2. Mappe les types existants vers les groupes appropriés
3. Met à jour tous les prestataires avec le champ `group`
4. Affiche les statistiques par groupe

## Exemples de Requêtes

### Requête cURL

```bash
# Prestataires de santé
curl "http://localhost:3000/api/providers?group=sante"

# Prestataires d'éducation avec prix max
curl "http://localhost:3000/api/providers?group=edu&priceMax=200"

# Prestataires immobiliers recommandés
curl "http://localhost:3000/api/providers?group=immo&recommended=true"
```

### JavaScript/Fetch

```javascript
// Récupérer les prestataires de santé
const response = await fetch("/api/providers?group=sante");
const data = await response.json();

if (data.success) {
  console.log(`${data.count} prestataires de santé trouvés`);
  data.data.forEach(provider => {
    console.log(`${provider.name} - ${provider.type.value}`);
  });
}
```

## Validation

Le champ `group` est validé avec les valeurs autorisées :

```typescript
group: {
  type: String,
  required: true,
  enum: ['sante', 'edu', 'immo']
}
```

## Performance

Le filtrage par groupe utilise un index MongoDB sur `type.group` pour des performances optimales. Les requêtes sont optimisées pour retourner rapidement les résultats filtrés.
