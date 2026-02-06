import { NextRequest, NextResponse } from "next/server";
import { completeMultipartUpload, getPublicVideoUrl } from "@/lib/s3";
import { completeUploadSchema } from "@/lib/validations/multipart-upload";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/upload/multipart/complete
 * Complete a multipart upload and create the video record in the database
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validationResult = completeUploadSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validationResult.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { s3Key, s3UploadId, parts, fileName, fileSize } =
      validationResult.data;

    // Complete the multipart upload in S3
    await completeMultipartUpload(s3Key, s3UploadId, parts);

    // Generate the public URL (uses CloudFront if configured)
    const publicUrl = getPublicVideoUrl(s3Key);

    // Create the video record in the database
    const video = await prisma.video.create({
      data: {
        fileName,
        url: publicUrl,
        s3Key, // Store the S3 key for generating presigned URLs later
        size: fileSize,
      },
    });

    return NextResponse.json({
      success: true,
      videoId: video.id,
      publicUrl,
    });
  } catch (error) {
    console.error("Error completing multipart upload:", error);
    return NextResponse.json(
      { error: "Failed to complete upload" },
      { status: 500 }
    );
  }
}
