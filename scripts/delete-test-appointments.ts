import { connectDatabase } from "../config/database";
import Booking from "../models/Booking";

async function deleteTestAppointments() {
  try {
    await connectDatabase();

    const result = await Booking.deleteMany({
      "requester.email": "test@diaspomoney.com",
    });

    console.log(`✅ Supprimé ${result.deletedCount} rendez-vous de test`);
  } catch (error) {
    console.error(
      "❌ Erreur lors de la suppression des rendez-vous de test:",
      error
    );
  } finally {
    process.exit(0);
  }
}

deleteTestAppointments();
