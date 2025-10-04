// Script simple pour ajouter des données de test via l'API
const fetch = require("node-fetch");

const API_BASE = "http://localhost:3000/api";

// Données de test pour les bénéficiaires
const sampleBeneficiaries = [
  {
    name: "Sophie Durand",
    email: "sophie.durand@email.com",
    phone: "+33 6 12 34 56 78",
    relationship: "Épouse",
  },
  {
    name: "Pierre Martin",
    email: "pierre.martin@email.com",
    phone: "+33 6 87 65 43 21",
    relationship: "Fils",
  },
  {
    name: "Claire Dubois",
    email: null,
    phone: "+33 6 98 76 54 32",
    relationship: "Mère",
  },
  {
    name: "Jean Dupont",
    email: "jean.dupont@email.com",
    phone: "+33 6 11 22 33 44",
    relationship: "Père",
  },
  {
    name: "Marie Leroy",
    email: null,
    phone: "+33 6 55 66 77 88",
    relationship: "Sœur",
  },
];

async function seedBeneficiaries() {
  console.log("🌱 Début du seeding des bénéficiaires...");

  try {
    // Vérifier si l'API est accessible
    const response = await fetch(`${API_BASE}/beneficiaries`);

    if (!response.ok) {
      console.log(
        "❌ API non accessible. Assurez-vous que le serveur Next.js est démarré."
      );
      console.log("   Commande: npm run dev");
      return;
    }

    console.log("✅ API accessible, seeding en cours...");

    // Ajouter chaque bénéficiaire
    for (const beneficiary of sampleBeneficiaries) {
      try {
        const response = await fetch(`${API_BASE}/beneficiaries`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(beneficiary),
        });

        if (response.ok) {
          const result = await response.json();
          console.log(`✅ Bénéficiaire créé: ${beneficiary.name}`);
        } else {
          const error = await response.json();
          console.log(`⚠️  Erreur pour ${beneficiary.name}: ${error.error}`);
        }
      } catch (error) {
        console.log(
          `❌ Erreur lors de la création de ${beneficiary.name}:`,
          error.message
        );
      }
    }

    console.log("🎉 Seeding terminé!");
  } catch (error) {
    console.error("❌ Erreur générale:", error.message);
  }
}

// Exécuter le seeding
seedBeneficiaries();
