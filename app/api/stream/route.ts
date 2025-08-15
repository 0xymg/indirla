export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { NextRequest } from 'next/server'
import { execa } from 'execa'
import { PassThrough, Readable } from 'stream'

import { PlatformDetector } from '@/lib/utils/platform-detector'
import { isValidDomain, getClientIdentifier } from '@/lib/security/domain-check'
import { checkRateLimit } from '@/lib/security/rate-limiter'

export async function GET(req: NextRequest) {
    // Check domain restriction
    if (!isValidDomain(req)) {
        return new Response('Unauthorized domain', { status: 403 })
    }

    // Check rate limit for downloads (stricter limit for actual downloads)
    const clientId = getClientIdentifier(req)
    const rateLimitResult = checkRateLimit(`download_${clientId}`, 2, 60 * 1000) // 2 downloads per minute
    
    if (!rateLimitResult.success) {
        return new Response('Download rate limit exceeded. Please wait before downloading another video.', {
            status: 429,
            headers: {
                'X-RateLimit-Limit': rateLimitResult.limit.toString(),
                'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
                'X-RateLimit-Reset': new Date(rateLimitResult.resetTime).toISOString(),
                'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString(),
            },
        })
    }
    const originalUrl = req.nextUrl.searchParams.get('url')
    const url = originalUrl ? PlatformDetector.detect(originalUrl).cleanUrl : null
    const videoId = req.nextUrl.searchParams.get('video')
    const audioId = req.nextUrl.searchParams.get('audio')
    const isCombined = !!videoId
    const format = isCombined
        ? (audioId && audioId !== 'null' ? `${videoId}+${audioId}` : `${videoId}+bestaudio`)
        : req.nextUrl.searchParams.get('format')

    console.log('🔗 Stream Original URL:', originalUrl)
    console.log('🧹 Stream Cleaned URL:', url)
    console.log('💡 Debug:', {
      url,
      format,
      videoId,
      audioId,
      isCombined
    })

    if (
        !url ||
        !format ||
        format === 'null' ||
        format === 'null+null' ||
        /(^|[+])null($|[+])/.test(format)
    ) {
        return new Response('Missing or invalid url/format', { status: 400 });
    }

    try {
        const info = await execa('yt-dlp', ['-j', url])
        const parsedInfo = JSON.parse(info.stdout)
        const title = parsedInfo.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()
        const videoFormat = videoId || format
        const audioFormat = audioId || null
        const resolution = parsedInfo.height ? `${parsedInfo.height}p_` : ''
        const filename = `${resolution}${title}_indirla.mp4`

        const stream = new PassThrough()

        console.log('▶️ Starting stream. Format:', format)
        if (isCombined) {
            try {
                const { stdout: videoUrl } = await execa('yt-dlp', ['-f', videoFormat, '-g', url])
                let audioUrl: string | null = null
                try {
                    const { stdout } = await execa('yt-dlp', ['-f', audioFormat || 'bestaudio', '-g', url])
                    audioUrl = stdout.trim()
                } catch {
                    console.warn('⚠️ No separate audio stream found, using video-only.')
                }

                const ffmpegArgs = audioUrl ? [
                    '-i', videoUrl.trim(),
                    '-i', audioUrl,
                    ...(audioUrl ? ['-map', '0:v:0', '-map', '1:a:0'] : []),
                    '-c:v', 'libx264',
                    '-preset', 'veryfast',
                    '-crf', '28',
                    '-c:a', 'aac',
                    '-b:a', '96k',
                    '-movflags', 'frag_keyframe+empty_moov',
                    '-f', 'mp4',
                    'pipe:1'
                ] : [
                    '-i', videoUrl.trim(),
                    '-c:v', 'libx264',
                    '-preset', 'veryfast',
                    '-crf', '28',
                    '-c:a', 'aac',
                    '-b:a', '96k',
                    '-movflags', 'frag_keyframe+empty_moov',
                    '-f', 'mp4',
                    'pipe:1'
                ]

                console.log('▶️ Calling ffmpeg with args:', ffmpegArgs)
                const ffmpeg = execa('ffmpeg', ffmpegArgs, { stdout: 'pipe', stderr: 'inherit' })
                if (!ffmpeg.stdout) throw new Error('No output from ffmpeg')
                ffmpeg.stdout.pipe(stream)
                console.log('✅ ffmpeg streaming started')
            } catch (err) {
                console.error('❌ Error during combined streaming:', err)
                throw err
            }
        } else {
            const args = [
                '-f', format,
                '-o', '-',
                url,
            ]
            console.log('▶️ Calling yt-dlp with args:', args)
            const proc = execa('yt-dlp', args, { stdout: 'pipe' })
            if (!proc.stdout) throw new Error('No output from yt-dlp')
            proc.stdout.pipe(stream)
            console.log('✅ yt-dlp streaming started')
        }

        return new Response(Readable.toWeb(stream) as unknown as ReadableStream<Uint8Array>, {
            headers: {
                'Content-Disposition': `attachment; filename="${filename}"`,
                'Content-Type': 'video/mp4',
            },
        })
    } catch (err: any) {
        console.error('❌ yt-dlp stream error:', err);
        return new Response(`Failed to stream video: ${err.message || err}`, { status: 500 });
    }
}