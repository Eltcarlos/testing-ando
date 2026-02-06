import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
  ListPartsCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { CHUNK_SIZE, PRESIGNED_URL_EXPIRY } from "@/lib/upload/constants";
import type { UploadPart } from "@/lib/upload/types";

const s3Client = new S3Client({
  region: process.env.S3_REGION!,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.S3_BUCKET!;
const CLOUDFRONT_DOMAIN = process.env.CLOUDFRONT_DOMAIN;

/**
 * Generate the public URL for a given S3 key
 * Uses CloudFront if configured, otherwise falls back to direct S3
 */
export function getPublicVideoUrl(key: string): string {
  if (CLOUDFRONT_DOMAIN) {
    return `https://${CLOUDFRONT_DOMAIN}/${key}`;
  }
  // Fallback to direct S3 URL
  return `https://${BUCKET}.s3.${process.env.S3_REGION}.amazonaws.com/${key}`;
}

export interface PresignedUploadResult {
  uploadUrl: string;
  key: string;
  publicUrl: string;
}

/**
 * Generate a presigned GET URL for an existing S3 object
 */
export async function generatePresignedGetUrl(key: string, expiresIn = 3600): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: key,
  });

  const url = await getSignedUrl(s3Client, command, { expiresIn });
  return url;
}

/**
 * Generate an ISO date prefix for unique file naming
 * Format: YYYYMMDD-HHMMSS
 */
function generateDatePrefix(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  return `${year}${month}${day}-${hours}${minutes}${seconds}`;
}

/**
 * Sanitize a filename by replacing spaces with underscores
 */
function sanitizeFileName(fileName: string): string {
  return fileName.replace(/\s+/g, "_");
}

/**
 * Generate a presigned URL for uploading a file directly to S3 from the browser
 * @param fileName - Name of the file to upload
 * @param contentType - MIME type of the file
 * @param folder - Optional folder prefix (defaults to 'videos')
 */
export async function generatePresignedUploadUrl(
  fileName: string,
  contentType: string,
  folder: string = 'videos'
): Promise<PresignedUploadResult> {
  const key = `${folder}/${generateDatePrefix()}-${sanitizeFileName(fileName)}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
  const publicUrl = getPublicVideoUrl(key);

  return { uploadUrl, key, publicUrl };
}

/**
 * Delete an object from S3
 */
export async function deleteS3Object(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET,
    Key: key,
  });

  await s3Client.send(command);
}

// ==================== MULTIPART UPLOAD FUNCTIONS ====================

export interface MultipartUploadInit {
  uploadId: string;
  key: string;
  publicUrl: string;
  parts: UploadPart[];
}

/**
 * Calculate upload parts for a file
 */
export function calculateUploadParts(fileSize: number): UploadPart[] {
  const parts: UploadPart[] = [];
  let partNumber = 1;
  let offset = 0;

  while (offset < fileSize) {
    const start = offset;
    const end = Math.min(offset + CHUNK_SIZE, fileSize);
    const size = end - start;

    parts.push({
      partNumber,
      start,
      end,
      size,
      uploaded: false,
    });

    partNumber++;
    offset = end;
  }

  return parts;
}

/**
 * Initiate a multipart upload
 */
export async function initiateMultipartUpload(
  fileName: string,
  contentType: string,
  fileSize: number
): Promise<MultipartUploadInit> {
  const key = `videos/${generateDatePrefix()}-${sanitizeFileName(fileName)}`;

  const command = new CreateMultipartUploadCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
  });

  const response = await s3Client.send(command);

  if (!response.UploadId) {
    throw new Error(
      "Failed to initiate multipart upload: no upload ID returned"
    );
  }

  const publicUrl = getPublicVideoUrl(key);
  const parts = calculateUploadParts(fileSize);

  return {
    uploadId: response.UploadId,
    key,
    publicUrl,
    parts,
  };
}

/**
 * Generate a presigned URL for uploading a specific part
 */
export async function getPresignedPartUrl(
  key: string,
  uploadId: string,
  partNumber: number
): Promise<string> {
  const command = new UploadPartCommand({
    Bucket: BUCKET,
    Key: key,
    UploadId: uploadId,
    PartNumber: partNumber,
  });

  return getSignedUrl(s3Client, command, { expiresIn: PRESIGNED_URL_EXPIRY });
}

/**
 * Complete a multipart upload
 */
export async function completeMultipartUpload(
  key: string,
  uploadId: string,
  parts: Array<{ partNumber: number; etag: string }>
): Promise<void> {
  const command = new CompleteMultipartUploadCommand({
    Bucket: BUCKET,
    Key: key,
    UploadId: uploadId,
    MultipartUpload: {
      Parts: parts
        .sort((a, b) => a.partNumber - b.partNumber)
        .map((part) => ({
          PartNumber: part.partNumber,
          ETag: part.etag,
        })),
    },
  });

  await s3Client.send(command);
}

/**
 * Abort a multipart upload
 */
export async function abortMultipartUpload(
  key: string,
  uploadId: string
): Promise<void> {
  const command = new AbortMultipartUploadCommand({
    Bucket: BUCKET,
    Key: key,
    UploadId: uploadId,
  });

  await s3Client.send(command);
}

/**
 * List parts that have been uploaded (useful for resume)
 */
export async function listUploadedParts(
  key: string,
  uploadId: string
): Promise<Array<{ partNumber: number; etag: string; size: number }>> {
  const command = new ListPartsCommand({
    Bucket: BUCKET,
    Key: key,
    UploadId: uploadId,
  });

  const response = await s3Client.send(command);

  return (response.Parts || []).map((part) => ({
    partNumber: part.PartNumber!,
    etag: part.ETag!,
    size: part.Size!,
  }));
}
