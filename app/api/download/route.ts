export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { NextRequest } from 'next/server'
import { DownloaderManager } from '@/lib/downloaders/downloader-manager'
import { isValidDomain, getClientIdentifier } from '@/lib/security/domain-check'
import { checkRateLimit } from '@/lib/security/rate-limiter'

export async function POST(req: NextRequest) {
  // Check domain restriction
  if (!isValidDomain(req)) {
    return new Response('Unauthorized domain', { status: 403 })
  }

  // Check rate limit
  const clientId = getClientIdentifier(req)
  const rateLimitResult = checkRateLimit(clientId, 1, 60 * 1000) // 1 per minute
  
  if (!rateLimitResult.success) {
    return new Response('Rate limit exceeded. Please wait before making another request.', {
      status: 429,
      headers: {
        'X-RateLimit-Limit': rateLimitResult.limit.toString(),
        'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
        'X-RateLimit-Reset': new Date(rateLimitResult.resetTime).toISOString(),
        'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString(),
      },
    })
  }

  const { url } = await req.json()

  if (!url) {
    return new Response('Missing URL', { status: 400 })
  }

  try {
    const downloaderManager = new DownloaderManager()
    const result = await downloaderManager.downloadVideo(url)
    
    if (!result.success) {
      console.error('❌ Download failed:', result.error)
      return new Response(result.error || 'Failed to fetch video info', { status: 500 })
    }
    
    return Response.json(result.data, {
      headers: {
        'X-RateLimit-Limit': rateLimitResult.limit.toString(),
        'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
        'X-RateLimit-Reset': new Date(rateLimitResult.resetTime).toISOString(),
      },
    })
  } catch (err: any) {
    console.error('❌ API error:', err.message)
    return new Response('Internal server error', { status: 500 })
  }
}