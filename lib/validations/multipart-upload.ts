import { z } from "zod";
import { VALID_VIDEO_TYPES, MAX_FILE_SIZE } from "@/lib/upload/constants";

export const initiateUploadSchema = z.object({
  fileName: z.string().min(1, "File name is required"),
  fileSize: z
    .number()
    .positive("File size must be positive")
    .max(MAX_FILE_SIZE, "File size exceeds maximum allowed"),
  contentType: z.string().refine(
    (type) => VALID_VIDEO_TYPES.includes(type),
    "Invalid video content type"
  ),
});

export const presignPartSchema = z.object({
  s3Key: z.string().min(1, "S3 key is required"),
  s3UploadId: z.string().min(1, "S3 upload ID is required"),
  partNumber: z.number().int().positive("Part number must be a positive integer"),
});

export const completeUploadSchema = z.object({
  s3Key: z.string().min(1, "S3 key is required"),
  s3UploadId: z.string().min(1, "S3 upload ID is required"),
  parts: z.array(
    z.object({
      partNumber: z.number().int().positive(),
      etag: z.string().min(1, "ETag is required"),
    })
  ).min(1, "At least one part is required"),
  fileName: z.string().min(1, "File name is required"),
  fileSize: z.number().positive("File size must be positive"),
});

export const abortUploadSchema = z.object({
  s3Key: z.string().min(1, "S3 key is required"),
  s3UploadId: z.string().min(1, "S3 upload ID is required"),
});

export type InitiateUploadInput = z.infer<typeof initiateUploadSchema>;
export type PresignPartInput = z.infer<typeof presignPartSchema>;
export type CompleteUploadInput = z.infer<typeof completeUploadSchema>;
export type AbortUploadInput = z.infer<typeof abortUploadSchema>;

