export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { NextRequest } from 'next/server'
import { execa } from 'execa'
import { PassThrough, Readable } from 'stream'

export async function GET(req: NextRequest) {
    const url = req.nextUrl.searchParams.get('url')
    const videoId = req.nextUrl.searchParams.get('video')
    const audioId = req.nextUrl.searchParams.get('audio')
    const isCombined = !!videoId
    const format = isCombined
        ? (audioId && audioId !== 'null' ? `${videoId}+${audioId}` : `${videoId}+bestaudio`)
        : req.nextUrl.searchParams.get('format')

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