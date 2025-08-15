export interface VideoFormat {
  format_id: string
  ext: string
  container: string
  resolution: string
  filesize?: number
  url?: string
  hasAudio?: boolean
  hasVideo?: boolean
  audioCodec?: string
  videoCodec?: string
}

export interface VideoInfo {
  title: string
  thumbnail?: string
  formats?: VideoFormat[]
  bestAudio?: VideoFormat
  url?: string
  combinedFormat?: {
    videoId: string
    audioId: string | null
    resolution: string
    ext: string
  }
  duration?: number
  uploader?: string
  description?: string
}

export interface DownloadResult {
  success: boolean
  data?: VideoInfo
  error?: string
}

export abstract class BaseDownloader {
  protected abstract platformName: string
  
  abstract canHandle(url: string): boolean
  abstract getVideoInfo(url: string): Promise<DownloadResult>
  
  protected async executeYtDlp(url: string, options: string[] = []): Promise<any> {
    const { execa } = await import('execa')
    try {
      // Try yt-dlp first
      const { stdout } = await execa('yt-dlp', ['-j', ...options, url])
      return JSON.parse(stdout)
    } catch (error: any) {
      console.error(`❌ ${this.platformName} yt-dlp error:`, error.message)
      
      // Fallback for YouTube with ytdl-core
      if ((url.includes('youtube.com') || url.includes('youtu.be')) && this.platformName === 'YouTube') {
        console.log('🔄 Falling back to ytdl-core for YouTube')
        try {
          const ytdl = require('ytdl-core')
          const info = await ytdl.getBasicInfo(url)
          
          // Convert ytdl-core format to yt-dlp format
          return {
            title: info.videoDetails.title,
            thumbnail: info.videoDetails.thumbnails?.[0]?.url,
            duration: parseInt(info.videoDetails.lengthSeconds),
            uploader: info.videoDetails.author?.name,
            description: info.videoDetails.description,
            formats: info.formats?.map((f: any) => ({
              format_id: f.itag?.toString(),
              ext: f.container || 'mp4',
              height: f.height,
              filesize: f.contentLength ? parseInt(f.contentLength) : undefined,
              acodec: f.hasAudio ? f.audioCodec || 'mp4a' : 'none',
              vcodec: f.hasVideo ? f.videoCodec || 'avc1' : 'none',
              url: f.url
            }))
          }
        } catch (fallbackError: any) {
          console.error('❌ ytdl-core fallback also failed:', fallbackError.message)
        }
      }
      
      throw new Error(`yt-dlp not available and no fallback for ${this.platformName}: ${error.message}`)
    }
  }
  
  protected formatFileSize(bytes: number): string {
    if (!bytes) return 'Unknown size'
    const mb = bytes / (1024 * 1024)
    return `${mb.toFixed(1)} MB`
  }
  
  protected findBestFormats(formats: any[]): { bestVideo: any, bestAudio: any } {
    const bestVideo = formats?.find((f: any) =>
      f.vcodec !== 'none' &&
      f.ext === 'mp4' &&
      (f.format_id?.includes('h264') || f.format_id === 'download')
    )
    
    const bestAudio = formats
      ?.filter((f: any) => f.vcodec === 'none' && f.acodec !== 'none')
      ?.sort((a: any, b: any) => (b.filesize || 0) - (a.filesize || 0))[0]
    
    return { bestVideo, bestAudio }
  }
  
  protected processFormats(formats: any[]): VideoFormat[] {
    if (!formats || formats.length === 0) return []
    
    const processedFormats = formats
      .filter((f: any) =>
        f.acodec !== 'none' && // Sadece sesli videoları dahil et
        f.vcodec !== 'none' && // Video codec'i de olmalı
        f.ext === 'mp4' &&
        (f.filesize || f.filesize_approx)
      )
      .map((f: any) => {
        const hasVideo = f.vcodec && f.vcodec !== 'none'
        const hasAudio = f.acodec && f.acodec !== 'none'
        
        return {
          format_id: f.format_id,
          ext: f.ext,
          container: f.container || f.ext,
          resolution: f.height 
            ? `${f.height}p` 
            : hasAudio && !hasVideo
              ? 'audio-only' 
              : 'unknown',
          filesize: f.filesize || f.filesize_approx,
          hasAudio,
          hasVideo,
          audioCodec: f.acodec,
          videoCodec: f.vcodec,
        }
      })
    
    // Remove duplicates, keeping the highest quality for each resolution
    return processedFormats.reduce((acc: VideoFormat[], curr: VideoFormat) => {
      const existing = acc.find(f => f.resolution === curr.resolution)
      if (!existing || (curr.filesize && (!existing.filesize || curr.filesize > existing.filesize))) {
        return [...acc.filter(f => f.resolution !== curr.resolution), curr]
      }
      return acc
    }, [])
  }
}