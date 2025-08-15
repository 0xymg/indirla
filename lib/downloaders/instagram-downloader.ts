import { BaseDownloader, DownloadResult, VideoInfo, VideoFormat } from './base-downloader'

export class InstagramDownloader extends BaseDownloader {
  protected platformName = 'Instagram'
  
  canHandle(url: string): boolean {
    try {
      const urlObj = new URL(url)
      return urlObj.hostname.includes('instagram.com')
    } catch {
      return false
    }
  }
  
  // Instagram için normal format processing
  private processInstagramFormats(formats: any[]): VideoFormat[] {
    if (!formats || formats.length === 0) return []
    
    return formats
      .filter((f: any) => f.ext === 'mp4' && (f.filesize || f.filesize_approx))
      .map((f: any) => {
        const hasVideo = f.vcodec && f.vcodec !== 'none'
        const hasAudio = f.acodec && f.acodec !== 'none'
        
        return {
          format_id: f.format_id,
          ext: f.ext,
          container: f.container || f.ext,
          resolution: f.height ? `${f.height}p` : 'Unknown',
          filesize: f.filesize || f.filesize_approx,
          hasAudio,
          hasVideo,
          audioCodec: f.acodec,
          videoCodec: f.vcodec,
        }
      })
      .sort((a, b) => {
        const getHeight = (res: string) => {
          const match = res.match(/(\d+)p/)
          return match ? parseInt(match[1]) : 0
        }
        return getHeight(b.resolution) - getHeight(a.resolution)
      })
  }
  
  async getVideoInfo(url: string): Promise<DownloadResult> {
    try {
      console.log('🔗 Instagram URL:', url)
      
      const info = await this.executeYtDlp(url)
      console.log('▶ Instagram metadata output:', JSON.stringify(info, null, 2))
      
      // Instagram genellikle direkt URL döner
      const isDirect = info.url && (!info.formats || info.formats.length === 0)
      
      let formats: VideoFormat[] = []
      if (info.formats && info.formats.length > 0) {
        formats = this.processInstagramFormats(info.formats)
      } else if (isDirect) {
        formats = [{
          format_id: 'direct',
          ext: 'mp4',
          container: 'mp4',
          resolution: 'default',
          filesize: undefined,
          url: info.url,
          hasAudio: true,
          hasVideo: true,
        }]
      }
      
      const { bestVideo, bestAudio } = this.findBestFormats(info.formats || [])
      
      // Instagram için combined format - her zaman ekle
      let combinedFormat = {
        videoId: 'bestvideo',
        audioId: 'bestaudio',
        resolution: 'Best Quality',
        ext: 'mp4',
      }
      
      console.log('✅ Instagram combined format created')
      
      const videoInfo: VideoInfo = {
        title: info.title || 'Instagram Video',
        thumbnail: info.thumbnail || (info.thumbnails?.[0]?.url ?? undefined),
        formats,
        bestAudio: bestAudio ? {
          format_id: bestAudio.format_id,
          ext: bestAudio.ext,
          container: bestAudio.container || bestAudio.ext,
          resolution: 'audio-only',
          filesize: bestAudio.filesize || bestAudio.filesize_approx,
        } : undefined,
        combinedFormat: combinedFormat || undefined,
        url: isDirect ? info.url : undefined,
        duration: info.duration,
        uploader: info.uploader,
        description: info.description,
      }
      
      return {
        success: true,
        data: videoInfo
      }
    } catch (error: any) {
      console.error('❌ Instagram downloader error:', error.message)
      return {
        success: false,
        error: error.message
      }
    }
  }
}