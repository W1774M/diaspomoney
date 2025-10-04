// Script pour tester les données mock des services
import { MOCK_USERS } from "../mocks/index.js";

console.log("🧪 Test des données mock pour les services...");

// Filtrer les providers actifs
const activeProviders = MOCK_USERS.filter(
  user => user.roles.includes("PROVIDER") && user.status === "ACTIVE"
);

console.log(`\n📊 Statistiques des providers:`);
console.log(
  `   - Total providers: ${MOCK_USERS.filter(u => u.roles.includes("PROVIDER")).length}`
);
console.log(`   - Providers actifs: ${activeProviders.length}`);
console.log(
  `   - Providers inactifs: ${MOCK_USERS.filter(u => u.roles.includes("PROVIDER") && u.status !== "ACTIVE").length}`
);

// Afficher les détails des providers actifs
console.log(`\n👥 Providers actifs:`);
activeProviders.slice(0, 3).forEach((provider, index) => {
  console.log(`\n${index + 1}. ${provider.name}`);
  console.log(`   - Email: ${provider.email}`);
  console.log(`   - Spécialité: ${provider.specialty || "Non spécifiée"}`);
  console.log(`   - Entreprise: ${provider.company || "Non spécifiée"}`);
  console.log(`   - Services: ${provider.selectedServices || "Non spécifiés"}`);
  console.log(`   - Note: ${provider.rating || "Non noté"}`);
  console.log(`   - Adresse: ${provider.address || "Non spécifiée"}`);
  console.log(
    `   - Disponibilités: ${provider.availabilities?.join(", ") || "Non spécifiées"}`
  );
});

// Simuler les données pour les services à venir
console.log(`\n📅 Services à venir (simulation):`);
const upcomingServices = activeProviders.slice(0, 3).map((provider, index) => ({
  id: provider._id,
  title: provider.selectedServices || "Service professionnel",
  provider: provider.name,
  date: new Date(Date.now() + (index + 1) * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0],
  time: provider.availabilities?.[0]?.split("-")[0] || "09:00",
  location: provider.address || "En ligne",
  status: index === 0 ? "confirmed" : "pending",
  specialty: provider.specialty,
  company: provider.company,
}));

upcomingServices.forEach((service, index) => {
  console.log(`\n${index + 1}. ${service.title}`);
  console.log(`   - Provider: ${service.provider} (${service.company})`);
  console.log(`   - Date: ${service.date} à ${service.time}`);
  console.log(`   - Lieu: ${service.location}`);
  console.log(`   - Statut: ${service.status}`);
  console.log(`   - Spécialité: ${service.specialty}`);
});

// Simuler les données pour l'historique
console.log(`\n📚 Historique des services (simulation):`);
const historyServices = activeProviders.slice(0, 3).map((provider, index) => ({
  id: provider._id,
  title: provider.selectedServices || "Service professionnel",
  provider: provider.name,
  date: new Date(Date.now() - (index + 1) * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0],
  time: provider.availabilities?.[0]?.split("-")[0] || "14:30",
  location: provider.address || "En ligne",
  status: index === 2 ? "cancelled" : "completed",
  rating: index === 2 ? null : provider.rating || 4.5,
  specialty: provider.specialty,
  company: provider.company,
}));

historyServices.forEach((service, index) => {
  console.log(`\n${index + 1}. ${service.title}`);
  console.log(`   - Provider: ${service.provider} (${service.company})`);
  console.log(`   - Date: ${service.date} à ${service.time}`);
  console.log(`   - Lieu: ${service.location}`);
  console.log(`   - Statut: ${service.status}`);
  console.log(`   - Note: ${service.rating || "Non noté"}`);
  console.log(`   - Spécialité: ${service.specialty}`);
});

console.log(`\n✅ Test terminé avec succès!`);
console.log(`\n💡 Les données mock sont maintenant utilisées dans:`);
console.log(`   - /dashboard/services/upcoming`);
console.log(`   - /dashboard/services/tracking`);
console.log(`   - /dashboard/services/history`);
