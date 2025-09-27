import { getDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export interface AppointmentFilters {
  userId?: string | undefined;
  providerId?: string | undefined;
  status?: string | undefined;
  dateFrom?: Date | undefined;
  dateTo?: Date | undefined;
  limit?: number | undefined;
  offset?: number | undefined;
}

export class AppointmentService {
  /**
   * Récupère tous les rendez-vous avec filtres optionnels
   */
  static async getAppointments(filters: AppointmentFilters = {}) {
    try {
      const db = await getDatabase();
      const collection = db.collection("appointments");

      // Construire la requête de filtrage
      const query: any = {};
      
      if (filters.userId) {
        query.userId = new ObjectId(filters.userId);
      }
      
      if (filters.providerId) {
        query.providerId = new ObjectId(filters.providerId);
      }
      
      if (filters.status) {
        query.status = filters.status;
      }
      
      if (filters.dateFrom || filters.dateTo) {
        query.date = {};
        if (filters.dateFrom) {
          query.date.$gte = filters.dateFrom;
        }
        if (filters.dateTo) {
          query.date.$lte = filters.dateTo;
        }
      }

      // Exécuter la requête avec pagination
      const cursor = collection.find(query).sort({ date: -1 });
      
      if (filters.limit) {
        cursor.limit(filters.limit);
      }
      
      if (filters.offset) {
        cursor.skip(filters.offset);
      }

      const appointments = await cursor.toArray();
      const total = await collection.countDocuments(query);

      return {
        data: appointments,
        total,
        limit: filters.limit,
        offset: filters.offset || 0
      };
    } catch (error) {
      console.error("Erreur lors de la récupération des rendez-vous:", error);
      throw new Error("Erreur lors de la récupération des rendez-vous");
    }
  }

  /**
   * Récupère un rendez-vous par son ID
   */
  static async getAppointmentById(id: string) {
    try {
      const db = await getDatabase();
      const collection = db.collection("appointments");
      
      const appointment = await collection.findOne({ _id: new ObjectId(id) });
      
      if (!appointment) {
        throw new Error("Rendez-vous non trouvé");
      }

      return appointment;
    } catch (error) {
      console.error("Erreur lors de la récupération du rendez-vous:", error);
      throw new Error("Erreur lors de la récupération du rendez-vous");
    }
  }

  /**
   * Crée un nouveau rendez-vous
   */
  static async createAppointment(appointmentData: any) {
    try {
      const db = await getDatabase();
      const collection = db.collection("appointments");
      
      // Générer un numéro de réservation unique
      const reservationNumber = `APT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      
      const newAppointment = {
        ...appointmentData,
        reservationNumber,
        status: "pending",
        paymentStatus: "pending",
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const result = await collection.insertOne(newAppointment);
      
      return {
        _id: result.insertedId,
        ...newAppointment
      };
    } catch (error) {
      console.error("Erreur lors de la création du rendez-vous:", error);
      throw new Error("Erreur lors de la création du rendez-vous");
    }
  }

  /**
   * Met à jour un rendez-vous
   */
  static async updateAppointment(id: string, updateData: any) {
    try {
      const db = await getDatabase();
      const collection = db.collection("appointments");
      
      const result = await collection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { ...updateData, updatedAt: new Date() } }
      );
      
      if (result.matchedCount === 0) {
        throw new Error("Rendez-vous non trouvé");
      }

      return result;
    } catch (error) {
      console.error("Erreur lors de la mise à jour du rendez-vous:", error);
      throw new Error("Erreur lors de la mise à jour du rendez-vous");
    }
  }

  /**
   * Supprime un rendez-vous
   */
  static async deleteAppointment(id: string) {
    try {
      const db = await getDatabase();
      const collection = db.collection("appointments");
      
      const result = await collection.deleteOne({ _id: new ObjectId(id) });
      
      if (result.deletedCount === 0) {
        throw new Error("Rendez-vous non trouvé");
      }

      return result;
    } catch (error) {
      console.error("Erreur lors de la suppression du rendez-vous:", error);
      throw new Error("Erreur lors de la suppression du rendez-vous");
    }
  }

  /**
   * Récupère les statistiques des rendez-vous
   */
  static async getAppointmentStats() {
    try {
      const db = await getDatabase();
      const collection = db.collection("appointments");
      
      const stats = await collection.aggregate([
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 }
          }
        }
      ]).toArray();
      
      return stats;
    } catch (error) {
      console.error("Erreur lors de la récupération des statistiques:", error);
      throw new Error("Erreur lors de la récupération des statistiques");
    }
  }
}
