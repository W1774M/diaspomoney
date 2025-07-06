import { connectDatabase } from "../config/database";
import { providers as staticProviders } from "../lib/datas/providers";
import Provider from "../models/Provider";

async function migrateProviders() {
  try {
    console.log("🔄 Connexion à la base de données...");
    await connectDatabase();

    console.log("🧹 Nettoyage de la collection providers...");
    await Provider.deleteMany({});

    console.log("📦 Migration des prestataires...");
    const providersToInsert = staticProviders.map((provider) => ({
      ...provider,
      // S'assurer que les services ont des IDs uniques
      services: provider.services.map((service, index) => ({
        id: (service as any).id || Math.floor(Math.random() * 10000) + 1,
        name: service.name,
        price: service.price,
      })),
    }));

    const result = await Provider.insertMany(providersToInsert);

    console.log(`✅ ${result.length} prestataires migrés avec succès !`);

    // Afficher quelques statistiques
    const totalProviders = await Provider.countDocuments();
    const recommendedProviders = await Provider.countDocuments({
      recommended: true,
    });
    const avgRating = await Provider.aggregate([
      { $group: { _id: null, avgRating: { $avg: "$rating" } } },
    ]);

    console.log("\n📊 Statistiques :");
    console.log(`- Total prestataires: ${totalProviders}`);
    console.log(`- Prestataires recommandés: ${recommendedProviders}`);
    console.log(
      `- Note moyenne: ${avgRating[0]?.avgRating?.toFixed(2) || "N/A"}`
    );

    process.exit(0);
  } catch (error) {
    console.error("❌ Erreur lors de la migration:", error);
    process.exit(1);
  }
}

// Exécuter la migration
migrateProviders();

export { migrateProviders };
