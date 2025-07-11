import { connectDatabase } from "../config/database";
import Appointment from "../models/Appointment";

async function createTestAppointments() {
  try {
    await connectDatabase();

    // Vérifier si des rendez-vous de test existent déjà
    const existingAppointments = await Appointment.find({
      "requester.email": "test@diaspomoney.com",
    });

    if (existingAppointments.length > 0) {
      console.log(
        `${existingAppointments.length} rendez-vous de test existent déjà`
      );
      return;
    }

    // Créer des rendez-vous de test
    const testAppointments = [
      {
        reservationNumber: "RES-2024-001",
        requester: {
          firstName: "Test",
          lastName: "User",
          phone: "0123456789",
          email: "test@diaspomoney.com",
        },
        recipient: {
          firstName: "Marie",
          lastName: "Martin",
          phone: "0987654321",
        },
        provider: {
          id: 1,
          name: "Cabinet Médical Saint-Jean",
          services: [
            { id: 1, name: "Consultation générale", price: 25 },
            { id: 2, name: "Vaccination", price: 15 },
          ],
          type: { id: 1, value: "Médecin", group: "Santé" },
          specialty: "Médecine générale",
          recommended: true,
          apiGeo: [
            {
              place_id: 123456,
              licence: "test",
              osm_type: "way",
              osm_id: 123456,
              lat: "48.8566",
              lon: "2.3522",
              class: "amenity",
              type: "clinic",
              place_rank: 30,
              importance: 0.5,
              addresstype: "amenity",
              name: "Cabinet Médical Saint-Jean",
              display_name:
                "Cabinet Médical Saint-Jean, Rue de la Paix, Paris, France",
              boundingbox: ["48.8566", "48.8567", "2.3522", "2.3523"],
            },
          ],
          images: ["/img/doctor1.jpg"],
          rating: 4.8,
          reviews: 127,
        },
        selectedService: {
          id: 1,
          name: "Consultation générale",
          price: 25,
        },
        timeslot: "2024-01-15T10:00:00.000Z",
        status: "confirmed",
        paymentStatus: "paid",
        totalAmount: 25,
      },
      {
        reservationNumber: "RES-2024-002",
        requester: {
          firstName: "Test",
          lastName: "User",
          phone: "0123456789",
          email: "test@diaspomoney.com",
        },
        recipient: {
          firstName: "Jean",
          lastName: "Dupont",
          phone: "0123456789",
        },
        provider: {
          id: 2,
          name: "Institut de Beauté Élégance",
          services: [
            { id: 1, name: "Soin du visage", price: 45 },
            { id: 2, name: "Manucure", price: 25 },
          ],
          type: { id: 2, value: "Beauté", group: "Esthétique" },
          specialty: "Soins esthétiques",
          recommended: false,
          apiGeo: [
            {
              place_id: 789012,
              licence: "test",
              osm_type: "way",
              osm_id: 789012,
              lat: "48.8600",
              lon: "2.3500",
              class: "amenity",
              type: "beauty",
              place_rank: 30,
              importance: 0.4,
              addresstype: "amenity",
              name: "Institut de Beauté Élégance",
              display_name:
                "Institut de Beauté Élégance, Avenue des Champs-Élysées, Paris, France",
              boundingbox: ["48.8600", "48.8601", "2.3500", "2.3501"],
            },
          ],
          images: ["/img/beauty1.jpg"],
          rating: 4.5,
          reviews: 89,
        },
        selectedService: {
          id: 1,
          name: "Soin du visage",
          price: 45,
        },
        timeslot: "2024-01-20T14:30:00.000Z",
        status: "pending",
        paymentStatus: "pending",
        totalAmount: 45,
      },
      {
        reservationNumber: "RES-2024-003",
        requester: {
          firstName: "Test",
          lastName: "User",
          phone: "0123456789",
          email: "test@diaspomoney.com",
        },
        recipient: {
          firstName: "Sophie",
          lastName: "Bernard",
          phone: "0123456789",
        },
        provider: {
          id: 3,
          name: "Restaurant Le Gourmet",
          services: [
            { id: 1, name: "Dîner pour 2", price: 80 },
            { id: 2, name: "Déjeuner d'affaires", price: 35 },
          ],
          type: { id: 3, value: "Restaurant", group: "Gastronomie" },
          specialty: "Cuisine française",
          recommended: true,
          apiGeo: [
            {
              place_id: 345678,
              licence: "test",
              osm_type: "way",
              osm_id: 345678,
              lat: "48.8700",
              lon: "2.3400",
              class: "amenity",
              type: "restaurant",
              place_rank: 30,
              importance: 0.6,
              addresstype: "amenity",
              name: "Restaurant Le Gourmet",
              display_name:
                "Restaurant Le Gourmet, Rue du Faubourg Saint-Honoré, Paris, France",
              boundingbox: ["48.8700", "48.8701", "2.3400", "2.3401"],
            },
          ],
          images: ["/img/restaurant1.jpg"],
          rating: 4.9,
          reviews: 234,
        },
        selectedService: {
          id: 1,
          name: "Dîner pour 2",
          price: 80,
        },
        timeslot: "2024-01-25T19:00:00.000Z",
        status: "completed",
        paymentStatus: "paid",
        totalAmount: 80,
      },
    ];

    for (const appointmentData of testAppointments) {
      const appointment = new Appointment(appointmentData);
      await appointment.save();
      console.log(`Rendez-vous créé: ${appointment.reservationNumber}`);
    }

    console.log("✅ Tous les rendez-vous de test ont été créés avec succès !");
    console.log("📧 Email de test: test@diaspomoney.com");
    console.log(
      "🔗 Accédez à la page: http://localhost:3001/dashboard/appointments"
    );
  } catch (error) {
    console.error(
      "❌ Erreur lors de la création des rendez-vous de test:",
      error
    );
  } finally {
    process.exit(0);
  }
}

createTestAppointments();
