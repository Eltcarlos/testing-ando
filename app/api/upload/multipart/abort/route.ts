import { NextRequest, NextResponse } from "next/server";
import { abortMultipartUpload } from "@/lib/s3";
import { abortUploadSchema } from "@/lib/validations/multipart-upload";

/**
 * POST /api/upload/multipart/abort
 * Abort a multipart upload and clean up
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validationResult = abortUploadSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const { s3Key, s3UploadId } = validationResult.data;

    await abortMultipartUpload(s3Key, s3UploadId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error aborting multipart upload:", error);
    return NextResponse.json(
      { error: "Failed to abort upload" },
      { status: 500 }
    );
  }
}

