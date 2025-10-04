// Cache en mémoire comme fallback si Redis n'est pas disponible
class MemoryCache {
  private cache: Map<string, { data: any; expiry: number }> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Nettoyer le cache toutes les 5 minutes
    this.cleanupInterval = setInterval(
      () => {
        this.cleanup();
      },
      5 * 60 * 1000
    );
  }

  async set(key: string, value: any, ttl: number = 3600): Promise<void> {
    const expiry = Date.now() + ttl * 1000;
    this.cache.set(key, { data: value, expiry });
  }

  async get(key: string): Promise<any> {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  async del(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async keys(pattern: string): Promise<string[]> {
    const regex = new RegExp(pattern.replace(/\*/g, ".*"));
    return Array.from(this.cache.keys()).filter(key => regex.test(key));
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.cache.delete(key);
      }
    }
  }

  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.cache.clear();
  }
}

export const memoryCache = new MemoryCache();
