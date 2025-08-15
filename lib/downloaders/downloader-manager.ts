import { BaseDownloader, DownloadResult } from './base-downloader'
import { YouTubeDownloader } from './youtube-downloader'
import { InstagramDownloader } from './instagram-downloader'
import { TwitterDownloader } from './twitter-downloader'
import { TikTokDownloader } from './tiktok-downloader'
import { FacebookDownloader } from './facebook-downloader'
import { PlatformDetector, Platform } from '../utils/platform-detector'

export class DownloaderManager {
  private downloaders: BaseDownloader[]
  
  constructor() {
    this.downloaders = [
      new YouTubeDownloader(),
      new InstagramDownloader(),
      new TwitterDownloader(),
      new TikTokDownloader(),
      new FacebookDownloader(),
    ]
  }
  
  async downloadVideo(url: string): Promise<DownloadResult> {
    try {
      // Platform detection
      const platformInfo = PlatformDetector.detect(url)
      console.log('🔍 Platform detected:', platformInfo.platform)
      console.log('🔗 Original URL:', url)
      console.log('🧹 Clean URL:', platformInfo.cleanUrl)
      
      // Find appropriate downloader
      const downloader = this.downloaders.find(d => d.canHandle(platformInfo.cleanUrl))
      
      if (!downloader) {
        return {
          success: false,
          error: `Unsupported platform or invalid URL: ${url}`
        }
      }
      
      // Download video info
      return await downloader.getVideoInfo(platformInfo.cleanUrl)
      
    } catch (error: any) {
      console.error('❌ DownloaderManager error:', error.message)
      return {
        success: false,
        error: `Failed to process URL: ${error.message}`
      }
    }
  }
  
  getSupportedPlatforms(): Platform[] {
    return [
      Platform.YOUTUBE,
      Platform.INSTAGRAM,
      Platform.TWITTER,
      Platform.TIKTOK,
      Platform.FACEBOOK
    ]
  }
  
  isPlatformSupported(url: string): boolean {
    const platformInfo = PlatformDetector.detect(url)
    return platformInfo.platform !== Platform.UNKNOWN
  }
}