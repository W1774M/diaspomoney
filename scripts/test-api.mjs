// Script pour tester l'API des bénéficiaires
const API_BASE = "http://localhost:3000/api";

async function testAPI() {
  console.log("🧪 Test de l'API des bénéficiaires...");

  try {
    // Test GET
    console.log("\n📥 Test GET /api/beneficiaries");
    const getResponse = await fetch(`${API_BASE}/beneficiaries`);
    console.log(`Status: ${getResponse.status}`);

    if (getResponse.ok) {
      const data = await getResponse.json();
      console.log(
        `✅ ${data.beneficiaries?.length || 0} bénéficiaires trouvés`
      );
    } else {
      const error = await getResponse.json();
      console.log(`❌ Erreur: ${error.error}`);
    }

    // Test POST
    console.log("\n📤 Test POST /api/beneficiaries");
    const testBeneficiary = {
      name: "Test User",
      email: "test@example.com",
      phone: "+33 6 00 00 00 00",
      relationship: "Test",
    };

    const postResponse = await fetch(`${API_BASE}/beneficiaries`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(testBeneficiary),
    });

    console.log(`Status: ${postResponse.status}`);

    if (postResponse.ok) {
      const data = await postResponse.json();
      console.log(`✅ Bénéficiaire créé: ${data.beneficiary?.name}`);
    } else {
      const error = await postResponse.json();
      console.log(`❌ Erreur: ${error.error}`);
    }
  } catch (error) {
    console.error("❌ Erreur lors du test:", error.message);
  }
}

// Exécuter les tests
testAPI();
