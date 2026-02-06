/**
 * Constants for the resumable upload system
 */

// Chunk size: 10MB (S3 minimum is 5MB except for last part)
export const CHUNK_SIZE = 10 * 1024 * 1024;

// Maximum file size: 5GB (can go higher but this is reasonable)
export const MAX_FILE_SIZE = 5 * 1024 * 1024 * 1024;

// Minimum file size for multipart (below this, use simple upload)
export const MULTIPART_THRESHOLD = 100 * 1024 * 1024; // 100MB

// Retry configuration
export const MAX_RETRIES = 3;
export const RETRY_DELAY_BASE = 1000; // 1 second base delay
export const RETRY_DELAY_MAX = 30000; // 30 seconds max delay

// Presigned URL expiry: 1 hour
export const PRESIGNED_URL_EXPIRY = 3600;

// IndexedDB configuration
export const DB_NAME = "video-uploads";
export const DB_VERSION = 3; // Incremented to handle previous upgrade attempts
export const UPLOADS_STORE = "uploads";
export const CHUNKS_STORE = "chunks";

// Valid video MIME types
export const VALID_VIDEO_TYPES = [
  "video/mp4",
  "video/quicktime",
  "video/x-msvideo",
  "video/webm",
  "video/x-matroska",
];

// Service Worker registration path
export const UPLOAD_WORKER_PATH = "/upload-worker.js";

