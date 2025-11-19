import { cache } from "../cache/redis";
import { mongoClient } from "./mongodb";

export class QueryOptimizer {
  // Requêtes avec projection pour réduire la bande passante
  static async getUsersList(filters: any = {}) {
    const cacheKey = `list:${JSON.stringify(filters)}`;

    // Vérifier le cache d'abord
    const cached = await cache.users.get(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const client = await mongoClient;
      if (!client) {
        throw new Error("MongoDB client is not initialized.");
      }
      const db = client.db();

      const users = await db
        .collection("users")
        .find(
          { status: "ACTIVE", ...filters },
          {
            projection: {
              _id: 1,
              name: 1,
              email: 1,
              avatar: 1,
              roles: 1,
              status: 1,
              createdAt: 1,
            },
          },
        )
        .sort({ createdAt: -1 })
        .toArray();

      // Mettre en cache pour 5 minutes
      await cache.users.set(cacheKey, users, 300);

      return users;
    } catch (error) {
      console.error("QueryOptimizer getUsersList error:", error);
      throw error;
    }
  }

  // Aggregation pipelines pour les statistiques
  static async getDashboardStats(userId: string) {
    const cacheKey = `dashboard:${userId}`;

    // Vérifier le cache d'abord
    const cached = await cache.stats.get(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const client = await mongoClient;
      if (!client) {
        throw new Error("MongoDB client is not initialized.");
      }
      const db = client.db();

      const stats = await db
        .collection("appointments")
        .aggregate([
          { $match: { userId } },
          {
            $group: {
              _id: "$status",
              count: { $sum: 1 },
              totalAmount: { $sum: "$totalAmount" },
            },
          },
          {
            $group: {
              _id: null,
              totalAppointments: { $sum: "$count" },
              totalRevenue: { $sum: "$totalAmount" },
              statusBreakdown: {
                $push: {
                  status: "$_id",
                  count: "$count",
                  amount: "$totalAmount",
                },
              },
            },
          },
        ])
        .toArray();

      const result = stats[0] || {
        totalAppointments: 0,
        totalRevenue: 0,
        statusBreakdown: [],
      };

      // Mettre en cache pour 30 minutes
      await cache.stats.set(cacheKey, result, 1800);

      return result;
    } catch (error) {
      console.error("QueryOptimizer getDashboardStats error:", error);
      throw error;
    }
  }

  // Services avec cache et pagination
  static async getServicesList(
    filters: any = {},
    page: number = 1,
    limit: number = 20,
  ) {
    const cacheKey = `list:${JSON.stringify(filters)}:${page}:${limit}`;

    // Vérifier le cache d'abord
    const cached = await cache.services.get(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const client = await mongoClient;
      if (!client) {
        throw new Error("MongoDB client is not initialized.");
      }
      const db = client.db();

      const skip = (page - 1) * limit;

      const [services, total] = await Promise.all([
        db
          .collection("users")
          .find(
            {
              status: "ACTIVE",
              roles: { $in: ["PROVIDER"] },
              ...filters,
            },
            {
              projection: {
                _id: 1,
                name: 1,
                email: 1,
                specialty: 1,
                company: 1,
                address: 1,
                selectedServices: 1,
                availabilities: 1,
                rating: 1,
                avatar: 1,
              },
            },
          )
          .skip(skip)
          .limit(limit)
          .toArray(),

        db.collection("users").countDocuments({
          status: "ACTIVE",
          roles: { $in: ["PROVIDER"] },
          ...filters,
        }),
      ]);

      const result = {
        services,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };

      // Mettre en cache pour 1 heure
      await cache.services.set(cacheKey, result, 3600);

      return result;
    } catch (error) {
      console.error("QueryOptimizer getServicesList error:", error);
      throw error;
    }
  }

  // Rendez-vous avec cache
  static async getAppointmentsList(userId: string, filters: any = {}) {
    const cacheKey = `list:${userId}:${JSON.stringify(filters)}`;

    // Vérifier le cache d'abord
    const cached = await cache.appointments.get(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const client = await mongoClient;
      if (!client) {
        throw new Error("MongoDB client is not initialized.");
      }
      const db = client.db();

      const appointments = await db
        .collection("appointments")
        .find(
          { userId, ...filters },
          {
            projection: {
              _id: 1,
              reservationNumber: 1,
              date: 1,
              status: 1,
              paymentStatus: 1,
              totalAmount: 1,
              provider: 1,
              requester: 1,
            },
          },
        )
        .sort({ date: -1 })
        .toArray();

      // Mettre en cache pour 15 minutes
      await cache.appointments.set(cacheKey, appointments, 900);

      return appointments;
    } catch (error) {
      console.error("QueryOptimizer getAppointmentsList error:", error);
      throw error;
    }
  }

  // Invalider le cache pour un utilisateur
  static async invalidateUserCache(userId: string) {
    try {
      await Promise.all([
        cache.users.del(`users:${userId}`),
        cache.stats.del(`stats:${userId}`),
        cache.appointments.del(`appointments:${userId}`),
      ]);
    } catch (error) {
      console.error("QueryOptimizer invalidateUserCache error:", error);
    }
  }

  // Invalider le cache des services
  static async invalidateServicesCache() {
    try {
      await cache.services.del("services:*");
    } catch (error) {
      console.error("QueryOptimizer invalidateServicesCache error:", error);
    }
  }
}
