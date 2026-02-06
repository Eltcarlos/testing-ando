import { NextRequest, NextResponse } from "next/server";
import { initiateMultipartUpload } from "@/lib/s3";
import { initiateUploadSchema } from "@/lib/validations/multipart-upload";

/**
 * POST /api/upload/multipart/initiate
 * Initiate a multipart upload and return uploadId, s3Key, and part info
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validationResult = initiateUploadSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const { fileName, fileSize, contentType } = validationResult.data;

    const result = await initiateMultipartUpload(fileName, contentType, fileSize);

    // Generate a client-side upload ID for tracking
    const uploadId = crypto.randomUUID();

    return NextResponse.json({
      uploadId,
      s3UploadId: result.uploadId,
      s3Key: result.key,
      publicUrl: result.publicUrl,
      parts: result.parts,
    });
  } catch (error) {
    console.error("Error initiating multipart upload:", error);
    return NextResponse.json(
      { error: "Failed to initiate upload" },
      { status: 500 }
    );
  }
}

