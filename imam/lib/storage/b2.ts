import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3" export type B2UploadInput = { key: string body: Buffer contentType: string cacheControl?: string }

function requiredEnv(name: string): string { const v = process.env[name] if (!v) throw new Error(`${name} غير مضبوط`) 
  return v } let _client: S3Client | null = null export 
function getClient(): S3Client { if (_client) 
  return _client const endpoint = requiredEnv("B2_S3_ENDPOINT") // e.g. https://s3.us-west-004.backblazeb2.com const accessKeyId = requiredEnv("B2_KEY_ID") const secretAccessKey = requiredEnv("B2_APPLICATION_KEY") _client = new S3Client({ region: process.env.B2_REGION || "us-east-1", endpoint, credentials: { accessKeyId, secretAccessKey }, // Backblaze supports both styles;

 path-style is more predictable for custom endpoints. forcePathStyle: true, }) 
  return _client } /** * Upload a file to Backblaze B2 using the S3-compatible API. */ export async 
function uploadToB2(input: B2UploadInput): Promise<{ key: string;
 url: string }>
 { const bucket = requiredEnv("B2_BUCKET") const client = getClient() await client.send( new PutObjectCommand({ Bucket: bucket, Key: input.key, Body: input.body, ContentType: input.contentType, CacheControl: input.cacheControl || "public, max-age=31536000, immutable", }), ) 
  return { key: input.key, url: getPublicUrl(input.key) } } /** * Build a public URL for a file key. * * Recommended: * - Public "Friendly URL" base: https://f00x.backblazeb2.com/file/<bucket>
 * Set B2_PUBLIC_URL_BASE to that value. * * Fallback: * - S3 path-style URL: <endpoint>
/<bucket>
/<key>
 */ export 
function getPublicUrl(key: string): string { const bucket = requiredEnv("B2_BUCKET") const publicBase = process.env.B2_PUBLIC_URL_BASE?.replace(/\/$/, "") if (publicBase) { 
  return `${publicBase}/${encodeURIComponentPath(key)}` }

const endpoint = requiredEnv("B2_S3_ENDPOINT").replace(/\/$/, "") // Path-style URL works with forcePathStyle 
  return `${endpoint}/${bucket}/${encodeURIComponentPath(key)}` }

function encodeURIComponentPath(p: string): string { // encode each segment but preserve '/' 
  return p .split("/") .map((seg) => encodeURIComponent(seg)) .join("/") }
