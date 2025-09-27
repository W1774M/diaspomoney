import { getDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export interface UserFilters {
  role?: string | undefined;
  status?: string | undefined;
  limit?: number | undefined;
  offset?: number | undefined;
}

export class UserService {
  /**
   * Récupère tous les utilisateurs avec filtres optionnels
   */
  static async getUsers(filters: UserFilters = {}) {
    try {
      const db = await getDatabase();
      const collection = db.collection("users");

      // Construire la requête de filtrage
      const query: any = {};
      
      if (filters.role) {
        query.roles = { $in: [filters.role] };
      }
      
      if (filters.status) {
        query.status = filters.status;
      }

      // Exécuter la requête avec pagination
      const cursor = collection.find(query);
      
      if (filters.limit) {
        cursor.limit(filters.limit);
      }
      
      if (filters.offset) {
        cursor.skip(filters.offset);
      }

      const users = await cursor.toArray();
      const total = await collection.countDocuments(query);

      return {
        data: users,
        total,
        limit: filters.limit,
        offset: filters.offset || 0
      };
    } catch (error) {
      console.error("Erreur lors de la récupération des utilisateurs:", error);
      throw new Error("Erreur lors de la récupération des utilisateurs");
    }
  }

  /**
   * Récupère un utilisateur par son ID
   */
  static async getUserById(id: string) {
    try {
      const db = await getDatabase();
      const collection = db.collection("users");
      
      const user = await collection.findOne({ _id: new ObjectId(id) });
      
      if (!user) {
        throw new Error("Utilisateur non trouvé");
      }

      return user;
    } catch (error) {
      console.error("Erreur lors de la récupération de l'utilisateur:", error);
      throw new Error("Erreur lors de la récupération de l'utilisateur");
    }
  }

  /**
   * Récupère un utilisateur par son email
   */
  static async getUserByEmail(email: string) {
    try {
      const db = await getDatabase();
      const collection = db.collection("users");
      
      const user = await collection.findOne({ email });
      
      if (!user) {
        throw new Error("Utilisateur non trouvé");
      }

      return user;
    } catch (error) {
      console.error("Erreur lors de la récupération de l'utilisateur:", error);
      throw new Error("Erreur lors de la récupération de l'utilisateur");
    }
  }

  /**
   * Récupère les utilisateurs par rôle
   */
  static async getUsersByRole(role: string) {
    try {
      const db = await getDatabase();
      const collection = db.collection("users");
      
      const users = await collection.find({ roles: { $in: [role] } }).toArray();
      
      return users;
    } catch (error) {
      console.error("Erreur lors de la récupération des utilisateurs par rôle:", error);
      throw new Error("Erreur lors de la récupération des utilisateurs par rôle");
    }
  }

  /**
   * Met à jour un utilisateur
   */
  static async updateUser(id: string, updateData: any) {
    try {
      const db = await getDatabase();
      const collection = db.collection("users");
      
      const result = await collection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { ...updateData, updatedAt: new Date() } }
      );
      
      if (result.matchedCount === 0) {
        throw new Error("Utilisateur non trouvé");
      }

      return result;
    } catch (error) {
      console.error("Erreur lors de la mise à jour de l'utilisateur:", error);
      throw new Error("Erreur lors de la mise à jour de l'utilisateur");
    }
  }

  /**
   * Supprime un utilisateur
   */
  static async deleteUser(id: string) {
    try {
      const db = await getDatabase();
      const collection = db.collection("users");
      
      const result = await collection.deleteOne({ _id: new ObjectId(id) });
      
      if (result.deletedCount === 0) {
        throw new Error("Utilisateur non trouvé");
      }

      return result;
    } catch (error) {
      console.error("Erreur lors de la suppression de l'utilisateur:", error);
      throw new Error("Erreur lors de la suppression de l'utilisateur");
    }
  }
}
