import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { nanoid } from "nanoid";

// Helper function to ensure upload directory exists
async function ensureUploadDir() {
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  try {
    await mkdir(uploadDir, { recursive: true });
  } catch (error) {
    console.error("Error creating upload directory:", error);
  }
  return uploadDir;
}

// Helper function to generate unique filename
function generateUniqueFilename(originalName: string) {
  const ext = path.extname(originalName);
  const nameWithoutExt = path.basename(originalName, ext);
  const uniqueId = nanoid(10);
  return `${nameWithoutExt}-${uniqueId}${ext}`;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file size (10MB max)
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size exceeds 10MB limit" },
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
      "text/csv"
    ];

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "File type not allowed" },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate unique filename and save
    const uploadDir = await ensureUploadDir();
    const uniqueFilename = generateUniqueFilename(file.name);
    const filePath = path.join(uploadDir, uniqueFilename);

    await writeFile(filePath, buffer);

    // Return the public URL
    const publicUrl = `/uploads/${uniqueFilename}`;

    return NextResponse.json({
      url: publicUrl,
      filename: uniqueFilename,
      originalName: file.name,
      size: file.size,
      type: file.type
    });

  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}

// GET method to check endpoint health
export async function GET() {
  return NextResponse.json({
    message: "Upload endpoint is ready",
    maxSize: "10MB",
    allowedTypes: [
      "images (jpg, png, gif, webp)",
      "documents (pdf, doc, docx, xls, xlsx)",
      "text files (txt, csv)"
    ]
  });
}