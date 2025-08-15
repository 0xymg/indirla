import { BaseDownloader, DownloadResult, VideoInfo, VideoFormat } from './base-downloader'

export class TwitterDownloader extends BaseDownloader {
  protected platformName = 'Twitter'
  
  canHandle(url: string): boolean {
    try {
      const urlObj = new URL(url)
      return urlObj.hostname.includes('twitter.com') || urlObj.hostname.includes('x.com')
    } catch {
      return false
    }
  }
  
  async getVideoInfo(url: string): Promise<DownloadResult> {
    try {
      console.log('🔗 Twitter URL:', url)
      
      const info = await this.executeYtDlp(url)
      console.log('▶ Twitter metadata output:', JSON.stringify(info, null, 2))
      
      // Twitter genellikle direkt URL döner
      const isDirect = info.url && (!info.formats || info.formats.length === 0)
      
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
        title: info.title || 'Twitter Video',
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
      console.error('❌ Twitter downloader error:', error.message)
      
      // Daha anlamlı hata mesajları
      let errorMessage = error.message
      if (error.message.includes('No video could be found')) {
        errorMessage = 'This tweet does not contain a video or the video is not accessible.'
      } else if (error.message.includes('Private video')) {
        errorMessage = 'This video is private and cannot be downloaded.'
      } else if (error.message.includes('Video unavailable')) {
        errorMessage = 'This video is no longer available.'
      }
      
      return {
        success: false,
        error: `Failed to fetch Twitter video info: ${errorMessage}`
      }
    }
  }
}