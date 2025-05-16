export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { NextRequest } from 'next/server'
import { execa } from 'execa'

export async function POST(req: NextRequest) {
  const { url } = await req.json()

  if (!url) {
    return new Response('Missing URL', { status: 400 })
  }

  try {
    const { stdout } = await execa('yt-dlp', ['-j', url])
    const info = JSON.parse(stdout)
    console.log('▶ yt-dlp metadata output:', JSON.stringify(info, null, 2))

    const bestVideo = info.formats?.find((f: any) =>
      f.vcodec !== 'none' && f.acodec === 'none'
    )
    const bestAudio = info.formats?.find((f: any) =>
      f.vcodec === 'none' && f.acodec !== 'none'
    )

    let combinedFormat = null
    if (bestVideo && bestAudio) {
      combinedFormat = {
        videoId: bestVideo.format_id,
        audioId: bestAudio.format_id,
        resolution: bestVideo.height ? `${bestVideo.height}p` : 'unknown',
        ext: bestVideo.ext,
      }
    }

    const isDirect = ['twitter', 'facebook', 'instagram'].includes(info.extractor)
    let formats = []

    if (info.formats && info.formats.length > 0) {
      formats = info.formats
        .filter((f: any) =>
          f.vcodec !== 'none' &&
          f.ext === 'mp4' &&
          (f.filesize || f.filesize_approx)
        )
        .map((f: any) => ({
          format_id: f.format_id,
          ext: f.ext,
          container: f.container || f.ext,
          resolution: f.height ? `${f.height}p` : 'unknown',
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

    const audioOnly = info.formats
      .filter((f: any) => f.vcodec === 'none' && f.acodec !== 'none')
      .sort((a: any, b: any) => (b.filesize || 0) - (a.filesize || 0))[0]

    const bestAudioFallback = audioOnly ? {
      format_id: audioOnly.format_id,
      ext: audioOnly.ext,
      filesize: audioOnly.filesize || null,
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