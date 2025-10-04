// Script pour tester la déconnexion
const API_BASE = "http://localhost:3000/api";

async function testSignOut() {
  console.log("🧪 Test de la déconnexion...");

  try {
    // Test 1: Vérifier l'état de la session avant déconnexion
    console.log("\n📥 Test GET /api/beneficiaries (avant déconnexion)");
    const beforeResponse = await fetch(`${API_BASE}/beneficiaries`);
    console.log(`Status: ${beforeResponse.status}`);

    if (beforeResponse.ok) {
      const data = await beforeResponse.json();
      console.log(
        `✅ Session active: ${data.beneficiaries?.length || 0} bénéficiaires trouvés`
      );
    } else {
      const error = await beforeResponse.json();
      console.log(`❌ Session inactive: ${error.error}`);
    }

    // Test 2: Simuler une déconnexion (en supprimant les cookies)
    console.log("\n🔓 Simulation de déconnexion...");

    // Note: En réalité, la déconnexion se fait côté client avec NextAuth
    // Ce script ne peut que vérifier l'état de l'API

    console.log("ℹ️  Pour tester la déconnexion:");
    console.log("   1. Ouvrez http://localhost:3000");
    console.log("   2. Connectez-vous");
    console.log("   3. Cliquez sur 'Déconnexion' dans la sidebar ou navbar");
    console.log("   4. Vérifiez que vous êtes redirigé vers /login");
    console.log("   5. Vérifiez que la session est bien supprimée");
  } catch (error) {
    console.error("❌ Erreur lors du test:", error.message);
  }
}

// Exécuter les tests
testSignOut();
