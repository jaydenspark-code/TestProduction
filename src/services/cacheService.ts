// Implement Redis-like caching layer
class CacheService {
  private cache = new Map<string, { data: any; expiry: number }>();
  
  async get(key: string): Promise<any> {
    const item = this.cache.get(key);
    if (item && item.expiry > Date.now()) {
      return item.data;
    }
    this.cache.delete(key);
    return null;
  }
  
  async set(key: string, data: any, ttl: number = 300000): Promise<void> {
    this.cache.set(key, {
      data,
      expiry: Date.now() + ttl
    });
  }
}