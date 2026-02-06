import { NextRequest, NextResponse } from "next/server";
import {
  S3Client,
  PutObjectCommand,
} from "@aws-sdk/client-s3";

// Initialize S3 Client
const s3Client = new S3Client({
  region: process.env.S3_REGION!,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.S3_BUCKET!;

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
 * Generate unique S3 key with prefix
 */
function generateS3Key(originalFileName: string): string {
  const timestamp = generateDatePrefix();
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  const sanitizedName = originalFileName
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .toLowerCase();
  return `onboarding-forms/${timestamp}-${randomSuffix}-${sanitizedName}`;
}

export async function POST(request: NextRequest) {
  try {
    // Validate environment variables
    if (!process.env.S3_ACCESS_KEY_ID || !process.env.S3_SECRET_ACCESS_KEY || !process.env.S3_REGION || !BUCKET) {
      console.error("Missing AWS configuration");
      return NextResponse.json(
        { error: "AWS configuration not found" },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file size (50MB max for S3)
    const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size exceeds 50MB limit" },
        { status: 400 }
      );
    }

    // Validate file type (allow common document and image types)
    const ALLOWED_TYPES = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/plain",
      "text/csv",
      "application/zip",
      "application/x-zip-compressed",
    ];

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `File type not allowed. Allowed types: ${ALLOWED_TYPES.join(", ")}` },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate S3 key
    const s3Key = generateS3Key(file.name);

    // Upload to S3
    const command = new PutObjectCommand({
      Bucket: BUCKET,
      Key: s3Key,
      Body: buffer,
      ContentType: file.type,
      Metadata: {
        "original-name": file.name,
        "uploaded-at": new Date().toISOString(),
      },
    });

    try {
      await s3Client.send(command);
    } catch (s3Error) {
      console.error("S3 upload error:", s3Error);
      return NextResponse.json(
        { error: "Failed to upload file to S3. Please check AWS credentials." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      key: s3Key,
      s3Key: s3Key,
      filename: file.name,
      size: file.size,
      type: file.type,
      uploadedAt: new Date().toISOString(),
    });

  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to process upload request" },
      { status: 500 }
    );
  }
}

// GET method to check endpoint health
export async function GET() {
  const hasConfig = !!(
    process.env.S3_ACCESS_KEY_ID &&
    process.env.S3_SECRET_ACCESS_KEY &&
    process.env.S3_REGION &&
    process.env.S3_BUCKET
  );

  return NextResponse.json({
    message: "S3 Upload endpoint is ready",
    configured: hasConfig,
    maxSize: "50MB",
    allowedTypes: [
      "images (jpg, png, gif, webp)",
      "documents (pdf, doc, docx, xls, xlsx)",
      "text files (txt, csv)",
      "archives (zip)"
    ]
  });
}
