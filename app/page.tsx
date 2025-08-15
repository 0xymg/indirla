'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Download, Video, Music, Loader2, ExternalLink, PlayCircle } from 'lucide-react'

interface VideoFormat {
  format_id: string
  ext: string
  container: string
  resolution: string
  filesize?: number
  url?: string
}

interface VideoInfo {
  title: string
  thumbnail?: string
  formats?: VideoFormat[]
  bestAudio?: VideoFormat
  url?: string
}

export default function Home() {
  const [url, setUrl] = useState('')
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const cleanYouTubeURL = (inputUrl: string): string => {
    try {
      const urlObj = new URL(inputUrl)
      
      // YouTube URL'si değilse, orijinal URL'yi döndür
      if (!urlObj.hostname.includes('youtube.com') && !urlObj.hostname.includes('youtu.be')) {
        return inputUrl
      }
      
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
      
      return inputUrl
    } catch {
      // URL parse edilemezse orijinal URL'yi döndür
      return inputUrl
    }
  }

  const fetchVideoInfo = async () => {
    if (!url.trim()) {
      setError('Please enter a valid URL')
      return
    }
    
    const cleanedUrl = cleanYouTubeURL(url.trim())
    
    // Eğer URL temizlendiyse, input'u güncelle
    if (cleanedUrl !== url.trim()) {
      setUrl(cleanedUrl)
    }
    
    setLoading(true)
    setError('')
    setVideoInfo(null)
    
    try {
      const res = await fetch('/api/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: cleanedUrl }),
      })
      
      if (!res.ok) throw new Error('Failed to fetch video info')
      
      const data = await res.json()
      console.log('Fetched video info:', data)
      setVideoInfo(data)
    } catch {
      setError('Error fetching video info. Please check the URL and try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = (f: VideoFormat) => {
    if (f.url) {
      window.location.href = f.url
    } else if (f.format_id) {
      window.location.href = `/api/stream?url=${encodeURIComponent(url)}&format=${f.format_id}`;
    } else {
      setError('Missing format information');
    }
  }

  const formatFileSize = (bytes: number) => {
    if (!bytes) return 'Unknown size'
    const mb = bytes / (1024 * 1024)
    return `${mb.toFixed(1)} MB`
  }

  const getSupportedPlatforms = () => {
    return ['YouTube', 'Twitter', 'Instagram', 'TikTok', 'Facebook']
  }

  return (
    <div className="min-h-screen bg-white py-12 px-4">
      <div className="container mx-auto max-w-3xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Video className="h-7 w-7 text-black" />
            <h1 className="text-3xl font-semibold text-black">
              Indirla
            </h1>
          </div>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Download videos from multiple platforms with ease
          </p>
          
          {/* Supported Platforms */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
            <span className="text-sm text-gray-500 mr-3">Supported platforms:</span>
            {getSupportedPlatforms().map((platform) => (
              <Badge key={platform} variant="secondary" className="text-xs bg-gray-100 text-gray-700 hover:bg-gray-200 border-0">
                {platform}
              </Badge>
            ))}
          </div>
        </div>

        {/* Main Input Card */}
        <Card className="mb-8 border border-gray-200 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-medium text-black">
              Video Downloader
            </CardTitle>
            <CardDescription className="text-gray-600">
              Paste a video URL from any supported platform
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <Input
                type="url"
                placeholder="https://www.youtube.com/watch?v=..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="flex-1 border-gray-200 focus:border-black focus:ring-1 focus:ring-black"
                onKeyDown={(e) => e.key === 'Enter' && fetchVideoInfo()}
              />
              <Button 
                onClick={fetchVideoInfo} 
                disabled={loading} 
                className="bg-black hover:bg-gray-800 text-white px-6"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Analyze'
                )}
              </Button>
            </div>
            
            {error && (
              <Alert variant="destructive" className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-800">{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Video Info Card */}
        {videoInfo && (
          <Card className="border border-gray-200 shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-start gap-4">
                {videoInfo.thumbnail && (
                  <div className="flex-shrink-0">
                    <Image
                      src={`/api/proxy-image?url=${encodeURIComponent(videoInfo.thumbnail)}`}
                      alt="Video thumbnail"
                      width={120}
                      height={68}
                      className="w-30 h-17 object-cover rounded border border-gray-200"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg font-medium text-black leading-tight">
                    {videoInfo.title}
                  </CardTitle>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-8">
              {/* Video Formats */}
              {Array.isArray(videoInfo?.formats) && videoInfo.formats.length > 0 && (
                <div>
                  <h3 className="text-base font-medium text-black mb-4">Video Formats</h3>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {videoInfo.formats.map((f: VideoFormat) => (
                      <Card key={f.format_id} className="p-4 border border-gray-200 hover:border-gray-300 transition-colors">
                        <div className="flex items-center justify-between mb-3">
                          <Badge variant="secondary" className="bg-gray-100 text-gray-700 border-0 text-xs">
                            {f.ext?.toUpperCase()}
                          </Badge>
                          <Badge variant="outline" className="border-gray-200 text-gray-600 text-xs">
                            {f.resolution}
                          </Badge>
                        </div>
                        {f.filesize && (
                          <p className="text-xs text-gray-500 mb-3">
                            {formatFileSize(f.filesize)}
                          </p>
                        )}
                        <Button 
                          onClick={() => handleDownload(f)} 
                          size="sm" 
                          className="w-full bg-black hover:bg-gray-800 text-white text-xs"
                        >
                          <Download className="mr-2 h-3 w-3" />
                          Download
                        </Button>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Audio Format */}
              {videoInfo.bestAudio && (
                <div>
                  <Separator className="bg-gray-200" />
                  <div className="pt-6">
                    <h3 className="text-base font-medium text-black mb-4">Audio Only</h3>
                    <Card className="p-4 max-w-sm border border-gray-200">
                      <div className="flex items-center justify-between mb-3">
                        <Badge variant="secondary" className="bg-gray-100 text-gray-700 border-0 text-xs">
                          {videoInfo.bestAudio.ext?.toUpperCase()}
                        </Badge>
                        <Badge variant="outline" className="border-gray-200 text-gray-600 text-xs">
                          Audio Only
                        </Badge>
                      </div>
                      {videoInfo.bestAudio.filesize && (
                        <p className="text-xs text-gray-500 mb-3">
                          {formatFileSize(videoInfo.bestAudio.filesize)}
                        </p>
                      )}
                      <Button 
                        onClick={() => videoInfo.bestAudio && handleDownload(videoInfo.bestAudio)} 
                        size="sm" 
                        className="w-full bg-black hover:bg-gray-800 text-white text-xs"
                      >
                        <Download className="mr-2 h-3 w-3" />
                        Download Audio
                      </Button>
                    </Card>
                  </div>
                </div>
              )}

              {/* Direct Download (Twitter, etc) */}
              {videoInfo.url && (!videoInfo.formats || videoInfo.formats.length === 0) && (
                <div>
                  <Separator className="bg-gray-200" />
                  <div className="pt-6">
                    <h3 className="text-base font-medium text-black mb-4">Direct Download</h3>
                    <Card className="p-4 max-w-sm border border-gray-200">
                      <div className="mb-3">
                        <Badge variant="secondary" className="bg-gray-100 text-gray-700 border-0 text-xs">
                          MP4
                        </Badge>
                      </div>
                      <Button 
                        onClick={() => videoInfo.url && (window.location.href = videoInfo.url)} 
                        size="sm" 
                        className="w-full bg-black hover:bg-gray-800 text-white text-xs"
                      >
                        <Download className="mr-2 h-3 w-3" />
                        Download Video
                      </Button>
                    </Card>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}