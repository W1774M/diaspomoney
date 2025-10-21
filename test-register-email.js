// Test d'inscription avec envoi d'email
const testData = {
  firstName: 'Test',
  lastName: 'Email',
  email: 'test-email@example.com',
  phone: '123456789',
  dateOfBirth: '1990-01-01',
  countryOfResidence: 'france',
  targetCountry: 'senegal',
  targetCity: 'dakar',
  monthlyBudget: '100-300',
  password: 'password123',
  confirmPassword: 'password123',
  securityQuestion: 'mother',
  securityAnswer: 'test',
  termsAccepted: true,
  marketingConsent: true,
  selectedServices: 'health,education',
};

async function testRegisterWithEmail() {
  try {
    console.log("🔄 Test d'inscription avec envoi d'email...");
    console.log('📤 Données envoyées:', JSON.stringify(testData, null, 2));

    const response = await fetch('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });

    const result = await response.json();

    console.log('📊 Status:', response.status);
    console.log('📥 Réponse:', JSON.stringify(result, null, 2));

    if (response.ok) {
      console.log('✅ Inscription réussie !');
      console.log('📧 Vérifiez votre boîte email pour le message de bienvenue');
    } else {
      console.log("❌ Erreur d'inscription");
    }
  } catch (error) {
    console.error('💥 Erreur:', error.message);
  }
}

// Attendre un peu que le serveur démarre
setTimeout(testRegisterWithEmail, 2000);
