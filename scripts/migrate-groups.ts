import { connectDatabase } from "@/config/database";
import Provider from "@/models/Provider";

async function migrateGroups() {
  try {
    await connectDatabase();
    console.log("🔗 MongoDB connecté");

    // Mapping des types vers les groupes
    const typeToGroupMapping: { [key: number]: string } = {
      1: "sante", // Clinique
      2: "sante", // Centre médical
      3: "sante", // Médecin
      4: "sante", // Hôpital
      5: "edu", // École
      6: "edu", // Université
      7: "edu", // Formation
      8: "immo", // Construction
      9: "immo", // Immobilier
      10: "immo", // Rénovation
    };

    // Récupérer tous les prestataires
    const providers = await Provider.find({});
    console.log(`📦 Migration de ${providers.length} prestataires...`);

    let updatedCount = 0;

    for (const provider of providers) {
      const typeId = provider.type.id;
      const group = typeToGroupMapping[typeId as number];

      if (group) {
        // Mettre à jour le type avec le groupe
        provider.type.group = group;
        await provider.save();
        updatedCount++;
        console.log(`✅ ${provider.name} (ID: ${typeId}) → groupe: ${group}`);
      } else {
        console.log(`⚠️  Type non mappé pour ${provider.name} (ID: ${typeId})`);
      }
    }

    console.log(`\n✅ Migration terminée !`);
    console.log(`📊 ${updatedCount} prestataires mis à jour`);

    // Vérification
    const santeCount = await Provider.countDocuments({ "type.group": "sante" });
    const eduCount = await Provider.countDocuments({ "type.group": "edu" });
    const immoCount = await Provider.countDocuments({ "type.group": "immo" });

    console.log(`\n📊 Statistiques par groupe:`);
    console.log(`- Santé: ${santeCount} prestataires`);
    console.log(`- Éducation: ${eduCount} prestataires`);
    console.log(`- Immobilier: ${immoCount} prestataires`);
  } catch (error) {
    console.error("❌ Erreur lors de la migration:", error);
  } finally {
    process.exit(0);
  }
}

// Exécuter la migration
migrateGroups();
