import { NextRequest, NextResponse } from "next/server";
import { generatePresignedUploadUrl } from "@/lib/s3";
import { presignedUrlSchema } from "@/lib/validations/video";

/**
 * POST /api/upload/presigned
 * Generate a presigned URL for direct S3 upload from the browser
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validationResult = presignedUrlSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const { fileName, contentType } = validationResult.data;
    
    // Determine folder based on content type
    const folder = contentType.startsWith('image/') ? 'images/blog' : 'videos';
    
    const result = await generatePresignedUploadUrl(fileName, contentType, folder);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error generating presigned URL:", error);
    return NextResponse.json(
      { error: "Failed to generate upload URL" },
      { status: 500 }
    );
  }
}

