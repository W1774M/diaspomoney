# Diagnostic des problèmes de paiement Stripe

## 🔍 Problème : "Initialisation du paiement sécurisé" qui tourne indéfiniment

### Causes possibles

1. **Erreur d'authentification** (401)
   - L'utilisateur n'est pas connecté
   - La session a expiré

2. **Erreur de permissions** (403)
   - L'utilisateur n'a pas le rôle `CUSTOMER`

3. **Erreur de validation** (400)
   - Données manquantes ou invalides
   - Montant invalide (doit être > 0)

4. **Erreur Stripe** (500)
   - Clé secrète Stripe manquante ou invalide
   - Problème de connexion à Stripe

5. **Erreur réseau**
   - Timeout de connexion
   - CORS bloqué

## 🔧 Solutions

### 1. Vérifier les logs

Ouvrez la console du navigateur (F12) et regardez les logs :

```javascript
// Les logs devraient afficher :
// "Creating payment intent" avec les données
// "Payment intent created successfully" si succès
// Ou une erreur détaillée
```

### 2. Vérifier les logs serveur

Dans PowerShell :

```powershell
# Filtrer les logs de paiement
$env:LOG_FILE='true'; pnpm dev | Select-String -Pattern "(payment|stripe|create-intent)"
```

### 3. Vérifier l'authentification

Assurez-vous d'être connecté :
- Ouvrez la console du navigateur
- Vérifiez les cookies de session
- Vérifiez que vous avez le rôle `CUSTOMER`

### 4. Vérifier les variables d'environnement

```bash
# Côté client (dans .env.local)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Côté serveur (dans .env.local)
STRIPE_SECRET_KEY=sk_test_...
```

**Important** : Redémarrez le serveur après modification des variables d'environnement.

### 5. Tester l'API directement

Ouvrez la console du navigateur et testez :

```javascript
// Test de l'API
fetch('/api/payments/create-intent', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    amount: 1000, // 10€ en centimes
    currency: 'eur',
    email: 'test@example.com'
  })
})
.then(res => res.json())
.then(data => console.log('Success:', data))
.catch(err => console.error('Error:', err));
```

### 6. Vérifier la réponse de l'API

Si l'API retourne une erreur, elle devrait être affichée dans le composant. Les erreurs courantes :

- **401 Non authentifié** : Connectez-vous
- **403 Accès non autorisé** : Vérifiez votre rôle utilisateur
- **400 Erreur de validation** : Vérifiez les données envoyées
- **500 Erreur interne** : Vérifiez les logs serveur et la configuration Stripe

## 📋 Checklist de diagnostic

- [ ] L'utilisateur est connecté
- [ ] L'utilisateur a le rôle `CUSTOMER`
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` est défini dans `.env.local`
- [ ] `STRIPE_SECRET_KEY` est défini dans `.env.local`
- [ ] Le serveur a été redémarré après modification du `.env`
- [ ] Les clés Stripe sont valides (commencent par `pk_test_` et `sk_test_`)
- [ ] Le montant est > 0
- [ ] La console du navigateur ne montre pas d'erreurs
- [ ] Les logs serveur montrent la requête reçue

## 🐛 Messages d'erreur courants

### "Non authentifié"
**Solution** : Connectez-vous à l'application

### "Seuls les clients peuvent effectuer des paiements"
**Solution** : Vérifiez que votre compte a le rôle `CUSTOMER`

### "Amount must be positive"
**Solution** : Le montant doit être supérieur à 0

### "Invalid email format"
**Solution** : Fournissez un email valide (maintenant optionnel)

### "Le paiement prend trop de temps à s'initialiser"
**Solution** : 
- Vérifiez votre connexion internet
- Vérifiez les logs serveur pour voir si l'API répond
- Vérifiez que Stripe est accessible

### "Le serveur n'a pas retourné de clientSecret"
**Solution** : 
- Vérifiez que `STRIPE_SECRET_KEY` est correctement configuré
- Vérifiez les logs serveur pour voir l'erreur exacte
- Vérifiez que Stripe est accessible depuis votre serveur

## 📞 Support

Si le problème persiste :
1. Copiez les logs de la console du navigateur
2. Copiez les logs serveur
3. Vérifiez que toutes les variables d'environnement sont correctement configurées

