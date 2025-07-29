class RateLimiter {
  private requests = new Map<string, number[]>();
  
  isAllowed(userId: string, endpoint: string, limit: number, window: number): boolean {
    const key = `${userId}:${endpoint}`;
    const now = Date.now();
    const requests = this.requests.get(key) || [];
    
    // Remove old requests outside the window
    const validRequests = requests.filter(time => now - time < window);
    
    if (validRequests.length >= limit) {
      return false;
    }
    
    validRequests.push(now);
    this.requests.set(key, validRequests);
    return true;
  }
}