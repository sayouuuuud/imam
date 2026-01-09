import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"

export type B2UploadInput = {
  key: string
  body: Buffer
  contentType: string
  cacheControl?: string
}

function requiredEnv(name: string): string {
  const v = process.env[name]
  if (!v) throw new Error(`${name} غير مضبوط`)
  return v
}

let _client: S3Client | null = null

export function getClient(): S3Client {
  if (_client) return _client

  const endpoint = requiredEnv("B2_S3_ENDPOINT")
  const accessKeyId = requiredEnv("B2_KEY_ID")
  const secretAccessKey = requiredEnv("B2_APPLICATION_KEY")

  _client = new S3Client({
    region: process.env.B2_REGION || "us-east-1",
    endpoint,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
    forcePathStyle: true,
  })

  return _client
}

export async function uploadToB2(input: B2UploadInput): Promise<{ key: string; url: string }> {
  const bucket = requiredEnv("B2_BUCKET")
  const client = getClient()

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: input.key,
      Body: input.body,
      ContentType: input.contentType,
      CacheControl: input.cacheControl || "public, max-age=31536000, immutable",
    }),
  )

  return {
    key: input.key,
    url: getPublicUrl(input.key),
  }
}

export function getPublicUrl(key: string): string {
  const bucket = requiredEnv("B2_BUCKET")
  const publicBase = process.env.B2_PUBLIC_URL_BASE?.replace(/\/$/, "")

  if (publicBase) {
    return `${publicBase}/${encodeURIComponentPath(key)}`
  }

  const endpoint = requiredEnv("B2_S3_ENDPOINT").replace(/\/$/, "")
  return `${endpoint}/${bucket}/${encodeURIComponentPath(key)}`
}

function encodeURIComponentPath(p: string): string {
  return p
    .split("/")
    .map((seg) => encodeURIComponent(seg))
    .join("/")
}