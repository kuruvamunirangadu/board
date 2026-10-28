interface RateLimitRecord {
  count: number;
  resetTime: number;
}

export class MemoryRateLimiter {
  private hits: Map<string, RateLimitRecord> = new Map();
  private maxHits: number;
  private windowMs: number;

  constructor(maxHits = 60, windowMs = 60000) {
    this.maxHits = maxHits;
    this.windowMs = windowMs;
  }

  public check(key: string): { isAllowed: boolean; remaining: number; resetSeconds: number } {
    const now = Date.now();
    const record = this.hits.get(key);

    if (!record || now > record.resetTime) {
      this.hits.set(key, { count: 1, resetTime: now + this.windowMs });
      return {
        isAllowed: true,
        remaining: this.maxHits - 1,
        resetSeconds: Math.ceil(this.windowMs / 1000),
      };
    }

    if (record.count >= this.maxHits) {
      const resetSeconds = Math.max(1, Math.ceil((record.resetTime - now) / 1000));
      return {
        isAllowed: false,
        remaining: 0,
        resetSeconds,
      };
    }

    record.count += 1;
    const remaining = Math.max(0, this.maxHits - record.count);
    const resetSeconds = Math.max(1, Math.ceil((record.resetTime - now) / 1000));

    return {
      isAllowed: true,
      remaining,
      resetSeconds,
    };
  }

  public reset(key?: string): void {
    if (key) {
      this.hits.delete(key);
    } else {
      this.hits.clear();
    }
  }
}

export const defaultApiLimiter = new MemoryRateLimiter(60, 60000); // 60 requests / minute
export const heavyTaskLimiter = new MemoryRateLimiter(15, 60000); // 15 requests / minute for AI & uploads

