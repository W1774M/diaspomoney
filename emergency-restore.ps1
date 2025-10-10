# Script d'urgence pour restaurer la base de données
Write-Host "🚨 RESTAURATION D'URGENCE - DiaspoMoney" -ForegroundColor Red

# Vérifier MongoDB
Write-Host "🔗 Vérification de MongoDB..." -ForegroundColor Yellow
try {
    $result = docker exec mongodb mongosh --username admin --password admin123 --authenticationDatabase admin --eval "db.adminCommand('ping')" 2>$null
    if ($LASTEXITCODE -ne 0) {
        throw "MongoDB non accessible"
    }
    Write-Host "✅ MongoDB est accessible" -ForegroundColor Green
} catch {
    Write-Host "❌ MongoDB n'est pas accessible" -ForegroundColor Red
    exit 1
}

# Créer la base de données
Write-Host "🗄️  Création de la base de données diaspomoney..." -ForegroundColor Yellow
docker exec mongodb mongosh --username admin --password admin123 --authenticationDatabase admin --eval "use diaspomoney; db.createCollection('users')" --quiet

# Insérer des données de base
Write-Host "📊 Insertion des données de base..." -ForegroundColor Yellow

# Utilisateurs de base
$users = @(
    @{
        _id = "user1"
        email = "admin@diaspomoney.fr"
        name = "Administrateur"
        role = "admin"
        createdAt = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
    },
    @{
        _id = "user2"
        email = "test@diaspomoney.fr"
        name = "Utilisateur Test"
        role = "user"
        createdAt = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
    }
)

foreach ($user in $users) {
    $json = $user | ConvertTo-Json -Compress
    docker exec mongodb mongosh --username admin --password admin123 --authenticationDatabase admin --eval "use diaspomoney; db.users.insertOne($json)" --quiet
}

# Spécialités de base
$specialities = @(
    @{ _id = "spec1"; name = "Médecine Générale"; description = "Soins médicaux généraux" },
    @{ _id = "spec2"; name = "Cardiologie"; description = "Spécialité cardiaque" },
    @{ _id = "spec3"; name = "Dermatologie"; description = "Spécialité de la peau" }
)

foreach ($spec in $specialities) {
    $json = $spec | ConvertTo-Json -Compress
    docker exec mongodb mongosh --username admin --password admin123 --authenticationDatabase admin --eval "use diaspomoney; db.specialities.insertOne($json)" --quiet
}

# Partenaires de base
$partners = @(
    @{ _id = "partner1"; name = "Hôpital Central"; address = "123 Rue de la Santé"; city = "Paris" },
    @{ _id = "partner2"; name = "Clinique Privée"; address = "456 Avenue des Soins"; city = "Lyon" }
)

foreach ($partner in $partners) {
    $json = $partner | ConvertTo-Json -Compress
    docker exec mongodb mongosh --username admin --password admin123 --authenticationDatabase admin --eval "use diaspomoney; db.partners.insertOne($json)" --quiet
}

Write-Host "✅ Base de données restaurée avec des données de base" -ForegroundColor Green
Write-Host "📊 Vérification des collections..." -ForegroundColor Yellow

# Vérifier les collections
$collections = docker exec mongodb mongosh --username admin --password admin123 --authenticationDatabase admin --eval "use diaspomoney; db.getCollectionNames()" --quiet
Write-Host "Collections disponibles: $collections" -ForegroundColor Cyan

Write-Host "🎉 Restauration d'urgence terminée !" -ForegroundColor Green
Write-Host "⚠️  Vous devrez peut-être recréer vos données spécifiques" -ForegroundColor Yellow
