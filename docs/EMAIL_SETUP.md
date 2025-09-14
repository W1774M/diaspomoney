# Configuration de l'envoi d'emails - DiaspoMoney

## Vue d'ensemble

Le système d'envoi d'emails de confirmation de réservation est maintenant intégré dans l'application DiaspoMoney. Lorsqu'un utilisateur confirme un paiement, un email de confirmation est automatiquement envoyé à `contact@diaspomoney.fr` et au client.

## Configuration actuelle

### Mode développement (simulation)

Actuellement, l'application utilise un mode simulation qui affiche les emails dans la console du serveur. Cela permet de tester la fonctionnalité sans configuration SMTP.

### Mode production (nodemailer)

Pour activer l'envoi réel d'emails, suivez ces étapes :

## Installation des dépendances

```bash
# Installer nodemailer et ses types
pnpm add nodemailer @types/nodemailer
```

## Configuration des variables d'environnement

Créez un fichier `.env.local` à la racine du projet avec les variables suivantes :

```env
# Configuration SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Autres variables
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

### Configuration Gmail

1. **Activer l'authentification à 2 facteurs** sur votre compte Gmail
2. **Générer un mot de passe d'application** :
   - Allez dans les paramètres de votre compte Google
   - Sécurité > Authentification à 2 facteurs
   - Mots de passe d'application
   - Générez un nouveau mot de passe pour "DiaspoMoney"
3. **Utilisez ce mot de passe** dans `SMTP_PASS`

### Configuration d'autres fournisseurs

#### Outlook/Hotmail

```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
```

#### Yahoo

```env
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
```

#### Serveur SMTP personnalisé

```env
SMTP_HOST=your-smtp-server.com
SMTP_PORT=587
SMTP_USER=your-username
SMTP_PASS=your-password
```

## Activation de l'envoi réel d'emails

Une fois les dépendances installées et la configuration SMTP en place, modifiez le fichier `app/api/send-confirmation/route.ts` :

1. **Décommentez les lignes nodemailer** (lignes 15-25)
2. **Remplacez la fonction `sendEmail`** par l'implémentation nodemailer
3. **Supprimez les commentaires de simulation**

```typescript
// Remplacer la fonction sendEmail par :
const nodemailer = require("nodemailer");
const transporter = nodemailer.createTransporter({
  host: config.smtp.host,
  port: config.smtp.port,
  secure: false,
  auth: {
    user: config.smtp.user,
    pass: config.smtp.pass,
  },
});

const sendEmail = async (to: string, subject: string, html: string) => {
  return await transporter.sendMail({
    from: config.smtp.user,
    to,
    subject,
    html,
  });
};
```

## Test de la fonctionnalité

1. **Démarrez l'application** : `pnpm dev`
2. **Allez sur une page de prestataire** : `/provider/[id]`
3. **Suivez le processus de réservation** jusqu'à la confirmation
4. **Vérifiez les emails** :
   - En mode simulation : regardez la console du serveur
   - En mode production : vérifiez les boîtes mail

## Structure de l'email

L'email de confirmation contient :

- **Numéro de réservation unique**
- **Détails du rendez-vous** (service, prestataire, date/heure, prix)
- **Informations du demandeur** (nom, téléphone, email)
- **Informations du bénéficiaire** (nom, téléphone)
- **Détails du paiement** (méthode, titulaire, montant)
- **Adresse du prestataire**
- **Informations importantes** (conditions, annulation, etc.)

## Sécurité

- Les mots de passe SMTP sont stockés dans les variables d'environnement
- L'API route valide toutes les données avant envoi
- Les emails sont envoyés en HTML avec un design professionnel
- Le numéro de réservation est unique et traçable

## Dépannage

### Erreur "Cannot find module 'nodemailer'"

```bash
pnpm add nodemailer @types/nodemailer
```

### Erreur d'authentification SMTP

- Vérifiez les identifiants SMTP
- Assurez-vous que l'authentification à 2 facteurs est activée (Gmail)
- Utilisez un mot de passe d'application, pas votre mot de passe principal

### Emails non reçus

- Vérifiez les logs du serveur
- Contrôlez les dossiers spam
- Testez avec une adresse email différente

## Support

Pour toute question ou problème, contactez l'équipe de développement ou consultez la documentation de nodemailer : https://nodemailer.com/
