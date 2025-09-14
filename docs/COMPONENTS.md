# Composants DiaspoMoney - Documentation

## Vue d'ensemble

Cette documentation décrit tous les composants React utilisés dans l'application DiaspoMoney, leur utilisation, leurs props et leurs exemples d'implémentation.

## Structure des dossiers

```
components/
├── ui/                    # Composants UI de base
├── features/             # Composants spécifiques aux fonctionnalités
│   ├── auth/            # Composants d'authentification
│   ├── providers/       # Composants des prestataires
│   └── hero/            # Composants de la page d'accueil
├── layout/              # Composants de mise en page
│   ├── header/          # En-tête de l'application
│   └── footer/          # Pied de page
└── common/              # Composants communs
```

## Composants UI de base

### Button

Composant de bouton réutilisable avec différents styles et états.

**Props :**

```typescript
interface ButtonProps {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  className?: string;
}
```

**Exemple d'utilisation :**

```tsx
import { Button } from "@/components/ui";

<Button variant="primary" size="lg" onClick={handleClick} loading={isLoading}>
  Cliquer ici
</Button>;
```

### Card

Composant de carte pour organiser le contenu.

**Props :**

```typescript
interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: "sm" | "md" | "lg";
  shadow?: "sm" | "md" | "lg";
}
```

**Exemple d'utilisation :**

```tsx
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui";

<Card className="max-w-md">
  <CardHeader>
    <h2>Titre de la carte</h2>
  </CardHeader>
  <CardContent>
    <p>Contenu de la carte</p>
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>;
```

### Form

Composant de formulaire avec validation intégrée.

**Props :**

```typescript
interface FormProps {
  children: React.ReactNode;
  onSubmit: (data: any) => void;
  className?: string;
}
```

**Exemple d'utilisation :**

```tsx
import { Form, FormField, FormLabel, Input } from "@/components/ui";

<Form onSubmit={handleSubmit}>
  <FormField error={errors.email?.message}>
    <FormLabel htmlFor="email">Email</FormLabel>
    <Input
      id="email"
      type="email"
      {...register("email")}
      placeholder="exemple@email.com"
    />
  </FormField>
  <Button type="submit">Envoyer</Button>
</Form>;
```

### Input

Composant de champ de saisie avec validation.

**Props :**

```typescript
interface InputProps {
  id?: string;
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  className?: string;
  error?: string;
}
```

### PasswordStrengthIndicator

Indicateur de force du mot de passe avec validation en temps réel.

**Props :**

```typescript
interface PasswordStrengthIndicatorProps {
  password: string;
  showPassword?: boolean;
  onTogglePassword?: () => void;
  className?: string;
}
```

**Exemple d'utilisation :**

```tsx
import { PasswordStrengthIndicator } from "@/components/ui";

<PasswordStrengthIndicator
  password={password}
  showPassword={showPassword}
  onTogglePassword={() => setShowPassword(!showPassword)}
/>;
```

### SecurityCaptcha

Composant de captcha pour protéger contre les bots.

**Props :**

```typescript
interface SecurityCaptchaProps {
  onSuccess: () => void;
  onFail: () => void;
  maxAttempts?: number;
  className?: string;
}
```

**Exemple d'utilisation :**

```tsx
import { SecurityCaptcha } from "@/components/ui";

<SecurityCaptcha
  onSuccess={() => console.log("Captcha réussi")}
  onFail={() => console.log("Captcha échoué")}
  maxAttempts={3}
/>;
```

## Composants d'authentification

### LoginForm

Formulaire de connexion avec validation et gestion d'erreurs.

**Props :**

```typescript
interface LoginFormProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  redirectTo?: string;
}
```

**Exemple d'utilisation :**

```tsx
import { LoginForm } from "@/components/features/auth";

<LoginForm
  onSuccess={() => router.push("/dashboard")}
  onError={error => setError(error)}
/>;
```

### RegisterForm

Formulaire d'inscription avec validation complète.

**Props :**

```typescript
interface RegisterFormProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}
```

### ResetPasswordForm

Formulaire de réinitialisation de mot de passe.

**Props :**

```typescript
interface ResetPasswordFormProps {
  token?: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}
```

### GoogleLoginButton

Bouton de connexion avec Google OAuth.

**Props :**

```typescript
interface GoogleLoginButtonProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  className?: string;
}
```

## Composants des prestataires

### ProviderCard

Carte affichant les informations d'un prestataire.

**Props :**

```typescript
interface ProviderCardProps {
  provider: Provider;
  onClick?: () => void;
  className?: string;
}
```

**Exemple d'utilisation :**

```tsx
import { ProviderCard } from "@/components/features/providers";

<ProviderCard
  provider={provider}
  onClick={() => router.push(`/provider/${provider.id}`)}
/>;
```

### ProviderList

Liste paginée des prestataires avec filtres.

**Props :**

```typescript
interface ProviderListProps {
  providers: Provider[];
  pagination: PaginationInfo;
  onPageChange: (page: number) => void;
  onFilterChange: (filters: FilterOptions) => void;
  loading?: boolean;
}
```

### ProviderModal

Modal pour afficher les détails d'un prestataire.

**Props :**

```typescript
interface ProviderModalProps {
  provider: Provider | null;
  isOpen: boolean;
  onClose: () => void;
  onBookAppointment: (provider: Provider) => void;
}
```

## Composants de mise en page

### Header

En-tête de l'application avec navigation et menu utilisateur.

**Props :**

