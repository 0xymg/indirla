// In-memory rate limiter
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  resetTime: number
}

export function checkRateLimit(
  identifier: string,
  limit: number = 1,
  windowMs: number = 60 * 1000 // 1 minute
): RateLimitResult {
  const now = Date.now()
  const key = identifier
  
  // Clean up expired entries
  for (const [k, v] of rateLimitMap.entries()) {
    if (now > v.resetTime) {
      rateLimitMap.delete(k)
    }
  }
  
  const record = rateLimitMap.get(key)
  
  if (!record) {
    // First request
    rateLimitMap.set(key, {
      count: 1,
      resetTime: now + windowMs
    })
    
    return {
      success: true,
      limit,
      remaining: limit - 1,
      resetTime: now + windowMs
    }
  }
  
  if (now > record.resetTime) {
    // Reset window
    rateLimitMap.set(key, {
      count: 1,
      resetTime: now + windowMs
    })
    
    return {
      success: true,
      limit,
      remaining: limit - 1,
      resetTime: now + windowMs
    }
  }
  
  if (record.count >= limit) {
    // Rate limit exceeded
    return {
      success: false,
      limit,
      remaining: 0,
      resetTime: record.resetTime
    }
  }
  
  // Increment count
  record.count++
  
  return {
    success: true,
    limit,
    remaining: limit - record.count,
    resetTime: record.resetTime
  }
}