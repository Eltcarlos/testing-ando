import { z } from "zod";

export const createVideoSchema = z.object({
  fileName: z.string().min(1, "File name is required"),
  url: z.string().url("Invalid URL"),
  s3Key: z.string().min(1, "S3 key is required"),
  size: z.number().positive("Size must be positive"),
  duration: z.string().optional(),
  thumbnail: z.string().url("Invalid thumbnail URL").optional(),
});

export const presignedUrlSchema = z.object({
  fileName: z.string().min(1, "File name is required"),
  contentType: z
    .string()
    .regex(/^(video\/|image\/)/, "Content type must be a video or image format"),
});

export type CreateVideoInput = z.infer<typeof createVideoSchema>;
export type PresignedUrlInput = z.infer<typeof presignedUrlSchema>;

