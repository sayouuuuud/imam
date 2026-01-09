import { useState, useEffect } from "react"

export function useSignedUrl(fileKey: string | null) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    console.log('🔍 useSignedUrl Effect:', {
      fileKey,
      hasFileKey: !!fileKey,
      isHttpUrl: fileKey?.startsWith('http'),
      isUploadsPath: fileKey?.startsWith('uploads/'),
      isApiUrl: fileKey?.startsWith('/api/')
    })

    if (!fileKey) {
      console.log('ℹ️ No fileKey provided, setting null')
      setSignedUrl(null)
      setLoading(false)
      setError(null)
      return
    }
    // If it's already a full URL (not a B2 key), use it directly
    if (fileKey.startsWith("http")) {
      setSignedUrl(fileKey)
      setLoading(false)
      setError(null)
      return
    }

const fetchSignedUrl = async () => {
      console.log('🚀 Starting fetchSignedUrl for fileKey:', fileKey)
      setLoading(true)
      setError(null)
      try {
        const apiUrl = `/api/download?key=${encodeURIComponent(fileKey)}&format=json`
        console.log('🌐 Fetching from API:', apiUrl)

        const response = await fetch(apiUrl)
        console.log('📡 Raw response received:', response)
        console.log('📥 API Response:', {
          status: response.status,
          ok: response.ok,
          contentType: response.headers.get('content-type')
        })

        if (!response.ok) {
          const errorText = await response.text()
          console.error('❌ API Error Response:', errorText)
          throw new Error(`Failed to get signed URL: ${response.status} - ${errorText}`)
        }

        const data = await response.json()
        console.log('📦 API Response Data:', data)

        // If B2 is not configured, data.url will be null
        setSignedUrl(data.url)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load file")
        console.error("Error fetching signed URL:", err)
        // Set a placeholder URL when API fails
        setSignedUrl(null)
      } finally {
        setLoading(false)
      }
    }
    fetchSignedUrl()
  }, [fileKey])

  return { signedUrl, loading, error }
}
