'use client'

import { useState } from 'react'

export default function Home() {
  const [url, setUrl] = useState('')
  const [videoInfo, setVideoInfo] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const fetchVideoInfo = async () => {
    if (!url) return alert('Please enter a YouTube URL')
    setLoading(true)
    try {
      const res = await fetch('/api/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })
      if (!res.ok) throw new Error('Failed to fetch video info')
      const data = await res.json()
      console.log('Fetched video info:', data)
      setVideoInfo(data)
    } catch (err) {
      alert('Error fetching video info')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = (f: any) => {
    if (f.url) {
      window.location.href = f.url
    } else if (f.videoId && f.audioId) {
      window.location.href = `/api/stream?url=${encodeURIComponent(url)}&video=${f.videoId}&audio=${f.audioId}`
    } else {
      window.location.href = `/api/stream?url=${encodeURIComponent(url)}&format=${f.format_id}`
    }
  }

  return (
    <main style={{ maxWidth: 600, margin: '50px auto', textAlign: 'center' }}>
      <h1>YouTube Downloader</h1>
      <input
        type="text"
        placeholder="Enter YouTube URL"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        style={{ width: '100%', padding: '10px', marginBottom: '10px' }}
      />
      <br />
      <button onClick={fetchVideoInfo} style={{ padding: '10px 20px' }} disabled={loading}>
        {loading ? 'Loading...' : 'Fetch Formats'}
      </button>

      {videoInfo && (
        <div style={{ marginTop: '30px' }}>
          <h2>{videoInfo.title}</h2>
          <img src={`/api/proxy-image?url=${encodeURIComponent(videoInfo.thumbnail)}`} alt="thumbnail" style={{ maxWidth: '100%' }} />
          <h3>Available Formats:</h3>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {Array.isArray(videoInfo?.formats) && videoInfo.formats.map((f: any) => (
              <li key={f.format_id} style={{ margin: '10px 0' }}>
                <button onClick={() => handleDownload(f)} style={{ padding: '8px 16px' }}>
                  {f.ext} - {f.resolution}
                </button>
              </li>
            ))}
          </ul>

          {videoInfo.bestAudio && (
            <>
              <h3>Download Audio (Best Quality):</h3>
              <button onClick={() => handleDownload(videoInfo.bestAudio)} style={{ padding: '8px 16px' }}>
                {videoInfo.bestAudio.ext}
              </button>
            </>
          )}

          {videoInfo.combinedFormat && (
            <>
              <h3>Download Combined Video + Audio:</h3>
              <button onClick={() => handleDownload(videoInfo.combinedFormat)} style={{ padding: '8px 16px' }}>
                {videoInfo.combinedFormat.ext} - {videoInfo.combinedFormat.resolution}
              </button>
            </>
          )}

          {videoInfo.url && (!videoInfo.formats || videoInfo.formats.length === 0) && (
            <div style={{ marginTop: '20px' }}>
              <h3>Direct Twitter Video:</h3>
              <button onClick={() => window.location.href = videoInfo.url} style={{ padding: '8px 16px' }}>
                Download MP4
              </button>
            </div>
          )}
        </div>
      )}
    </main>
  )
}