import type { NextApiRequest, NextApiResponse } from 'next'
import nextConnect from 'next-connect'
import multer from 'multer'
import { uploadFileToBackblaze } from '../../lib/storage/b2'

// Import from your b2.ts file
const upload = multer()
// Middleware to handle file uploads
const handler = nextConnect()
// Set up Next.js API route handler
handler.use(upload.single('file'))
// Handle single file uploads
// API route to handle file upload
handler.post(async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const file = (req as any).file
    // Get the uploaded file from the request
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' })
      // If no file is uploaded
    }
    // Upload the file to Backblaze and save the URL to Supabase
    const fileUrl = await uploadFileToBackblaze(file)
    // Return the file URL to the frontend
    res.status(200).json({ fileUrl })
  } catch (error) {
    res.status(500).json({ error: (error as Error).message })
  }
})

export default handler
// Export the API route handler

