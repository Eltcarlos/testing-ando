import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generatePresignedGetUrl } from "@/lib/s3";

/**
 * GET /api/videos
 * Fetch all videos with optional search filter
 * Returns presigned URLs for private S3 bucket access
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");

    const videos = await prisma.video.findMany({
      where: search
        ? {
            fileName: {
              contains: search,
              mode: "insensitive",
            },
          }
        : undefined,
      orderBy: {
        uploadedAt: "desc",
      },
    });

    // Generate presigned URLs for each video that has an s3Key
    const videosWithPresignedUrls = await Promise.all(
      videos.map(async (video) => {
        if (video.s3Key) {
          try {
            const presignedUrl = await generatePresignedGetUrl(
              video.s3Key,
              3600
            ); // 1 hour expiry
            return { ...video, url: presignedUrl };
          } catch {
            // If presigning fails, return original URL
            return video;
          }
        }
        return video;
      })
    );

    return NextResponse.json(videosWithPresignedUrls);
  } catch (error) {
    console.error("Error fetching videos:", error);
    return NextResponse.json(
      { error: "Failed to fetch videos" },
      { status: 500 }
    );
  }
}
