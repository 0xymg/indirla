export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { NextRequest } from 'next/server'
import { DownloaderManager } from '@/lib/downloaders/downloader-manager'

export async function POST(req: NextRequest) {
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
    
    return Response.json(result.data)
  } catch (err: any) {
    console.error('❌ API error:', err.message)
    return new Response('Internal server error', { status: 500 })
  }
}