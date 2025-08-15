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
  
  async getVideoInfo(url: string): Promise<DownloadResult> {
    try {
      console.log('🔗 Instagram URL:', url)
      
      const info = await this.executeYtDlp(url)
      console.log('▶ Instagram metadata output:', JSON.stringify(info, null, 2))
      
      // Instagram genellikle direkt URL döner
      const isDirect = info.url && !info.formats
      
      let formats: VideoFormat[] = []
      if (info.formats && info.formats.length > 0) {
        formats = this.processFormats(info.formats)
      } else if (isDirect) {
        formats = [{
          format_id: 'direct',
          ext: 'mp4',
          container: 'mp4',
          resolution: 'default',
          filesize: undefined,
          url: info.url
        }]
      }
      
      const { bestVideo, bestAudio } = this.findBestFormats(info.formats || [])
      
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