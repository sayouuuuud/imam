import { useState, useEffect } from "react"

export function useSignedUrl(fileKey: string | null) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!fileKey) {
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
      setLoading(true)
      setError(null)
      try {
        const response = await fetch(`/api/download?key=${encodeURIComponent(fileKey)}&format=json`)
        if (!response.ok) {
          throw new Error("Failed to get signed URL")
        }

const data = await response.json()
        setSignedUrl(data.url)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load file")
        console.error("Error fetching signed URL:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchSignedUrl()
  }, [fileKey])

  return { signedUrl, loading, error }
}
