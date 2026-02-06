import { NextRequest, NextResponse } from "next/server";
import { getPresignedPartUrl } from "@/lib/s3";
import { presignPartSchema } from "@/lib/validations/multipart-upload";

/**
 * POST /api/upload/multipart/presign-part
 * Generate a presigned URL for uploading a specific part
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validationResult = presignPartSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const { s3Key, s3UploadId, partNumber } = validationResult.data;

    const presignedUrl = await getPresignedPartUrl(s3Key, s3UploadId, partNumber);

    return NextResponse.json({
      presignedUrl,
      partNumber,
    });
  } catch (error) {
    console.error("Error generating presigned part URL:", error);
    return NextResponse.json(
      { error: "Failed to generate presigned URL" },
      { status: 500 }
    );
  }
}

