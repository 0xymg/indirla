export enum Platform {
  YOUTUBE = 'youtube',
  INSTAGRAM = 'instagram',
  TWITTER = 'twitter',
  TIKTOK = 'tiktok',
  FACEBOOK = 'facebook',
  UNKNOWN = 'unknown'
}

export interface PlatformInfo {
  platform: Platform
  cleanUrl: string
  videoId?: string
}

export class PlatformDetector {
  static detect(url: string): PlatformInfo {
    try {
      const urlObj = new URL(url)
      const hostname = urlObj.hostname.toLowerCase()
      
      // YouTube detection
      if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
        return this.handleYouTube(urlObj, url)
      }
      
      // Instagram detection
      if (hostname.includes('instagram.com')) {
        return this.handleInstagram(urlObj, url)
      }
      
      // Twitter detection
      if (hostname.includes('twitter.com') || hostname.includes('x.com')) {
        return this.handleTwitter(urlObj, url)
      }
      
      // TikTok detection
      if (hostname.includes('tiktok.com')) {
        return this.handleTikTok(urlObj, url)
      }
      
      // Facebook detection
      if (hostname.includes('facebook.com') || hostname.includes('fb.watch')) {
        return this.handleFacebook(urlObj, url)
      }
      
      return {
        platform: Platform.UNKNOWN,
        cleanUrl: url
      }
    } catch {
      return {
        platform: Platform.UNKNOWN,
        cleanUrl: url
      }
    }
  }
  
  private static handleYouTube(urlObj: URL, originalUrl: string): PlatformInfo {
    // youtu.be kısa linklerini işle
    if (urlObj.hostname.includes('youtu.be')) {
      const videoId = urlObj.pathname.slice(1)
      return {
        platform: Platform.YOUTUBE,
        cleanUrl: `https://www.youtube.com/watch?v=${videoId}`,
        videoId
      }
    }
    
    // Normal YouTube linklerini işle
    if (urlObj.pathname === '/watch') {
      const videoId = urlObj.searchParams.get('v')
      if (videoId) {
        return {
          platform: Platform.YOUTUBE,
          cleanUrl: `https://www.youtube.com/watch?v=${videoId}`,
          videoId
        }
      }
    }
    
    return {
      platform: Platform.YOUTUBE,
      cleanUrl: originalUrl
    }
  }
  
  private static handleInstagram(urlObj: URL, originalUrl: string): PlatformInfo {
    // Instagram post, reel, story linklerini işle
    const pathMatch = urlObj.pathname.match(/\/(p|reel|stories)\/([^\/]+)/)
    const videoId = pathMatch ? pathMatch[2] : undefined
    
    return {
      platform: Platform.INSTAGRAM,
      cleanUrl: originalUrl,
      videoId
    }
  }
  
  private static handleTwitter(urlObj: URL, originalUrl: string): PlatformInfo {
    // Twitter tweet linklerini işle
    const pathMatch = urlObj.pathname.match(/\/[^\/]+\/status\/(\d+)/)
    const videoId = pathMatch ? pathMatch[1] : undefined
    
    // x.com URL'lerini twitter.com'a çevir
    let cleanUrl = originalUrl
    if (originalUrl.includes('x.com/')) {
      cleanUrl = originalUrl.replace('x.com/', 'twitter.com/')
    }
    
    return {
      platform: Platform.TWITTER,
      cleanUrl: cleanUrl,
      videoId
    }
  }
  
  private static handleTikTok(urlObj: URL, originalUrl: string): PlatformInfo {
    // TikTok video linklerini işle
    const pathMatch = urlObj.pathname.match(/\/[^\/]+\/video\/(\d+)/)
    const videoId = pathMatch ? pathMatch[1] : undefined
    
    return {
      platform: Platform.TIKTOK,
      cleanUrl: originalUrl,
      videoId
    }
  }
  
  private static handleFacebook(urlObj: URL, originalUrl: string): PlatformInfo {
    // Facebook video linklerini işle
    let videoId: string | undefined
    
    // fb.watch links
    if (urlObj.hostname === 'fb.watch') {
      videoId = urlObj.pathname.slice(1)
    }
    // facebook.com video links
    else if (urlObj.pathname.includes('/videos/')) {
      const match = urlObj.pathname.match(/\/videos\/(\d+)/)
      videoId = match ? match[1] : undefined
    }
    
    return {
      platform: Platform.FACEBOOK,
      cleanUrl: originalUrl,
      videoId
    }
  }
}