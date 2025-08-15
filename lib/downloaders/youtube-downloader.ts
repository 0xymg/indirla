import { BaseDownloader, DownloadResult, VideoInfo } from './base-downloader'

export class YouTubeDownloader extends BaseDownloader {
  protected platformName = 'YouTube'
  
  canHandle(url: string): boolean {
    try {
      const urlObj = new URL(url)
      return urlObj.hostname.includes('youtube.com') || urlObj.hostname.includes('youtu.be')
    } catch {
      return false
    }
  }
  
  private cleanYouTubeURL(url: string): string {
    try {
      const urlObj = new URL(url)
      
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
      return url
    }
  }
  
  async getVideoInfo(url: string): Promise<DownloadResult> {
    try {
      const cleanedUrl = this.cleanYouTubeURL(url)
      console.log('🔗 YouTube Original URL:', url)
      console.log('🧹 YouTube Cleaned URL:', cleanedUrl)
      
      const info = await this.executeYtDlp(cleanedUrl)
      console.log('▶ YouTube metadata output:', JSON.stringify(info, null, 2))
      
      const { bestVideo, bestAudio } = this.findBestFormats(info.formats)
      const formats = this.processFormats(info.formats || [])
      
      // Combined format for YouTube (video + audio)
      let combinedFormat = null
      if (bestVideo?.format_id) {
        combinedFormat = {
          videoId: String(bestVideo.format_id),
          audioId: bestAudio?.format_id || null,
          resolution: bestVideo.height ? `${bestVideo.height}p` : 'unknown',
          ext: String(bestVideo.ext),
        }
      }
      
      // Best audio format
      const bestAudioFormat = bestAudio ? {
        format_id: bestAudio.format_id,
        ext: bestAudio.ext,
        container: bestAudio.container || bestAudio.ext,
        resolution: 'audio-only',
        filesize: bestAudio.filesize || bestAudio.filesize_approx,
      } : undefined
      
      const videoInfo: VideoInfo = {
        title: info.title,
        thumbnail: info.thumbnail || (info.thumbnails?.[0]?.url ?? undefined),
        formats,
        bestAudio: bestAudioFormat,
        combinedFormat: combinedFormat || undefined,
        duration: info.duration,
        uploader: info.uploader,
        description: info.description,
      }
      
      return {
        success: true,
        data: videoInfo
      }
    } catch (error: any) {
      console.error('❌ YouTube downloader error:', error.message)
      return {
        success: false,
        error: error.message
      }
    }
  }
}