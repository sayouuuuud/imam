import type { NextApiRequest, NextApiResponse } from 'next'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const s3 = new S3Client({
  region: process.env.B2_REGION!,
  endpoint: process.env.B2_S3_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.B2_KEY_ID!,
    secretAccessKey: process.env.B2_APPLICATION_KEY!,
  },
})

async function getPreSignedUrl(key: string) {
  const command = new GetObjectCommand({
    Bucket: process.env.B2_BUCKET!,
    Key: key,
  })
  // Generate a signed URL with a 1-hour expiration time
  const url = await getSignedUrl(s3, command, { expiresIn: 3600 })

  return url
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { fileKey } = req.query
    if (!fileKey) {
      return res.status(400).json({ error: 'File key is required' })
    }
    // Get the pre-signed URL for the requested file
    const preSignedUrl = await getPreSignedUrl(fileKey as string)
    // Return the pre-signed URL to the frontend
    res.status(200).json({ fileUrl: preSignedUrl })
  } catch (error) {
    res.status(500).json({ error: (error as Error).message })
  }
}

