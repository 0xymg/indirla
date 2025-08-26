'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Download, ArrowLeft, Clock } from 'lucide-react'

interface VideoFormat {
  format_id: string
  ext: string
  container: string
  resolution: string
  filesize?: number
  url?: string
}

function DownloadPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [countdown, setCountdown] = useState(5)
  const [isDownloading, setIsDownloading] = useState(false)
  
  // Get URL parameters
  const url = searchParams.get('url')
  const formatId = searchParams.get('format')
  const title = searchParams.get('title')
  const resolution = searchParams.get('resolution')
  const ext = searchParams.get('ext')
  const filesize = searchParams.get('filesize')

  useEffect(() => {
    if (!url || !formatId) {
      router.push('/')
      return
    }

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          startDownload()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [url, formatId, router])

  const startDownload = () => {
    setIsDownloading(true)
    
    if (formatId === 'direct' && searchParams.get('directUrl')) {
      window.location.href = searchParams.get('directUrl')!
    } else if (formatId === 'combined') {
      // Handle combined format (video + audio)
      const videoId = searchParams.get('videoId')
      const audioId = searchParams.get('audioId')
      window.location.href = `/api/stream?url=${encodeURIComponent(url!)}&video=${videoId}&audio=${audioId}`
    } else {
      window.location.href = `/api/stream?url=${encodeURIComponent(url!)}&format=${formatId}`
    }
  }

  const formatFileSize = (bytes: string) => {
    if (!bytes) return 'Unknown size'
    const mb = parseInt(bytes) / (1024 * 1024)
    return `${mb.toFixed(1)} MB`
  }

  const progress = ((5 - countdown) / 5) * 100

  if (!url || !formatId) {
    return null
  }

  return (
    <div className="min-h-screen bg-white py-12 px-4">
      <div className="container mx-auto max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push('/')}
            className="mb-4 text-gray-600 hover:text-black"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
          <h1 className="text-2xl font-semibold text-black mb-2">
            Download Ready
          </h1>
          <p className="text-gray-600">
            Your download will start automatically
          </p>
        </div>

        {/* Download Info Card */}
        <Card className="mb-8 border border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-medium text-black">
              {title || 'Video Download'}
            </CardTitle>
            <CardDescription>
              Preparing your download...
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Format Info */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Download className="h-5 w-5 text-gray-600" />
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="secondary" className="bg-gray-200 text-gray-700 border-0 text-xs">
                      {ext?.toUpperCase() || 'MP4'}
                    </Badge>
                    <Badge variant="outline" className="border-gray-300 text-gray-600 text-xs">
                      {resolution || 'Default'}
                    </Badge>
                  </div>
                  {filesize && (
                    <p className="text-sm text-gray-600">
                      {formatFileSize(filesize)}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Countdown */}
            {countdown > 0 && (
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center gap-2 text-lg font-medium text-black">
                  <Clock className="h-5 w-5" />
                  Starting download in {countdown} second{countdown !== 1 ? 's' : ''}
                </div>
                <Progress value={progress} className="w-full h-2" />
              </div>
            )}

            {isDownloading && (
              <div className="text-center space-y-4">
                <div className="text-lg font-medium text-green-600">
                  Download Started!
                </div>
                <p className="text-sm text-gray-600">
                  If the download doesn&apos;t start automatically, click the button below.
                </p>
                <Button
                  onClick={startDownload}
                  className="bg-black hover:bg-gray-800 text-white"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Manual Download
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Google Ads Area */}
        <Card className="border border-gray-200 shadow-sm">
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

export default function DownloadPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white py-12 px-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <DownloadPageContent />
    </Suspense>
  )
}