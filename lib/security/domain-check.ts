export function isValidDomain(request: Request): boolean {
  const origin = request.headers.get('origin')
  const referer = request.headers.get('referer')
  const host = request.headers.get('host')
  
  console.log('🔒 Domain check:', { origin, referer, host })
  
  const allowedDomains = [
    'https://indir.la',
    'https://www.indir.la',
    'http://localhost:3000', // Development
    'http://127.0.0.1:3000', // Development
  ]
  
  const allowedHosts = [
    'indir.la',
    'www.indir.la',
    'localhost:3000',
    '127.0.0.1:3000'
  ]
  
  // Check host header first (most reliable on Vercel)
  if (host && allowedHosts.some(allowedHost => host === allowedHost)) {
    console.log('✅ Valid domain via host header:', host)
    return true
  }
  
  // Check origin header
  if (origin && allowedDomains.includes(origin)) {
    console.log('✅ Valid domain via origin header:', origin)
    return true
  }
  
  // Check referer header
  if (referer) {
    try {
      const refererUrl = new URL(referer)
      const refererOrigin = `${refererUrl.protocol}//${refererUrl.host}`
      if (allowedDomains.includes(refererOrigin)) {
        console.log('✅ Valid domain via referer header:', refererOrigin)
        return true
      }
    } catch {
      // Invalid referer URL
    }
  }
  
  // For development, allow requests without origin/referer
  if (process.env.NODE_ENV === 'development') {
    console.log('✅ Development mode, allowing request')
    return true
  }
  
  console.log('❌ Domain check failed')
  return false
}

export function getClientIdentifier(request: Request): string {
  // Use IP address as identifier
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const ip = forwarded?.split(',')[0] || realIp || 'unknown'
  
  return ip
}