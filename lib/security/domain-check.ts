export function isValidDomain(request: Request): boolean {
  const origin = request.headers.get('origin')
  const referer = request.headers.get('referer')
  
  const allowedDomains = [
    'https://indir.la',
    'https://www.indir.la',
    'http://localhost:3000', // Development
    'http://127.0.0.1:3000', // Development
  ]
  
  // Check origin header
  if (origin && allowedDomains.includes(origin)) {
    return true
  }
  
  // Check referer header
  if (referer) {
    try {
      const refererUrl = new URL(referer)
      const refererOrigin = `${refererUrl.protocol}//${refererUrl.host}`
      if (allowedDomains.includes(refererOrigin)) {
        return true
      }
    } catch {
      // Invalid referer URL
    }
  }
  
  // For development, allow requests without origin/referer
  if (process.env.NODE_ENV === 'development') {
    return true
  }
  
  return false
}

export function getClientIdentifier(request: Request): string {
  // Use IP address as identifier
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const ip = forwarded?.split(',')[0] || realIp || 'unknown'
  
  return ip
}