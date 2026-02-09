import { S3Client, PutObjectCommand, DeleteObjectCommand, HeadObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import crypto from "crypto";

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL;

let r2Client: S3Client | null = null;

function getR2Client(): S3Client {
  if (!r2Client) {
    if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
      throw new Error("R2 configuration missing. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY environment variables.");
    }

    r2Client = new S3Client({
      region: "auto",
      endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
      },
    });
  }
  return r2Client;
}

export function isR2Configured(): boolean {
  return !!(R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY && R2_BUCKET_NAME);
}

export function getR2PublicUrl(key: string): string {
  if (!R2_PUBLIC_URL) {
    throw new Error("R2_PUBLIC_URL not configured");
  }
  const baseUrl = R2_PUBLIC_URL.endsWith("/") ? R2_PUBLIC_URL.slice(0, -1) : R2_PUBLIC_URL;
  return `${baseUrl}/${key}`;
}

interface UploadResult {
  key: string;
  url: string;
  size: number;
}

export async function uploadToR2(
  buffer: Buffer,
  options: {
    folder?: string;
    filename?: string;
    contentType?: string;
  } = {}
): Promise<UploadResult> {
  const client = getR2Client();
  
  if (!R2_BUCKET_NAME) {
    throw new Error("R2_BUCKET_NAME not configured");
  }

  const folder = options.folder || "uploads";
  const extension = getExtensionFromContentType(options.contentType || "image/webp");
  const filename = options.filename || `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${extension}`;
  const key = `${folder}/${filename}`;

  await client.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: options.contentType || "image/webp",
    })
  );

  return {
    key,
    url: getR2PublicUrl(key),
    size: buffer.length,
  };
}

export async function uploadBase64ToR2(
  base64Data: string,
  options: {
    folder?: string;
    filename?: string;
    contentType?: string;
  } = {}
): Promise<UploadResult> {
  let data = base64Data;
  let detectedContentType = options.contentType;

  if (base64Data.includes("base64,")) {
    const parts = base64Data.split("base64,");
    data = parts[1];
    if (!detectedContentType && parts[0]) {
      const match = parts[0].match(/data:([^;]+)/);
      if (match) {
        detectedContentType = match[1];
      }
    }
  }

  const buffer = Buffer.from(data, "base64");
  return uploadToR2(buffer, {
    ...options,
    contentType: detectedContentType || options.contentType,
  });
}

export async function deleteFromR2(key: string): Promise<void> {
  const client = getR2Client();
  
  if (!R2_BUCKET_NAME) {
    throw new Error("R2_BUCKET_NAME not configured");
  }

  await client.send(
    new DeleteObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
    })
  );
}

export async function checkObjectExists(key: string): Promise<boolean> {
  const client = getR2Client();
  
  if (!R2_BUCKET_NAME) {
    throw new Error("R2_BUCKET_NAME not configured");
  }

  try {
    await client.send(
      new HeadObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
      })
    );
    return true;
  } catch {
    return false;
  }
}

function getExtensionFromContentType(contentType: string): string {
  const map: Record<string, string> = {
    "image/webp": ".webp",
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/gif": ".gif",
    "image/svg+xml": ".svg",
    "video/mp4": ".mp4",
    "video/webm": ".webm",
  };
  return map[contentType] || ".bin";
}

export function extractKeyFromUrl(url: string): string | null {
  if (!R2_PUBLIC_URL) return null;

  const baseUrl = R2_PUBLIC_URL.endsWith("/") ? R2_PUBLIC_URL.slice(0, -1) : R2_PUBLIC_URL;
  if (url.startsWith(baseUrl)) {
    return url.slice(baseUrl.length + 1);
  }
  return null;
}

export async function getObjectFromR2(key: string): Promise<{ body: Buffer; contentType: string } | null> {
  const client = getR2Client();

  if (!R2_BUCKET_NAME) {
    throw new Error("R2_BUCKET_NAME not configured");
  }

  try {
    const response = await client.send(
      new GetObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
      })
    );

    if (!response.Body) return null;

    const chunks: Uint8Array[] = [];
    for await (const chunk of response.Body as AsyncIterable<Uint8Array>) {
      chunks.push(chunk);
    }
    const body = Buffer.concat(chunks);

    return {
      body,
      contentType: response.ContentType || "application/octet-stream",
    };
  } catch {
    return null;
  }
}
