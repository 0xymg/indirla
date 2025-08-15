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
  
  private processInstagramFormats(formats: any[]): VideoFormat[] {
    if (!formats || formats.length === 0) return []
    
    return formats
      .filter((f: any) => f.ext === 'mp4' && (f.filesize || f.filesize_approx))
      .map((f: any) => ({
        format_id: f.format_id,
        ext: f.ext,
        container: f.container || f.ext,
        resolution: f.height ? `${f.height}p + Audio` : 'Unknown + Audio',
        filesize: f.filesize || f.filesize_approx,
        hasAudio: true, // Instagram'da her format sesli olarak göster
        hasVideo: true,
        audioCodec: 'aac',
        videoCodec: f.vcodec || 'h264',
      }))
      .sort((a, b) => {
        // Yüksek çözünürlük önce
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
      
      // Instagram için özel format processing - hepsi sesli
      let formats: VideoFormat[] = []
      
      if (info.formats && info.formats.length > 0) {
        // Normal formatları işle ama hepsini sesli olarak göster
        formats = this.processInstagramFormats(info.formats)
      } else if (isDirect) {
        // Direkt URL için multiple resolution options oluştur (hepsi sesli)
        formats = [
          {
            format_id: 'best',
            ext: 'mp4',
            container: 'mp4',
            resolution: 'Best Quality',
            filesize: undefined,
            url: info.url,
            hasAudio: true,
            hasVideo: true,
            audioCodec: 'aac',
            videoCodec: 'h264'
          },
          {
            format_id: 'worst',
            ext: 'mp4', 
            container: 'mp4',
            resolution: 'Lower Quality',
            filesize: undefined,
            url: info.url,
            hasAudio: true,
            hasVideo: true,
            audioCodec: 'aac',
            videoCodec: 'h264'
          }
        ]
      }
      
      const { bestVideo, bestAudio } = this.findBestFormats(info.formats || [])
      
      console.log('🎬 Instagram formats found:', {
        totalFormats: info.formats?.length || 0,
        bestVideo: bestVideo ? {
          format_id: bestVideo.format_id,
          ext: bestVideo.ext,
          vcodec: bestVideo.vcodec,
          acodec: bestVideo.acodec
        } : null,
        bestAudio: bestAudio ? {
          format_id: bestAudio.format_id,
          ext: bestAudio.ext,
          vcodec: bestAudio.vcodec,
          acodec: bestAudio.acodec
        } : null,
        isDirect
      })
      
      
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