import { ObjectId } from "mongodb";
import { mongoClient } from "../lib/mongodb";

interface Beneficiary {
  _id?: ObjectId;
  userId: ObjectId;
  name: string;
  email?: string;
  phone?: string;
  relationship: string;
  hasAccount: boolean;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

interface User {
  _id: ObjectId;
  email: string;
  name?: string;
  firstName?: string;
  lastName?: string;
}

async function migrateBeneficiaries() {
  try {
    console.log("🚀 Début de la migration des bénéficiaires...");

    const client = await mongoClient;
    const db = client.db();

    // Vérifier si la collection beneficiaries existe
    const collections = await db.listCollections().toArray();
    const beneficiariesExists = collections.some(
      col => col.name === "beneficiaries"
    );

    if (!beneficiariesExists) {
      console.log("📝 Création de la collection beneficiaries...");
      await db.createCollection("beneficiaries");
    }

    // Créer des index pour optimiser les performances
    console.log("📊 Création des index...");
    await db.collection("beneficiaries").createIndex({ userId: 1 });
    await db.collection("beneficiaries").createIndex({ email: 1 });
    await db.collection("beneficiaries").createIndex({ createdAt: -1 });
    await db
      .collection("beneficiaries")
      .createIndex({ userId: 1, email: 1 }, { unique: true, sparse: true });

    // Récupérer tous les utilisateurs pour créer des bénéficiaires de test
    const users = await db.collection("users").find({}).limit(5).toArray();

    if (users.length === 0) {
      console.log(
        "⚠️  Aucun utilisateur trouvé. Création d'utilisateurs de test..."
      );

      const testUsers: User[] = [
        {
          _id: new ObjectId(),
          email: "test1@example.com",
          name: "Jean Dupont",
          firstName: "Jean",
          lastName: "Dupont",
        },
        {
          _id: new ObjectId(),
          email: "test2@example.com",
          name: "Marie Martin",
          firstName: "Marie",
          lastName: "Martin",
        },
      ];

      await db.collection("users").insertMany(testUsers);
      console.log("✅ Utilisateurs de test créés");
    }

    // Créer des bénéficiaires de test pour chaque utilisateur
    const allUsers = await db.collection("users").find({}).toArray();

    for (const user of allUsers) {
      // Vérifier si l'utilisateur a déjà des bénéficiaires
      const existingBeneficiaries = await db
        .collection("beneficiaries")
        .countDocuments({ userId: user._id });

      if (existingBeneficiaries === 0) {
        console.log(`👤 Création de bénéficiaires pour ${user["email"]}...`);

        const sampleBeneficiaries: Omit<Beneficiary, "_id">[] = [
          {
            userId: user._id,
            name: "Sophie Durand",
            email: "sophie.durand@email.com",
            phone: "+33 6 12 34 56 78",
            relationship: "Épouse",
            hasAccount: true,
            status: "active",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            userId: user._id,
            name: "Pierre Martin",
            email: "pierre.martin@email.com",
            phone: "+33 6 87 65 43 21",
            relationship: "Fils",
            hasAccount: true,
            status: "active",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            userId: user._id,
            name: "Claire Dubois",
            email: "",
            phone: "+33 6 98 76 54 32",
            relationship: "Mère",
            hasAccount: false,
            status: "active",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ];

        await db.collection("beneficiaries").insertMany(sampleBeneficiaries);
        console.log(
          `✅ ${sampleBeneficiaries.length} bénéficiaires créés pour ${user["email"]}`
        );
      } else {
        console.log(
          `ℹ️  ${user["email"]} a déjà ${existingBeneficiaries} bénéficiaires`
        );
      }
    }

    // Statistiques finales
    const totalBeneficiaries = await db
      .collection("beneficiaries")
      .countDocuments();
    const totalUsers = await db.collection("users").countDocuments();

    console.log("📊 Statistiques finales:");
    console.log(`   - Utilisateurs: ${totalUsers}`);
    console.log(`   - Bénéficiaires: ${totalBeneficiaries}`);

    console.log("✅ Migration terminée avec succès!");
  } catch (error) {
    console.error("❌ Erreur lors de la migration:", error);
    throw error;
  }
}

// Exécuter la migration si le script est appelé directement
if (require.main === module) {
  migrateBeneficiaries()
    .then(() => {
      console.log("🎉 Migration complète!");
      process.exit(0);
    })
    .catch(error => {
      console.error("💥 Échec de la migration:", error);
      process.exit(1);
    });
}

export { migrateBeneficiaries };
