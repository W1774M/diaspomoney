import { connectDatabase } from "../config/database";
import User from "../models/User";

async function createTestUser() {
  try {
    await connectDatabase();

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({ email: "test@diaspomoney.com" });

    if (existingUser) {
      console.log("Utilisateur de test existe déjà:", existingUser.email);
      return;
    }

    // Créer un nouvel utilisateur de test
    const testUser = new User({
      firstName: "Test",
      lastName: "User",
      email: "test@diaspomoney.com",
      password: "Test123!",
      phone: "0123456789",
      role: "user",
      isEmailVerified: true,
    });

    await testUser.save();
    console.log("Utilisateur de test créé avec succès:", testUser.email);
    console.log("Email: test@diaspomoney.com");
    console.log("Mot de passe: Test123!");
  } catch (error) {
    console.error(
      "Erreur lors de la création de l'utilisateur de test:",
      error
    );
  } finally {
    process.exit(0);
  }
}

createTestUser();
