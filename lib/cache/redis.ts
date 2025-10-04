import Redis from "ioredis";

// Configuration Redis
const redis = new Redis({
  host: process.env["REDIS_HOST"] || "localhost",
  port: parseInt(process.env["REDIS_PORT"] || "6379"),
  password: process.env["REDIS_PASSWORD"] ?? "",
  maxRetriesPerRequest: 3,
  lazyConnect: true,
});

// Gestion des erreurs Redis
redis.on("error", err => {
  console.error("Redis connection error:", err);
});

redis.on("connect", () => {
  console.log("Redis connected successfully");
});

// Cache helper functions
export const cache = {
  // Cache des utilisateurs (5 minutes)
  users: {
    set: async (key: string, data: any, ttl: number = 300) => {
      try {
        await redis.setex(`users:${key}`, ttl, JSON.stringify(data));
      } catch (error) {
        console.error("Cache users set error:", error);
      }
    },

    get: async (key: string) => {
      try {
        const data = await redis.get(`users:${key}`);
        return data ? JSON.parse(data) : null;
      } catch (error) {
        console.error("Cache users get error:", error);
        return null;
      }
    },

    del: async (key: string) => {
      try {
        await redis.del(`users:${key}`);
      } catch (error) {
        console.error("Cache users del error:", error);
      }
    },
  },

  // Cache des services (1 heure)
  services: {
    set: async (key: string, data: any, ttl: number = 3600) => {
      try {
        await redis.setex(`services:${key}`, ttl, JSON.stringify(data));
      } catch (error) {
        console.error("Cache services set error:", error);
      }
    },

    get: async (key: string) => {
      try {
        const data = await redis.get(`services:${key}`);
        return data ? JSON.parse(data) : null;
      } catch (error) {
        console.error("Cache services get error:", error);
        return null;
      }
    },

    del: async (key: string) => {
      try {
        await redis.del(`services:${key}`);
      } catch (error) {
        console.error("Cache services del error:", error);
      }
    },
  },

  // Cache des statistiques (30 minutes)
  stats: {
    set: async (key: string, data: any, ttl: number = 1800) => {
      try {
        await redis.setex(`stats:${key}`, ttl, JSON.stringify(data));
      } catch (error) {
        console.error("Cache stats set error:", error);
      }
    },

    get: async (key: string) => {
      try {
        const data = await redis.get(`stats:${key}`);
        return data ? JSON.parse(data) : null;
      } catch (error) {
        console.error("Cache stats get error:", error);
        return null;
      }
    },

    del: async (key: string) => {
      try {
        await redis.del(`stats:${key}`);
      } catch (error) {
        console.error("Cache stats del error:", error);
      }
    },
  },

  // Cache des rendez-vous (15 minutes)
  appointments: {
    set: async (key: string, data: any, ttl: number = 900) => {
      try {
        await redis.setex(`appointments:${key}`, ttl, JSON.stringify(data));
      } catch (error) {
        console.error("Cache appointments set error:", error);
      }
    },

    get: async (key: string) => {
      try {
        const data = await redis.get(`appointments:${key}`);
        return data ? JSON.parse(data) : null;
      } catch (error) {
        console.error("Cache appointments get error:", error);
        return null;
      }
    },

    del: async (key: string) => {
      try {
        await redis.del(`appointments:${key}`);
      } catch (error) {
        console.error("Cache appointments del error:", error);
      }
    },
  },

  // Cache générique
  set: async (key: string, data: any, ttl: number = 3600) => {
    try {
      await redis.setex(key, ttl, JSON.stringify(data));
    } catch (error) {
      console.error("Cache set error:", error);
    }
  },

  get: async (key: string) => {
    try {
      const data = await redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error("Cache get error:", error);
      return null;
    }
  },

  del: async (key: string) => {
    try {
      await redis.del(key);
    } catch (error) {
      console.error("Cache del error:", error);
    }
  },

  // Nettoyage du cache
  clear: async (pattern: string = "*") => {
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (error) {
      console.error("Cache clear error:", error);
    }
  },
};

export default redis;
