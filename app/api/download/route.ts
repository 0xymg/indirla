export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { NextRequest } from 'next/server'
import { execa } from 'execa'

function cleanYouTubeURL(url: string): string {
  try {
    const urlObj = new URL(url)
    
    // YouTube URL'si değilse, orijinal URL'yi döndür
    if (!urlObj.hostname.includes('youtube.com') && !urlObj.hostname.includes('youtu.be')) {
      return url
    }
    
    // youtu.be kısa linklerini işle
    if (urlObj.hostname.includes('youtu.be')) {
      const videoId = urlObj.pathname.slice(1)
      return `https://www.youtube.com/watch?v=${videoId}`
    }
    
    // Normal YouTube linklerini işle
    if (urlObj.pathname === '/watch') {
      const videoId = urlObj.searchParams.get('v')
      if (videoId) {
        return `https://www.youtube.com/watch?v=${videoId}`
      }
    }
    
    return url
  } catch {
    // URL parse edilemezse orijinal URL'yi döndür
    return url
  }
}

export async function POST(req: NextRequest) {
  const { url } = await req.json()

  if (!url) {
    return new Response('Missing URL', { status: 400 })
  }

  // URL'yi temizle
  const cleanedUrl = cleanYouTubeURL(url)
  console.log('🔗 Original URL:', url)
  console.log('🧹 Cleaned URL:', cleanedUrl)

  try {
    const { stdout } = await execa('yt-dlp', ['-j', cleanedUrl])
    const info = JSON.parse(stdout)
    console.log('▶ yt-dlp metadata output:', JSON.stringify(info, null, 2))

    const bestVideo = info.formats?.find((f: any) =>
      f.vcodec !== 'none' &&
      f.ext === 'mp4' &&
      (f.format_id?.includes('h264') || f.format_id === 'download')
    )
    const bestAudio = info.formats?.find((f: any) => f.vcodec === 'none' && f.acodec !== 'none')

    let combinedFormat = null
    if (bestVideo?.format_id) {
      combinedFormat = {
        videoId: String(bestVideo.format_id),
        audioId: bestAudio?.format_id || null,
        resolution: bestVideo.height ? `${bestVideo.height}p` : 'unknown',
        ext: bestVideo.ext,
      }
    }

    const isDirect = ['twitter', 'facebook'].includes(info.extractor)
    let formats = []

    if (info.formats && info.formats.length > 0) {
      formats = info.formats
        .filter((f: any) =>
          (f.vcodec !== 'none' || f.acodec !== 'none') &&
          f.ext === 'mp4' &&
          (f.filesize || f.filesize_approx)
        )
        .map((f: any) => ({
          format_id: f.format_id,
          ext: f.ext,
          container: f.container || f.ext,
          resolution: f.height ? `${f.height}p` : f.acodec !== 'none' && f.vcodec === 'none' ? 'audio-only' : 'unknown',
          filesize: f.filesize || f.filesize_approx,
        }))

      formats = formats.reduce((acc: any[], curr: any) => {
        const existing = acc.find(f => f.resolution === curr.resolution);
        if (!existing || curr.filesize > existing.filesize) {
          return [...acc.filter(f => f.resolution !== curr.resolution), curr];
        }
        return acc;
      }, [])
    } else if (isDirect && info.url) {
      formats = [{
        format_id: 'direct',
        ext: 'mp4',
        container: 'mp4',
        resolution: 'default',
        filesize: null,
        url: info.url
      }]
    }

    const bestAudioFallback = info.formats
      .filter((f: any) => f.vcodec === 'none' && f.acodec !== 'none')
      .sort((a: any, b: any) => (b.filesize || 0) - (a.filesize || 0))[0] ? {
        format_id: info.formats
          .filter((f: any) => f.vcodec === 'none' && f.acodec !== 'none')
          .sort((a: any, b: any) => (b.filesize || 0) - (a.filesize || 0))[0].format_id,
        ext: info.formats
          .filter((f: any) => f.vcodec === 'none' && f.acodec !== 'none')
          .sort((a: any, b: any) => (b.filesize || 0) - (a.filesize || 0))[0].ext,
        filesize: info.formats
          .filter((f: any) => f.vcodec === 'none' && f.acodec !== 'none')
          .sort((a: any, b: any) => (b.filesize || 0) - (a.filesize || 0))[0].filesize || null,
      } : null

    return Response.json({
      title: info.title,
      thumbnail: info.thumbnail || (info.thumbnails?.[0]?.url ?? null),
      formats,
      bestAudio: bestAudioFallback,
      combinedFormat,
    })
  } catch (err: any) {
    console.error('❌ yt-dlp metadata error:', err.message)
    return new Response('Failed to fetch video info', { status: 500 })
  }
}