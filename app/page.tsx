'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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

export default function Home() {
  const router = useRouter()
  const [url, setUrl] = useState('')
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const fetchVideoInfo = async () => {
    if (!url.trim()) {
      setError('Please enter a valid URL')
      return
    }
    
    setLoading(true)
    setError('')
    setVideoInfo(null)
    
    try {
      const res = await fetch('/api/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
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
    const params = new URLSearchParams({
      url: url,
      format: f.format_id,
      title: videoInfo?.title || 'Video Download',
      resolution: f.resolution,
      ext: f.ext,
    })
    
    if (f.filesize) {
      params.append('filesize', f.filesize.toString())
    }
    
    if (f.url) {
      params.append('directUrl', f.url)
    }
    
    router.push(`/download?${params.toString()}`)
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
                  'Get Video'
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

              {/* Combined Format (Video + Audio) */}
              {videoInfo.combinedFormat && (
                <div>
                  <Separator className="bg-gray-200" />
                  <div className="pt-6">
                    <h3 className="text-base font-medium text-black mb-4">Best Quality (Video + Audio)</h3>
                    <Card className="p-4 max-w-sm border border-gray-200 bg-blue-50">
                      <div className="flex items-center justify-between mb-3">
                        <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-0 text-xs">
                          {videoInfo.combinedFormat.ext?.toUpperCase()}
                        </Badge>
                        <Badge variant="outline" className="border-blue-200 text-blue-600 text-xs">
                          {videoInfo.combinedFormat.resolution}
                        </Badge>
                      </div>
                      <p className="text-xs text-blue-600 mb-3">
                        Combined video and audio
                      </p>
                      <Button 
                        onClick={() => {
                          if (videoInfo.combinedFormat) {
                            const params = new URLSearchParams({
                              url: url,
                              format: 'combined',
                              title: videoInfo.title || 'Video Download',
                              resolution: videoInfo.combinedFormat.resolution,
                              ext: videoInfo.combinedFormat.ext,
                              videoId: videoInfo.combinedFormat.videoId,
                              audioId: videoInfo.combinedFormat.audioId || '',
                            })
                            router.push(`/download?${params.toString()}`)
                          }
                        }} 
                        size="sm" 
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs"
                      >
                        <Download className="mr-2 h-3 w-3" />
                        Download with Audio
                      </Button>
                    </Card>
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
                        onClick={() => {
                          if (videoInfo.url) {
                            const params = new URLSearchParams({
                              url: url,
                              format: 'direct',
                              title: videoInfo.title || 'Video Download',
                              resolution: 'default',
                              ext: 'mp4',
                              directUrl: videoInfo.url
                            })
                            router.push(`/download?${params.toString()}`)
                          }
                        }} 
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

        {/* Google Ads Area */}
        <Card className="mt-8 border border-gray-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-center h-32 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <div className="text-center">
                <p className="text-gray-500 text-sm">Advertisement</p>
                <p className="text-gray-400 text-xs mt-1">Google Ads will appear here</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}