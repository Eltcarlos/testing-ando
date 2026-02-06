/**
 * Types for the resumable upload system
 */

export type UploadStatus =
  | "pending"
  | "initializing"
  | "uploading"
  | "paused"
  | "completing"
  | "completed"
  | "failed"
  | "cancelled";

export interface UploadPart {
  partNumber: number;
  start: number;
  end: number;
  size: number;
  etag?: string;
  uploaded: boolean;
}

export interface UploadMetadata {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  s3Key: string;
  s3UploadId?: string;
  status: UploadStatus;
  progress: number;
  parts: UploadPart[];
  completedParts: number;
  totalParts: number;
  createdAt: number;
  updatedAt: number;
  error?: string;
  publicUrl?: string;
}

export interface UploadChunk {
  uploadId: string;
  partNumber: number;
  data: ArrayBuffer;
}

// API Request/Response types
export interface InitiateUploadRequest {
  fileName: string;
  fileSize: number;
  contentType: string;
}

export interface InitiateUploadResponse {
  uploadId: string;
  s3UploadId: string;
  s3Key: string;
  publicUrl: string;
  parts: UploadPart[];
}

export interface PresignPartRequest {
  s3Key: string;
  s3UploadId: string;
  partNumber: number;
}

export interface PresignPartResponse {
  presignedUrl: string;
  partNumber: number;
}

export interface CompleteUploadRequest {
  s3Key: string;
  s3UploadId: string;
  parts: Array<{ partNumber: number; etag: string }>;
  fileName: string;
  fileSize: number;
}

export interface CompleteUploadResponse {
  success: boolean;
  videoId: string;
  publicUrl: string;
}

export interface AbortUploadRequest {
  s3Key: string;
  s3UploadId: string;
}

// Service Worker message types
export type WorkerMessageType =
  | "START_UPLOAD"
  | "PAUSE_UPLOAD"
  | "RESUME_UPLOAD"
  | "CANCEL_UPLOAD"
  | "UPLOAD_PROGRESS"
  | "UPLOAD_COMPLETE"
  | "UPLOAD_ERROR"
  | "UPLOAD_PART_COMPLETE";

export interface WorkerMessage {
  type: WorkerMessageType;
  uploadId: string;
  payload?: unknown;
}

export interface UploadProgressPayload {
  uploadId: string;
  progress: number;
  completedParts: number;
  totalParts: number;
  currentPart: number;
}

export interface UploadCompletePayload {
  uploadId: string;
  publicUrl: string;
  videoId: string;
}

export interface UploadErrorPayload {
  uploadId: string;
  error: string;
  recoverable: boolean;
}

