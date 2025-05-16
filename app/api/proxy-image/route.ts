import { NextRequest } from 'next/server'
import { headers } from 'next/headers'

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url')
  if (!url) return new Response('Missing URL', { status: 400 })

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': (await headers()).get('user-agent') || '',
        'Referer': 'https://www.instagram.com/',
      },
    })

    const contentType = response.headers.get('content-type') || 'image/jpeg'
    const buffer = await response.arrayBuffer()

    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
      },
    })
  } catch (e) {
    return new Response('Failed to proxy image', { status: 500 })
  }
}