```typescript
interface HeaderProps {
  user?: User;
  onLogout?: () => void;
  className?: string;
}
```

**Exemple d'utilisation :**

```tsx
import { Header } from "@/components/layout/header";

<Header user={session?.user} onLogout={() => signOut()} />;
```

### Footer

Pied de page avec liens et informations.

**Props :**

```typescript
interface FooterProps {
  className?: string;
}
```

### DefaultTemplate

Template de base pour toutes les pages.

**Props :**

```typescript
interface DefaultTemplateProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  className?: string;
}
```

**Exemple d'utilisation :**

```tsx
import DefaultTemplate from "@/template/DefaultTemplate";

<DefaultTemplate title="Page d'accueil" description="Bienvenue sur DiaspoMoney">
  <div>Contenu de la page</div>
</DefaultTemplate>;
```

## Composants communs

### NotificationContainer

Conteneur pour les notifications système.

**Props :**

```typescript
interface NotificationContainerProps {
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left";
  maxNotifications?: number;
}
```

### PageTransition

Composant pour les transitions de page.

**Props :**

```typescript
interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}
```

### ThemeToggle

Bouton pour basculer entre les thèmes clair/sombre.

**Props :**

```typescript
interface ThemeToggleProps {
  className?: string;
}
```

## Hooks personnalisés

### useForm

Hook pour la gestion des formulaires avec validation Zod.

**Utilisation :**

```tsx
import { useForm } from "@/hooks/forms/useForm";
import { loginSchema } from "@/lib/validations";

const {
  register,
  handleSubmit,
  formState: { errors },
} = useForm({
  schema: loginSchema,
  defaultValues: {
    email: "",
    password: "",
  },
});
```

### useProviders

Hook pour récupérer la liste des prestataires.

**Utilisation :**

```tsx
import { useProviders } from "@/hooks/data/useProviders";

const { providers, loading, error, refetch } = useProviders({
  page: 1,
  limit: 10,
  search: "recherche",
});
```

### useAppointment

Hook pour gérer les données de rendez-vous.

**Utilisation :**

```tsx
import { useAppointment } from "@/components/features/providers";

const { appointmentData, setAppointmentData, clearData } = useAppointment();
```

## Styles et thèmes

### Variables CSS

L'application utilise des variables CSS pour la cohérence des couleurs :

```css
:root {
  --primary: #2563eb;
  --primary-dark: #1d4ed8;
  --secondary: #64748b;
  --success: #10b981;
  --warning: #f59e0b;
  --error: #ef4444;
  --background: #ffffff;
  --foreground: #0f172a;
}
```

### Classes Tailwind

Classes Tailwind couramment utilisées :

- **Couleurs** : `bg-blue-600`, `text-gray-700`, `border-gray-200`
- **Espacement** : `p-4`, `m-2`, `space-y-4`
- **Typographie** : `text-lg`, `font-semibold`, `text-center`
- **Layout** : `flex`, `grid`, `container`, `max-w-md`
- **Effets** : `shadow-lg`, `rounded-lg`, `transition-all`

## Bonnes pratiques

### 1. Props typées

Toujours définir des interfaces TypeScript pour les props :

```tsx
interface MyComponentProps {
  title: string;
  description?: string;
  onAction: () => void;
}

export function MyComponent({
  title,
  description,
  onAction,
}: MyComponentProps) {
  // ...
}
```

### 2. Validation des props

Utiliser des valeurs par défaut et des validations :

```tsx
export function MyComponent({
  title,
  description = "Description par défaut",
  onAction,
}: MyComponentProps) {
  if (!title) {
    throw new Error("Title is required");
  }
  // ...
}
```

### 3. Gestion des états de chargement

Toujours gérer les états de chargement et d'erreur :

```tsx
export function DataComponent() {
  const { data, loading, error } = useData();

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  return <div>{data}</div>;
}
```

### 4. Accessibilité

Inclure les attributs d'accessibilité :

```tsx
<button
  aria-label="Fermer la modal"
  aria-describedby="modal-description"
  onClick={onClose}
>
  <XIcon aria-hidden="true" />
</button>
```

### 5. Performance

Utiliser React.memo pour les composants coûteux :

```tsx
export const ExpensiveComponent = React.memo(({ data }: Props) => {
  // Composant avec calculs coûteux
});
```

## Tests

### Tests unitaires

Exemple de test pour un composant :

```tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { Button } from "@/components/ui";

describe("Button", () => {
  it("should render with correct text", () => {
    render(<Button>Cliquer ici</Button>);
    expect(screen.getByText("Cliquer ici")).toBeInTheDocument();
  });

  it("should call onClick when clicked", () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Cliquer</Button>);

    fireEvent.click(screen.getByText("Cliquer"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### Tests d'intégration

Exemple de test d'intégration :

```tsx
import { render, screen, waitFor } from "@testing-library/react";
import { LoginForm } from "@/components/features/auth";

describe("LoginForm Integration", () => {
  it("should submit form with valid data", async () => {
    const mockSubmit = vi.fn();
    render(<LoginForm onSubmit={mockSubmit} />);

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Mot de passe"), {
      target: { value: "SecurePass123!" },
    });

    fireEvent.click(screen.getByText("Se connecter"));

    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "SecurePass123!",
      });
    });
  });
});
```

## Support

Pour toute question sur les composants :

- **Documentation technique** : `/docs/API.md`
- **Guide de style** : `/docs/STYLE_GUIDE.md`
- **Équipe frontend** : frontend@diaspomoney.com
