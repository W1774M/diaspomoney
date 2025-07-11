import { connectDatabase } from "../config/database";
import Appointment from "../models/Appointment";

async function deleteTestAppointments() {
  try {
    await connectDatabase();

    const result = await Appointment.deleteMany({
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
