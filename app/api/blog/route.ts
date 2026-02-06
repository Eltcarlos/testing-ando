import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generatePresignedGetUrl } from "@/lib/s3";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = 30; // Fixed limit per page
    const skip = (page - 1) * limit;

    // Get published blogs with approved review status
    const [posts, total] = await Promise.all([
      prisma.blog_posts.findMany({
        where: {
          status: "published",
          reviewStatus: "approved",
        },
        orderBy: {
          publishedAt: "desc", // Most recent first
        },
        skip,
        take: limit,
      }),
      prisma.blog_posts.count({
        where: {
          status: "published",
          reviewStatus: "approved",
        },
      }),
    ]);

    // Get categories for the posts
    const categoryIds = [...new Set(posts.map(post => post.categoryId))];
    const categories = await prisma.categories.findMany({
      where: {
        id: { in: categoryIds },
      },
    });

    const categoryMap = Object.fromEntries(
      categories.map(cat => [cat.id, cat])
    );

    // Format posts with category information and generate public image URLs
    const formattedPosts = await Promise.all(posts.map(async post => {
      let featuredImageUrl = null;
      if (post.featuredImageKey) {
        try {
          featuredImageUrl = await generatePresignedGetUrl(post.featuredImageKey, 3600);
        } catch (error) {
          console.error(`Error generating URL for image ${post.featuredImageKey}:`, error);
        }
      }

      return {
        id: post.id,
        title: post.title,
        slug: post.slug,
        content: post.content,
        topic: post.topic,
        category: categoryMap[post.categoryId] || null,
        source: post.source,
        editorialTeamType: post.editorialTeamType,
        authorName: post.authorName,
        authorPosition: post.authorPosition,
        featuredImageKey: post.featuredImageKey,
        featuredImageUrl,
        publishedAt: post.publishedAt,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
      };
    }));

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      posts: formattedPosts,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore: page < totalPages,
      },
    });
  } catch (error) {
    console.error("Error fetching blog posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch blog posts" },
      { status: 500 }
    );
  }
}
