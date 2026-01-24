import Redis from "ioredis"

const globalForRedis = globalThis as unknown as { redis: Redis | null }

function createRedisClient(): Redis | null {
  const url = process.env.REDIS_URL
  if (!url || url.includes("localhost")) {
    // Skip Redis in production if not properly configured
    if (process.env.NODE_ENV === "production") {
      console.warn("Redis not configured for production, some features disabled")
      return null
    }
  }
  try {
    return new Redis(url || "redis://localhost:6379")
  } catch {
    console.warn("Failed to connect to Redis")
    return null
  }
}

export const redis = globalForRedis.redis ?? createRedisClient()

if (process.env.NODE_ENV !== "production") {
  globalForRedis.redis = redis
}
